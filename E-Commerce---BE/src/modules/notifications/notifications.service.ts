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

    const notification = this.notificationRepository.create({
      userId,
      orderId: data.orderId || null,
      type: data.type,
      title: data.title,
      message: data.message,
      isRead: false,
    });

    return this.notificationRepository.save(notification);
  }

  async getUserNotifications(userId: string, page = 1, limit = 10) {
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
