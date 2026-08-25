import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { Notification, NotificationType } from '../notifications/notification.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { PointHistory, PointTransactionType } from './point-history.entity';
import { LoyaltyTier } from './loyalty-tier.entity';
import { LoyaltyTierHistory, LoyaltyTierChangeReason } from './loyalty-tier-history.entity';
import { User } from '../users/user.entity';
import { AdminAdjustPointsDto } from './dto/admin-adjust-points.dto';
import { UpdateLoyaltyTierDto } from './dto/update-loyalty-tier.dto';

@Injectable()
export class PointsService implements OnModuleInit {
  constructor(
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>,
    @InjectRepository(LoyaltyTier)
    private readonly loyaltyTierRepository: Repository<LoyaltyTier>,
    @InjectRepository(LoyaltyTierHistory)
    private readonly loyaltyTierHistoryRepository: Repository<LoyaltyTierHistory>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    try {
      // 1. Ensure table schemas and columns exist
      await this.dataSource.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS points INT DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_id UUID;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS total_spent NUMERIC(14,0) DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS total_products_purchased INT DEFAULT 0;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS last_order_completed_at TIMESTAMPTZ;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS tier_evaluated_at TIMESTAMPTZ;
        
        CREATE TABLE IF NOT EXISTS point_histories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          points INT NOT NULL,
          balance INT NOT NULL,
          type VARCHAR(50) NOT NULL,
          reference_id VARCHAR(255),
          description TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_point_histories_user_created ON point_histories(user_id, created_at DESC);

        CREATE TABLE IF NOT EXISTS loyalty_tiers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tier_level INT NOT NULL UNIQUE,
          name VARCHAR(100) NOT NULL,
          min_spent NUMERIC(14,0) NOT NULL DEFAULT 0,
          min_products INT NOT NULL DEFAULT 0,
          discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
          bonus_point_rate NUMERIC(4,2) NOT NULL DEFAULT 1.0,
          color VARCHAR(50) DEFAULT '#8B5CF6',
          description TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS loyalty_tier_histories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          old_tier_id UUID REFERENCES loyalty_tiers(id) ON DELETE SET NULL,
          new_tier_id UUID NOT NULL REFERENCES loyalty_tiers(id) ON DELETE CASCADE,
          total_spent_at_eval NUMERIC(14,0) DEFAULT 0,
          total_products_at_eval INT DEFAULT 0,
          change_reason VARCHAR(50) NOT NULL,
          description TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_loyalty_tier_histories_user ON loyalty_tier_histories(user_id, created_at DESC);
      `);

      // 2. Seed or update default 5 tiers
      const defaultTiers = [
        {
          tierLevel: 1,
          name: 'Đồng',
          minSpent: 0,
          minProducts: 0,
          discountPercent: 0,
          bonusPointRate: 1.0,
          color: '#CD7F32',
          description: 'Hạng khởi đầu dành cho thành viên mới.',
        },
        {
          tierLevel: 2,
          name: 'Bạc',
          minSpent: 350000,
          minProducts: 5,
          discountPercent: 0,
          bonusPointRate: 1.1,
          color: '#94A3B8',
          description: 'Đã hoàn thành tối thiểu 350.000 đồng và 5 sản phẩm.',
        },
        {
          tierLevel: 3,
          name: 'Vàng',
          minSpent: 850000,
          minProducts: 10,
          discountPercent: 0,
          bonusPointRate: 1.25,
          color: '#F59E0B',
          description: 'Đã hoàn thành tối thiểu 850.000 đồng và 10 sản phẩm.',
        },
        {
          tierLevel: 4,
          name: 'Bạch Kim',
          minSpent: 3500000,
          minProducts: 30,
          discountPercent: 0,
          bonusPointRate: 1.5,
          color: '#0EA5E9',
          description: 'Đã hoàn thành tối thiểu 3.500.000 đồng và 30 sản phẩm.',
        },
        {
          tierLevel: 5,
          name: 'Kim Cương',
          minSpent: 10000000,
          minProducts: 70,
          discountPercent: 0,
          bonusPointRate: 2.0,
          color: '#00BCD4',
          description: 'Hạng đặc quyền cao nhất, tối thiểu 10.000.000 đồng và 70 sản phẩm.',
        },
      ];

      for (const tierData of defaultTiers) {
        const existing = await this.loyaltyTierRepository.findOne({ where: { tierLevel: tierData.tierLevel } });
        if (existing) {
          existing.minSpent = tierData.minSpent;
          existing.minProducts = tierData.minProducts;
          existing.color = tierData.color;
          existing.description = tierData.description;
          await this.loyaltyTierRepository.save(existing);
        } else {
          const tier = this.loyaltyTierRepository.create(tierData);
          await this.loyaltyTierRepository.save(tier);
        }
      }
    } catch (error) {
      console.error('Failed to initialize loyalty_tiers schema/seeds:', error);
    }
  }

  /**
   * Add or deduct points for a user atomically.
   */
  async addPoints(
    userId: string,
    points: number,
    type: PointTransactionType,
    referenceId?: string,
    description?: string,
    entityManager?: EntityManager,
  ): Promise<{ newBalance: number; historyRecord: PointHistory }> {
    if (!userId) {
      throw new BadRequestException('User ID không hợp lệ');
    }
    if (points === 0) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('Người dùng không tồn tại');
      return { newBalance: user.points || 0, historyRecord: null };
    }

    const executeWork = async (manager: EntityManager) => {
      const userRepo = manager.getRepository(User);
      const historyRepo = manager.getRepository(PointHistory);

      const user = await userRepo.findOne({
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại');
      }

      const currentBalance = user.points || 0;
      const newBalance = Math.max(0, currentBalance + points);

      user.points = newBalance;
      await userRepo.save(user);

      const historyRecord = historyRepo.create({
        userId,
        points,
        balance: newBalance,
        type,
        referenceId: referenceId || null,
        description: description || null,
      });

      const savedHistory = await historyRepo.save(historyRecord);

      return { newBalance, historyRecord: savedHistory };
    };

    if (entityManager) {
      return executeWork(entityManager);
    } else {
      return this.dataSource.transaction(executeWork);
    }
  }

  /**
   * Automatically check and award missing points for completed orders
   */
  async syncMissingPointsForCompletedOrders(userId: string) {
    if (!userId) return;

    try {
      const completedOrders = await this.dataSource.query(
        `SELECT id, order_code, total_amount, shipping_fee, user_id 
         FROM orders 
         WHERE (user_id = $1 OR user_id::text = $1::text OR (shipping_address_phone IS NOT NULL AND shipping_address_phone != '' AND shipping_address_phone = (SELECT phone FROM users WHERE id = $1 AND phone IS NOT NULL AND phone != '')))
           AND LOWER(order_status::text) = 'completed'`,
        [userId],
      );

      if (!completedOrders || completedOrders.length === 0) return;

      for (const order of completedOrders) {
        const existingRecord = await this.pointHistoryRepository.findOne({
          where: {
            userId,
            referenceId: order.id,
            type: PointTransactionType.ORDER_COMPLETED,
          },
        });

        if (!existingRecord) {
          const eligibleAmount = Math.max(
            0,
            Number(order.total_amount || 0) - Number(order.shipping_fee || 0),
          );
          const earnedPoints = Math.floor(eligibleAmount / 1000);

          if (earnedPoints > 0) {
            await this.addPoints(
              userId,
              earnedPoints,
              PointTransactionType.ORDER_COMPLETED,
              order.id,
              `Tích điểm từ đơn hàng ${order.order_code}`,
            );
          }
        }
      }
    } catch (err) {
      console.error('Failed to sync missing points for completed orders:', err);
    }
  }

  /**
   * Get points and history
   */
  async getUserPoints(userId: string) {
    await this.syncMissingPointsForCompletedOrders(userId);

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    const history = await this.pointHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return {
      points: user.points || 0,
      history,
    };
  }

  /**
   * Paginated point history
   */
  async getUserPointHistory(userId: string, page = 1, limit = 10) {
    await this.syncMissingPointsForCompletedOrders(userId);

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    const [items, total] = await this.pointHistoryRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limitNum,
      skip,
    });

    return {
      points: user.points || 0,
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    };
  }

  /**
   * Admin manual points adjustment
   */
  async adjustPointsByAdmin(adminId: string, dto: AdminAdjustPointsDto) {
    const { userId, points, reason } = dto;
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Người dùng được chọn không tồn tại');
    }

    const description = `Admin điều chỉnh: ${reason}`;
    const result = await this.addPoints(
      userId,
      points,
      PointTransactionType.ADMIN_ADJUSTMENT,
      adminId,
      description,
    );

    return {
      message: `Đã điều chỉnh ${points > 0 ? '+' : ''}${points} điểm cho người dùng thành công.`,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        points: result.newBalance,
      },
      history: result.historyRecord,
    };
  }

  // =========================================================================
  // LOYALTY TIER SERVICES (HỆ THỐNG BẬC HẠNG THÀNH VIÊN)
  // =========================================================================

  /**
   * Evaluates user stats (total spent & product count) from completed orders
   * and updates user tier accordingly.
   * Handles:
   * 1. 1-Year Inactivity Reset: If no completed order within 365 days, drops to Tier 1.
   * 2. Dual-condition check: Must satisfy BOTH minSpent AND minProducts to qualify for a tier.
   */
  async evaluateUserTier(userId: string, isQuarterlyCheck = false): Promise<{
    user: User;
    tierChanged: boolean;
    oldTier?: LoyaltyTier;
    newTier: LoyaltyTier;
    reason?: LoyaltyTierChangeReason;
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { currentTier: true },
    });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    // 1. Calculate actual stats from completed orders in DB
    const orderStatsQuery = await this.dataSource.query(
      `SELECT 
        COALESCE(SUM(o.total_amount - o.shipping_fee), 0) AS "totalSpent",
        MAX(o.created_at) AS "lastOrderCompletedAt",
        COUNT(o.id) AS "completedOrdersCount"
       FROM orders o
       WHERE (o.user_id = $1 OR o.user_id::text = $1::text)
         AND LOWER(o.order_status::text) = 'completed'`,
      [userId],
    );

    const productCountQuery = await this.dataSource.query(
      `SELECT COALESCE(SUM(oi.quantity), 0) AS "totalProducts"
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE (o.user_id = $1 OR o.user_id::text = $1::text)
         AND LOWER(o.order_status::text) = 'completed'`,
      [userId],
    );

    const totalSpent = Number(orderStatsQuery[0]?.totalSpent || 0);
    const totalProducts = Number(productCountQuery[0]?.totalProducts || 0);
    const lastOrderCompletedAtStr = orderStatsQuery[0]?.lastOrderCompletedAt;
    const lastOrderCompletedAt = lastOrderCompletedAtStr ? new Date(lastOrderCompletedAtStr) : null;

    // 2. Fetch all 5 Tiers ordered by tier_level descending (5 -> 1)
    const tiers = await this.loyaltyTierRepository.find({
      order: { tierLevel: 'DESC' },
    });
    if (!tiers || tiers.length === 0) {
      throw new BadRequestException('Hệ thống chưa thiết lập các Bậc hạng');
    }

    const tier1 = tiers.find((t) => t.tierLevel === 1) || tiers[tiers.length - 1];

    // 3. Check 1-Year Inactivity Rule:
    // If user has not purchased/paid for any completed order in the last 1 year (365 days)
    const now = new Date();
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    const isInactiveForOneYear =
      !lastOrderCompletedAt || now.getTime() - lastOrderCompletedAt.getTime() > oneYearInMs;

    let targetTier = tier1;
    let changeReason: LoyaltyTierChangeReason | null = null;

    if (isInactiveForOneYear && user.currentTier && user.currentTier.tierLevel > 1) {
      // User loses all tiers and resets to Tier 1 (Bronze)
      targetTier = tier1;
      changeReason = LoyaltyTierChangeReason.INACTIVE_1_YEAR_RESET;
    } else {
      // Determine highest tier matching BOTH conditions (minSpent AND minProducts)
      for (const tier of tiers) {
        const minSpentReq = Number(tier.minSpent || 0);
        const minProductsReq = Number(tier.minProducts || 0);

        if (totalSpent >= minSpentReq && totalProducts >= minProductsReq) {
          targetTier = tier;
          break;
        }
      }

      if (user.currentTier?.id !== targetTier.id) {
        changeReason = isQuarterlyCheck
          ? LoyaltyTierChangeReason.QUARTERLY_REVIEW
          : LoyaltyTierChangeReason.ORDER_COMPLETED_UPGRADE;
      }
    }

    const oldTier = user.currentTier;
    const tierChanged = !oldTier || oldTier.id !== targetTier.id;

    // Update user stats and tier reference
    user.totalSpent = totalSpent;
    user.totalProductsPurchased = totalProducts;
    user.lastOrderCompletedAt = lastOrderCompletedAt;
    user.tierEvaluatedAt = now;
    user.tierId = targetTier.id;
    user.currentTier = targetTier;

    await this.userRepository.save(user);

    // Save history record if tier changed
    if (tierChanged) {
      let description = '';
      if (changeReason === LoyaltyTierChangeReason.INACTIVE_1_YEAR_RESET) {
        description = `Không phát sinh mua hàng/thanh toán trong vòng 1 năm. Mất tất cả hạng và hạ xuống ${targetTier.name}.`;
      } else if (changeReason === LoyaltyTierChangeReason.QUARTERLY_REVIEW) {
        description = `Tổng kết hạng 3 tháng: Cập nhật sang hạng ${targetTier.name} (Doanh số: ${totalSpent.toLocaleString('vi-VN')}đ, Sản phẩm: ${totalProducts}).`;
      } else {
        description = `Nâng hạng tự động khi hoàn thành đơn hàng: ${targetTier.name}.`;
      }

      const historyRecord = this.loyaltyTierHistoryRepository.create({
        userId,
        oldTierId: oldTier?.id || null,
        newTierId: targetTier.id,
        totalSpentAtEval: totalSpent,
        totalProductsAtEval: totalProducts,
        changeReason,
        description,
      });

      await this.loyaltyTierHistoryRepository.save(historyRecord);

      // Create Notification for Tier Change (Upgrade / Downgrade / Adjustment)
      try {
        let notificationTitle = `👑 Hạng thành viên của bạn vừa được cập nhật: ${targetTier.name}`;
        if (oldTier && targetTier.tierLevel > oldTier.tierLevel) {
          notificationTitle = `🎉 Chúc mừng! Bạn đã thăng hạng ${targetTier.name}!`;
        } else if (oldTier && targetTier.tierLevel < oldTier.tierLevel) {
          notificationTitle = `⚠️ Hạng thành viên của bạn đã điều chỉnh sang: ${targetTier.name}`;
        }

        await this.notificationRepository.save(
          this.notificationRepository.create({
            userId,
            type: NotificationType.LOYALTY_TIER_CHANGED,
            title: notificationTitle,
            message: description,
            isRead: false,
          }),
        );
      } catch (err) {
        console.error('Error creating tier change notification:', err);
      }
    }

    return {
      user,
      tierChanged,
      oldTier,
      newTier: targetTier,
      reason: changeReason,
    };
  }

  /**
   * Quarterly 3-Month Recalculation across all active non-guest users
   */
  async recalculateAllUsersLoyalty() {
    const users = await this.userRepository.find({
      where: [
        { role: 'customer' as any },
        { role: 'admin' as any },
        { role: 'store_manager' as any },
        { role: 'staff' as any },
      ],
    });

    let upgradedUsers = 0;
    let retainedUsers = 0;
    let resetInactiveUsers = 0;

    for (const u of users) {
      try {
        const result = await this.evaluateUserTier(u.id, true);
        if (result.tierChanged) {
          if (result.reason === LoyaltyTierChangeReason.INACTIVE_1_YEAR_RESET) {
            resetInactiveUsers++;
          } else {
            upgradedUsers++;
          }
        } else {
          retainedUsers++;
        }
      } catch (err) {
        console.error(`Error evaluating tier for user ${u.id}:`, err);
      }
    }

    return {
      message: 'Đã hoàn tất tổng kết hạng thành viên 3 tháng.',
      totalUsers: users.length,
      upgradedUsers,
      retainedUsers,
      resetInactiveUsers,
      evaluatedAt: new Date(),
    };
  }

  /**
   * Get user loyalty status & progress towards next tier
   */
  async getUserLoyaltyStatus(userId: string) {
    // Sync current stats
    await this.evaluateUserTier(userId, false);

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { currentTier: true },
    });

    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    const allTiers = await this.loyaltyTierRepository.find({
      order: { tierLevel: 'ASC' },
    });

    const currentTierLevel = user.currentTier?.tierLevel || 1;
    const currentTier = user.currentTier || allTiers.find((t) => t.tierLevel === 1) || allTiers[0];
    const nextTier = allTiers.find((t) => t.tierLevel === currentTierLevel + 1) || null;

    const totalSpent = Number(user.totalSpent || 0);
    const totalProducts = Number(user.totalProductsPurchased || 0);

    let progressSpentPercent = 100;
    let progressProductsPercent = 100;
    let spentNeeded = 0;
    let productsNeeded = 0;

    if (nextTier) {
      const nextMinSpent = Number(nextTier.minSpent || 0);
      const nextMinProducts = Number(nextTier.minProducts || 0);

      spentNeeded = Math.max(0, nextMinSpent - totalSpent);
      productsNeeded = Math.max(0, nextMinProducts - totalProducts);

      progressSpentPercent = nextMinSpent > 0 ? Math.min(100, Math.round((totalSpent / nextMinSpent) * 100)) : 100;
      progressProductsPercent = nextMinProducts > 0 ? Math.min(100, Math.round((totalProducts / nextMinProducts) * 100)) : 100;
    }

    const lastEval = user.tierEvaluatedAt ? new Date(user.tierEvaluatedAt) : (user.createdAt ? new Date(user.createdAt) : new Date());
    const nextEvaluationDate = new Date(lastEval.getTime() + 90 * 24 * 60 * 60 * 1000);

    return {
      currentTier,
      nextTier,
      totalSpent,
      totalProductsPurchased: totalProducts,
      lastOrderCompletedAt: user.lastOrderCompletedAt,
      tierEvaluatedAt: user.tierEvaluatedAt,
      nextEvaluationDate,
      progress: {
        spentPercent: progressSpentPercent,
        productsPercent: progressProductsPercent,
        spentNeeded,
        productsNeeded,
      },
      allTiers,
      history: [],
    };
  }

  /**
   * Get all 5 loyalty tier configurations (for Admin)
   */
  async getLoyaltyTiers() {
    return this.loyaltyTierRepository.find({
      order: { tierLevel: 'ASC' },
    });
  }

  /**
   * Update loyalty tier thresholds/benefits (for Admin)
   */
  async updateLoyaltyTierConfig(tierId: string, dto: UpdateLoyaltyTierDto) {
    const tier = await this.loyaltyTierRepository.findOne({ where: { id: tierId } });
    if (!tier) throw new NotFoundException('Bậc hạng không tồn tại');

    if (dto.name !== undefined) tier.name = dto.name;
    if (dto.minSpent !== undefined) tier.minSpent = dto.minSpent;
    if (dto.minProducts !== undefined) tier.minProducts = dto.minProducts;
    if (dto.discountPercent !== undefined) tier.discountPercent = dto.discountPercent;
    if (dto.bonusPointRate !== undefined) tier.bonusPointRate = dto.bonusPointRate;
    if (dto.color !== undefined) tier.color = dto.color;
    if (dto.description !== undefined) tier.description = dto.description;

    await this.loyaltyTierRepository.save(tier);
    return tier;
  }

  /**
   * Paginated list of members & their tier info (for Admin)
   */
  async getAdminLoyaltyMembers(page = 1, limit = 10, search?: string, tierId?: string) {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.currentTier', 'tier')
      .orderBy('user.totalSpent', 'DESC')
      .addOrderBy('user.createdAt', 'DESC');

    if (tierId) {
      queryBuilder.andWhere('user.tierId = :tierId', { tierId });
    }

    if (search && search.trim()) {
      queryBuilder.andWhere(
        '(user.fullName ILIKE :search OR user.email ILIKE :search OR user.phone ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    const [items, total] = await queryBuilder.skip(skip).take(limitNum).getManyAndCount();

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    };
  }

  /**
   * Manually adjust a user's tier by Admin
   */
  async manuallyAdjustUserTier(adminId: string, userId: string, targetTierId: string, reason?: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { currentTier: true },
    });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    const targetTier = await this.loyaltyTierRepository.findOne({ where: { id: targetTierId } });
    if (!targetTier) throw new NotFoundException('Bậc hạng đích không tồn tại');

    const oldTier = user.currentTier;
    user.tierId = targetTier.id;
    user.currentTier = targetTier;
    user.tierEvaluatedAt = new Date();

    await this.userRepository.save(user);

    const historyRecord = this.loyaltyTierHistoryRepository.create({
      userId,
      oldTierId: oldTier?.id || null,
      newTierId: targetTier.id,
      totalSpentAtEval: user.totalSpent || 0,
      totalProductsAtEval: user.totalProductsPurchased || 0,
      changeReason: LoyaltyTierChangeReason.ADMIN_ADJUSTMENT,
      description: reason ? `Admin điều chỉnh: ${reason}` : `Admin điều chỉnh sang hạng ${targetTier.name}`,
    });

    await this.loyaltyTierHistoryRepository.save(historyRecord);

    return {
      message: `Đã thay đổi hạng người dùng ${user.fullName} sang hạng ${targetTier.name} thành công.`,
      user,
    };
  }
}
