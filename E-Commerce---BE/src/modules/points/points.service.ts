import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { PointHistory, PointTransactionType } from './point-history.entity';
import { User } from '../users/user.entity';
import { AdminAdjustPointsDto } from './dto/admin-adjust-points.dto';

@Injectable()
export class PointsService implements OnModuleInit {
  constructor(
    @InjectRepository(PointHistory)
    private readonly pointHistoryRepository: Repository<PointHistory>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    try {
      await this.pointHistoryRepository.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS points INT DEFAULT 0;
        
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
      `);
    } catch (error) {
      console.error('Failed to initialize point_histories schema:', error);
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
   * Get current points and recent history for authenticated user
   */
  async getUserPoints(userId: string) {
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
   * Paginated point history for a user
   */
  async getUserPointHistory(userId: string, page = 1, limit = 10) {
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
}
