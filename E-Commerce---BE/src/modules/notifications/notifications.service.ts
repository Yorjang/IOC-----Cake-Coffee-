import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';

@Injectable()
export class NotificationsService implements OnModuleInit {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async onModuleInit() {
    try {
      await this.notificationRepository.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          is_read BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        ALTER TABLE notifications ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;
        ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
        DO $$ 
        BEGIN 
          ALTER TABLE notifications ALTER COLUMN type TYPE VARCHAR(50) USING type::text;
        EXCEPTION WHEN OTHERS THEN 
          NULL;
        END $$;
        DO $$ 
        BEGIN 
          ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'points_reward';
        EXCEPTION WHEN OTHERS THEN 
          NULL;
        END $$;
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
      `);
    } catch (error) {
      console.error('Failed to initialize notifications table:', error);
    }
  }


  async createNotification(
    userId: string,
    data: {
      orderId?: string;
      type: NotificationType | string;
      title: string;
      message: string;
    },
  ): Promise<Notification> {
    if (!userId) return null;

    try {
      const notification = this.notificationRepository.create({
        userId,
        orderId: data.orderId || null,
        type: data.type,
        title: data.title,
        message: data.message,
        isRead: false,
      });

      return await this.notificationRepository.save(notification);
    } catch (err) {
      console.error('Failed to save notification with orderId, retrying without orderId:', err);
      try {
        const fallbackNotification = this.notificationRepository.create({
          userId,
          orderId: null,
          type: data.type,
          title: data.title,
          message: data.message,
          isRead: false,
        });
        return await this.notificationRepository.save(fallbackNotification);
      } catch (fallbackErr) {
        console.error('Failed to save fallback notification:', fallbackErr);
        return null;
      }
    }
  }

  async getUserNotifications(userId: string, page = 1, limit = 10) {
    await this.syncVoucherNotificationsForUser(userId);

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limitNum,
      skip,
    });

    const unreadCount = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      items,
      total,
      unreadCount,
      page: pageNum,
      limit: limitNum,
      totalPages,
    };
  }

  private async syncVoucherNotificationsForUser(userId: string) {
    try {
      if (!userId) return;

      const userRes = await this.notificationRepository.query(
        `SELECT id, tier_id, COALESCE(total_spent, 0) as total_spent, COALESCE(total_products_purchased, 0) as total_products FROM users WHERE id = $1`,
        [userId],
      );
      const user = userRes[0];
      if (!user) return;

      const activeCoupons = await this.notificationRepository.query(
        `SELECT c.*, lt.name as tier_name, lt.min_spent as tier_min_spent, lt.min_products as tier_min_products
         FROM coupons c
         LEFT JOIN loyalty_tiers lt ON c.applicable_tier_id = lt.id
         WHERE c.status = 'active' AND c.is_approved = true AND c.expires_at > NOW()`,
      );

      for (const coupon of activeCoupons) {
        let isEligible = false;
        if (coupon.applicable_tier_id) {
          const tierMinSpent = Number(coupon.tier_min_spent || 0);
          const tierMinProducts = Number(coupon.tier_min_products || 0);
          if (
            user.tier_id === coupon.applicable_tier_id ||
            (Number(user.total_spent) >= tierMinSpent && Number(user.total_products) >= tierMinProducts)
          ) {
            isEligible = true;
          }
        } else {
          isEligible = true;
        }

        if (!isEligible) continue;

        const existing = await this.notificationRepository.query(
          `SELECT id FROM notifications WHERE user_id = $1 AND message LIKE $2`,
          [userId, `%[${coupon.code}]%`],
        );

        if (!existing || existing.length === 0) {
          const discountText =
            coupon.discount_type === 'percent'
              ? `Giảm ${Math.round(Number(coupon.discount_value))}%`
              : `Giảm ${Number(coupon.discount_value).toLocaleString('vi-VN')}đ`;

          const tierTitle = coupon.tier_name ? ` dành riêng cho Hạng ${coupon.tier_name}` : '';
          await this.notificationRepository.save(
            this.notificationRepository.create({
              userId,
              type: 'new_voucher_available',
              title: `Voucher mới${tierTitle}!`,
              message: `Mã voucher [${coupon.code}] (${discountText}) đã có sẵn cho tài khoản của bạn. Kiểm tra và sử dụng ngay!`,
              isRead: false,
              createdAt: coupon.created_at || new Date(),
            }),
          );
        }
      }
    } catch (err) {
      console.error('Error syncing voucher notifications for user:', err);
    }
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markAsRead(userId: string, id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Thông báo không tồn tại hoặc không có quyền truy cập');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      return this.notificationRepository.save(notification);
    }

    return notification;
  }

  async markAllAsRead(userId: string) {
    const result = await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
    return { affected: result.affected || 0 };
  }
}
