import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon, CouponScope, CouponStatus, DiscountType } from './coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

import { User, UserRole } from '../users/user.entity';
import { PointHistory, PointTransactionType } from '../points/point-history.entity';
import { Notification } from '../notifications/notification.entity';

@Injectable()
export class CouponsService implements OnModuleInit {
  constructor(
    @InjectRepository(Coupon)
    private readonly coupons: Repository<Coupon>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async onModuleInit() {
    try {
      await this.coupons.query('ALTER TABLE coupons ADD COLUMN IF NOT EXISTS product_id UUID');
    } catch (err) {
      console.error('Error adding product_id to coupons:', err);
    }
    try {
      await this.coupons.query(
        'ALTER TABLE coupons ADD CONSTRAINT fk_coupons_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL'
      );
    } catch (err) {
      // Ignore if constraint already exists
    }
    try {
      await this.coupons.query('ALTER TABLE coupons ADD COLUMN IF NOT EXISTS target_size VARCHAR(50)');
    } catch (err) {
      console.error('Error adding target_size to coupons:', err);
    }
    try {
      await this.coupons.query('ALTER TABLE coupons ADD COLUMN IF NOT EXISTS branch_id UUID');
    } catch (err) {
      console.error('Error adding branch_id to coupons:', err);
    }
    try {
      await this.coupons.query(
        'ALTER TABLE coupons ADD CONSTRAINT fk_coupons_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL'
      );
    } catch (err) {
      // Ignore if constraint already exists
    }
    try {
      await this.coupons.query('ALTER TABLE coupons ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE');
    } catch (err) {
      console.error('Error adding is_approved to coupons:', err);
    }
    try {
      await this.coupons.query('ALTER TABLE coupons ADD COLUMN IF NOT EXISTS is_pending_delete BOOLEAN DEFAULT FALSE');
    } catch (err) {
      console.error('Error adding is_pending_delete to coupons:', err);
    }
    try {
      await this.coupons.query('ALTER TABLE coupons ADD COLUMN IF NOT EXISTS points_required INT DEFAULT 0');
    } catch (err) {
      console.error('Error adding points_required to coupons:', err);
    }
    try {
      await this.coupons.query('ALTER TABLE coupons ADD COLUMN IF NOT EXISTS discounted_points_required INT');
    } catch (err) {
      console.error('Error adding discounted_points_required to coupons:', err);
    }
  }

  async findAll(user: User): Promise<Coupon[]> {
    const where: any = {};
    if (user.role === UserRole.STORE_MANAGER && user.branchId) {
      where.branchId = user.branchId;
    }
    const list = await this.coupons.find({
      where: Object.keys(where).length > 0 ? where : undefined,
      relations: { product: { category: true }, category: true, branch: true },
      order: { createdAt: 'DESC' },
    });
    return list.map(c => ({
      ...c,
      isActive: c.status === CouponStatus.ACTIVE,
    })) as any;
  }

  async findPublicActive(userId?: string, branchId?: string): Promise<Coupon[]> {
    const coupons = await this.coupons.find({
      where: { status: CouponStatus.ACTIVE, isApproved: true, isPendingDelete: false },
      relations: { product: { category: true }, category: true, branch: true },
      order: { createdAt: 'DESC' },
    });
    const now = new Date();
    let activeCoupons = coupons.filter(c => new Date(c.expiresAt) > now);

    if (branchId) {
      activeCoupons = activeCoupons.filter(c => !c.branchId || c.branchId === branchId);
    }

    const usedCountsMap = new Map<string, number>();
    const redeemedCountsMap = new Map<string, number>();

    if (userId) {
      try {
        const userOrders = await this.coupons.query(
          `SELECT coupon_code, COUNT(*) as count FROM orders WHERE user_id = $1 AND order_status != 'cancelled' AND coupon_code IS NOT NULL GROUP BY coupon_code`,
          [userId]
        );
        for (const row of userOrders) {
          if (row.coupon_code) {
            usedCountsMap.set(row.coupon_code.toUpperCase().trim(), Number(row.count || 0));
          }
        }

        const redeemedRows = await this.coupons.query(
          `SELECT reference_id, COUNT(*) as count FROM point_histories WHERE user_id = $1 AND type = 'points_redeemed' GROUP BY reference_id`,
          [userId]
        );
        for (const row of redeemedRows) {
          if (row.reference_id) {
            redeemedCountsMap.set(row.reference_id, Number(row.count || 0));
          }
        }
      } catch (err) {
        console.error('Error filtering used/redeemed coupons for user:', err);
      }
    }

    activeCoupons = activeCoupons.filter(c => {
      const pointsReq = Number(c.pointsRequired || 0);

      // If voucher requires points to redeem
      if (pointsReq > 0) {
        if (!userId) return false; // Guest / public list cannot see points-redeemable vouchers
        const redeemedCount = redeemedCountsMap.get(c.id) || 0;
        if (redeemedCount <= 0) return false; // User has NOT redeemed this voucher yet
        const usedCount = usedCountsMap.get(c.code.toUpperCase().trim()) || 0;
        return usedCount < redeemedCount; // Only show if user has unused redeemed redemptions available
      }

      // Normal / free vouchers
      const perLimit = Number(c.perCustomerLimit ?? 1);
      const usedCount = usedCountsMap.get(c.code.toUpperCase().trim()) || 0;
      return usedCount < perLimit;
    });

    return activeCoupons.map(c => ({
      ...c,
      isActive: true,
    })) as any;
  }

  async findRedeemableCoupons(userId?: string, branchId?: string): Promise<Coupon[]> {
    const coupons = await this.coupons.find({
      where: { status: CouponStatus.ACTIVE, isApproved: true, isPendingDelete: false },
      relations: { product: { category: true }, category: true, branch: true },
      order: { createdAt: 'DESC' },
    });
    const now = new Date();
    let activeCoupons = coupons.filter(c => new Date(c.expiresAt) > now && Number(c.pointsRequired || 0) > 0);

    if (branchId) {
      activeCoupons = activeCoupons.filter(c => !c.branchId || c.branchId === branchId);
    }

    const totalMap = new Map<string, number>();
    const userRedeemedSet = new Set<string>();

    try {
      const redeemedTotal = await this.coupons.query(
        `SELECT reference_id, user_id FROM point_histories WHERE type = 'points_redeemed'`
      );
      for (const row of redeemedTotal) {
        if (row.reference_id) {
          const refStr = String(row.reference_id).trim();
          totalMap.set(refStr, (totalMap.get(refStr) || 0) + 1);

          if (userId && String(row.user_id).toLowerCase().trim() === String(userId).toLowerCase().trim()) {
            userRedeemedSet.add(refStr);
            userRedeemedSet.add(refStr.toUpperCase());
          }
        }
      }
      activeCoupons = activeCoupons.filter(c => {
        if (c.usageLimit === null || c.usageLimit === undefined) return true;
        const totalRedeemed = Math.max(Number(c.usedCount || 0), totalMap.get(c.id) || totalMap.get(c.code.toUpperCase().trim()) || 0);
        return totalRedeemed < Number(c.usageLimit);
      });
    } catch (err) {
      console.error('Error checking redeemable coupon usage limits:', err);
    }

    return activeCoupons.map(c => ({
      ...c,
      isActive: true,
      hasRedeemed: userRedeemedSet.has(c.id) || userRedeemedSet.has(c.code.toUpperCase().trim()),
    })) as any;
  }



  async create(dto: CreateCouponDto, user: User): Promise<Coupon> {
    const discountType = dto.discountType || DiscountType.PERCENT;
    const discountValue = Number(dto.discountValue);
    if (discountType === DiscountType.PERCENT) {
      if (discountValue > 100) {
        throw new BadRequestException('Mã giảm giá theo phần trăm không được vượt quá 100%.');
      }
      if (discountValue <= 0) {
        throw new BadRequestException('Mã giảm giá theo phần trăm phải lớn hơn 0%.');
      }
    }

    const existing = await this.coupons.findOne({ where: { code: dto.code.toUpperCase().trim() } });
    if (existing) {
      throw new BadRequestException('Mã voucher này đã tồn tại.');
    }

    const branchId = user.role === UserRole.STORE_MANAGER ? user.branchId : dto.branchId;
    let isApproved = true;
    if (user.role === UserRole.STORE_MANAGER) {
      const isPercentOverLimit = discountType === DiscountType.PERCENT && discountValue > 10;
      const isFixedOverLimit = discountType === DiscountType.FIXED && discountValue > 10000;
      if (isPercentOverLimit || isFixedOverLimit) {
        isApproved = false;
      }
    }

    const coupon = this.coupons.create({
      code: dto.code.toUpperCase().trim(),
      name: dto.name || `Voucher ${dto.code.toUpperCase()}`,
      description: dto.description || '',
      discountType: dto.discountType || DiscountType.PERCENT,
      discountValue: Number(dto.discountValue),
      minOrderValue: Number(dto.minOrderValue || 0),
      usageLimit: dto.usageLimit ? Number(dto.usageLimit) : null,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : new Date(),
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // default 30 days
      status: dto.isActive === false ? CouponStatus.DISABLED : CouponStatus.ACTIVE,
      productId: dto.productId || null,
      categoriesId: dto.categoriesId || null,
      targetSize: dto.targetSize || null,
      branchId: branchId || null,
      isApproved,
      couponScope: dto.targetSize
        ? CouponScope.VARIANT
        : dto.productId
          ? CouponScope.PRODUCT
          : dto.categoriesId
            ? CouponScope.CATEGORY
            : branchId
              ? CouponScope.BRANCH
              : CouponScope.ORDER,
      maxDiscount: dto.maxDiscount !== undefined && dto.maxDiscount !== null ? Number(dto.maxDiscount) : null,
      pointsRequired: dto.pointsRequired ? Number(dto.pointsRequired) : 0,
      discountedPointsRequired: dto.discountedPointsRequired !== undefined && dto.discountedPointsRequired !== null ? Number(dto.discountedPointsRequired) : null,
    });

    const saved = await this.coupons.save(coupon);
    return {
      ...saved,
      isActive: saved.status === CouponStatus.ACTIVE,
    } as any;
  }

  async update(id: string, dto: UpdateCouponDto, user: User): Promise<Coupon> {
    const coupon = await this.coupons.findOne({ where: { id } });
    if (!coupon) {
      throw new BadRequestException('Voucher không tồn tại.');
    }

    if (user.role === UserRole.STORE_MANAGER && coupon.branchId !== user.branchId) {
      throw new BadRequestException('Bạn không có quyền chỉnh sửa voucher của chi nhánh khác');
    }

    if (dto.code) {
      const codeUpper = dto.code.toUpperCase().trim();
      if (codeUpper !== coupon.code) {
        const existing = await this.coupons.findOne({ where: { code: codeUpper } });
        if (existing) {
          throw new BadRequestException('Mã voucher này đã tồn tại.');
        }
        coupon.code = codeUpper;
      }
    }

    if (dto.name !== undefined) coupon.name = dto.name;
    if (dto.description !== undefined) coupon.description = dto.description;
    
    const nextDiscountType = dto.discountType !== undefined ? dto.discountType : coupon.discountType;
    const nextDiscountValue = dto.discountValue !== undefined ? Number(dto.discountValue) : coupon.discountValue;
    if (nextDiscountType === DiscountType.PERCENT) {
      if (nextDiscountValue > 100) {
        throw new BadRequestException('Mã giảm giá theo phần trăm không được vượt quá 100%.');
      }
      if (nextDiscountValue <= 0) {
        throw new BadRequestException('Mã giảm giá theo phần trăm phải lớn hơn 0%.');
      }
    }

    if (dto.discountType !== undefined) coupon.discountType = dto.discountType;
    if (dto.discountValue !== undefined) coupon.discountValue = Number(dto.discountValue);
    if (dto.minOrderValue !== undefined) coupon.minOrderValue = Number(dto.minOrderValue);
    if (dto.usageLimit !== undefined) coupon.usageLimit = dto.usageLimit ? Number(dto.usageLimit) : null;
    if (dto.startsAt !== undefined) coupon.startsAt = new Date(dto.startsAt);
    if (dto.expiresAt !== undefined) coupon.expiresAt = new Date(dto.expiresAt);
    if (dto.productId !== undefined) {
      coupon.productId = dto.productId || null;
    }
    if (dto.categoriesId !== undefined) {
      coupon.categoriesId = dto.categoriesId || null;
    }
    if (dto.targetSize !== undefined) {
      coupon.targetSize = dto.targetSize || null;
    }

    const branchId = user.role === UserRole.ADMIN ? (dto.branchId !== undefined ? dto.branchId : coupon.branchId) : coupon.branchId;
    coupon.branchId = branchId || null;

    // Recompute couponScope based on latest productId / categoriesId / targetSize / branchId
    if (dto.productId !== undefined || dto.categoriesId !== undefined || dto.targetSize !== undefined || dto.branchId !== undefined) {
      const effectiveProductId = dto.productId !== undefined ? dto.productId : coupon.productId;
      const effectiveCategoriesId = dto.categoriesId !== undefined ? dto.categoriesId : coupon.categoriesId;
      const effectiveTargetSize = dto.targetSize !== undefined ? dto.targetSize : coupon.targetSize;
      const effectiveBranchId = coupon.branchId;
      coupon.couponScope = effectiveTargetSize
        ? CouponScope.VARIANT
        : effectiveProductId
          ? CouponScope.PRODUCT
          : effectiveCategoriesId
            ? CouponScope.CATEGORY
            : effectiveBranchId
              ? CouponScope.BRANCH
              : CouponScope.ORDER;
    }

    if (dto.maxDiscount !== undefined) coupon.maxDiscount = dto.maxDiscount !== null ? Number(dto.maxDiscount) : null;
    if (dto.pointsRequired !== undefined) coupon.pointsRequired = Number(dto.pointsRequired || 0);
    if (dto.discountedPointsRequired !== undefined) coupon.discountedPointsRequired = dto.discountedPointsRequired !== null ? Number(dto.discountedPointsRequired) : null;
    if (dto.isActive !== undefined) {
      coupon.status = dto.isActive ? CouponStatus.ACTIVE : CouponStatus.DISABLED;
    }

    if (user.role === UserRole.STORE_MANAGER) {
      const isPercentOverLimit = coupon.discountType === DiscountType.PERCENT && coupon.discountValue > 10;
      const isFixedOverLimit = coupon.discountType === DiscountType.FIXED && coupon.discountValue > 10000;
      if (isPercentOverLimit || isFixedOverLimit) {
        coupon.isApproved = false;
      } else {
        coupon.isApproved = true;
      }
    }

    const saved = await this.coupons.save(coupon);
    return {
      ...saved,
      isActive: saved.status === CouponStatus.ACTIVE,
    } as any;
  }

  async approve(id: string, user: User): Promise<any> {
    if (user.role !== UserRole.ADMIN) {
      throw new BadRequestException('Chỉ quản trị viên mới có quyền duyệt voucher.');
    }
    const coupon = await this.coupons.findOne({ where: { id } });
    if (!coupon) {
      throw new BadRequestException('Voucher không tồn tại.');
    }
    if (coupon.isPendingDelete) {
      await this.coupons.delete(id);
      return { message: 'Đã duyệt yêu cầu xóa voucher.', deleted: true };
    } else {
      coupon.isApproved = true;
      const saved = await this.coupons.save(coupon);
      return {
        ...saved,
        isActive: saved.status === CouponStatus.ACTIVE,
        deleted: false,
      } as any;
    }
  }

  async delete(id: string, user: User): Promise<{ message: string; pending: boolean }> {
    const coupon = await this.coupons.findOne({ where: { id } });
    if (!coupon) {
      throw new BadRequestException('Voucher không tồn tại.');
    }
    if (user.role === UserRole.STORE_MANAGER && coupon.branchId !== user.branchId) {
      throw new BadRequestException('Bạn không có quyền xóa voucher của chi nhánh khác');
    }
    if (user.role === UserRole.STORE_MANAGER) {
      coupon.isPendingDelete = true;
      await this.coupons.save(coupon);
      return { message: 'Đã gửi yêu cầu xóa voucher lên Admin phê duyệt.', pending: true };
    } else {
      await this.coupons.delete(id);
      return { message: 'Xóa voucher thành công', pending: false };
    }
  }

  async redeemCouponWithPoints(userId: string, couponId: string) {
    const coupon = await this.coupons.findOne({ where: { id: couponId } });
    if (!coupon) {
      throw new BadRequestException('Voucher không tồn tại.');
    }
    if (coupon.status !== CouponStatus.ACTIVE || !coupon.isApproved || coupon.isPendingDelete) {
      throw new BadRequestException('Voucher này hiện không còn khả dụng.');
    }
    if (new Date(coupon.expiresAt) < new Date()) {
      throw new BadRequestException('Voucher đã hết hạn sử dụng.');
    }
    const origPoints = Number(coupon.pointsRequired || 0);
    const discPoints = coupon.discountedPointsRequired !== null && coupon.discountedPointsRequired !== undefined ? Number(coupon.discountedPointsRequired) : null;
    const effectivePoints = (discPoints !== null && discPoints >= 0 && discPoints < origPoints) ? discPoints : origPoints;

    if (effectivePoints <= 0 && origPoints <= 0) {
      throw new BadRequestException('Voucher này là voucher công khai, không cần dùng điểm đổi.');
    }

    if (coupon.usageLimit !== null && coupon.usageLimit !== undefined) {
      const redeemedTotal = await this.pointHistoryRepository.query(
        `SELECT COUNT(*) as count FROM point_histories WHERE type = 'points_redeemed' AND reference_id = $1`,
        [coupon.id]
      );
      const totalRedeemed = Math.max(Number(coupon.usedCount || 0), Number(redeemedTotal[0]?.count || 0));
      if (totalRedeemed >= Number(coupon.usageLimit)) {
        throw new BadRequestException('Mã giảm giá này đã đạt giới hạn số lượt đổi.');
      }
    }

    // Check if user has already redeemed this voucher
    const userRedeemedCount = await this.pointHistoryRepository.query(
      `SELECT COUNT(*) as count FROM point_histories WHERE user_id = $1 AND type = 'points_redeemed' AND reference_id = $2`,
      [userId, coupon.id]
    );
    if (Number(userRedeemedCount[0]?.count || 0) > 0) {
      throw new BadRequestException('Tài khoản của bạn đã đổi mã voucher này rồi. Mỗi tài khoản chỉ được đổi 1 lần.');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại.');
    }
    const currentPoints = Number(user.points || 0);
    if (currentPoints < effectivePoints) {
      throw new BadRequestException(`Bạn không đủ điểm thưởng. Cần ${effectivePoints} điểm, bạn hiện có ${currentPoints} điểm.`);
    }

    // Deduct points
    const newPoints = currentPoints - effectivePoints;
    user.points = newPoints;
    await this.userRepository.save(user);

    // Save PointHistory
    const history = this.pointHistoryRepository.create({
      userId,
      points: -effectivePoints,
      balance: newPoints,
      type: PointTransactionType.POINTS_REDEEMED,
      referenceId: coupon.id,
      description: `Đổi voucher ${coupon.code} (-${effectivePoints} điểm)`,
    });
    await this.pointHistoryRepository.save(history);

    // Save Notification
    try {
      const notif = this.notificationRepository.create({
        userId,
        type: 'points_reward' as any,
        title: 'Đổi Voucher thành công! 🎁',
        message: `Bạn đã dùng ${effectivePoints} điểm đổi thành công voucher ${coupon.code}. Nhập mã khi thanh toán để được giảm giá!`,
      });
      await this.notificationRepository.save(notif);
    } catch (e) {
      console.error('Failed to create notification on coupon redeem:', e);
    }

    return {
      message: `Đổi thành công voucher ${coupon.code}!`,
      code: coupon.code,
      pointsDeducted: effectivePoints,
      remainingPoints: newPoints,
    };
  }
}


