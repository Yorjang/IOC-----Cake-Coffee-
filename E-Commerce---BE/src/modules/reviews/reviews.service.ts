import { Injectable, BadRequestException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateOrderReviewDto } from './dto/create-order-review.dto';
import { Order, OrderStatus } from '../orders/order.entity';
import { Coupon, CouponScope, CouponStatus, DiscountType } from '../coupons/coupon.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReviewsService implements OnModuleInit {
  constructor(
    @InjectRepository(Review)
    private readonly reviews: Repository<Review>,
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(Coupon)
    private readonly coupons: Repository<Coupon>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    try {
      await this.reviews.query(`
        ALTER TABLE reviews ADD COLUMN IF NOT EXISTS order_id UUID;
        ALTER TABLE reviews ADD COLUMN IF NOT EXISTS image_url TEXT;
        CREATE INDEX IF NOT EXISTS idx_reviews_user_order_product ON reviews(user_id, order_id, product_id);
      `);
    } catch (err) {
      console.error('Failed to run migration for reviews table:', err);
    }
  }

  async findAll(): Promise<Review[]> {
    return this.reviews.find({
      relations: { user: true, product: true },
      order: { createdAt: 'DESC' },
    });
  }

  async updateVisibility(id: string, isVisible: boolean): Promise<Review> {
    const review = await this.reviews.findOne({ where: { id } });
    if (!review) {
      throw new BadRequestException('Đánh giá không tồn tại.');
    }
    review.isVisible = isVisible;
    return this.reviews.save(review);
  }

  async delete(id: string): Promise<{ message: string }> {
    const review = await this.reviews.findOne({ where: { id } });
    if (!review) {
      throw new BadRequestException('Đánh giá không tồn tại.');
    }
    await this.reviews.delete(id);
    return { message: 'Xóa đánh giá thành công.' };
  }

  async findByProduct(productId: string): Promise<Review[]> {
    return this.reviews.find({
      where: { productId, isVisible: true },
      relations: { user: true },
      order: { createdAt: 'DESC' },
    });
  }

  async createOrderReview(userId: string, dto: CreateOrderReviewDto) {
    const { orderId, productId, rating, comment, imageUrl } = dto;

    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Điểm đánh giá phải từ 1 đến 5 sao.');
    }

    // 1. Check order ownership & status
    const order = await this.orders.findOne({
      where: { id: orderId },
      relations: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại.');
    }

    if (order.userId !== userId) {
      throw new BadRequestException('Bạn không có quyền đánh giá đơn hàng này.');
    }

    if (order.orderStatus !== OrderStatus.COMPLETED) {
      throw new BadRequestException('Bạn chỉ có thể đánh giá sản phẩm từ đơn hàng đã hoàn tất (giao thành công).');
    }

    // 2. Check product is in order
    const hasProduct = order.items.some((item) => item.productId === productId);
    if (!hasProduct) {
      throw new BadRequestException('Sản phẩm này không nằm trong đơn hàng của bạn.');
    }

    // 3. Check if product in this order has already been reviewed
    const existingReview = await this.reviews.findOne({
      where: { userId, orderId, productId },
    });

    if (existingReview) {
      throw new BadRequestException('Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi.');
    }

    // 4. Save Review
    const review = this.reviews.create({
      productId,
      orderId,
      userId,
      rating,
      comment,
      imageUrl: imageUrl || null,
      isVerified: true,
      isVisible: true,
    });
    const savedReview = await this.reviews.save(review);

    // 5. Generate Reward Voucher for User
    let couponCode = '';
    let retries = 0;
    while (retries < 5) {
      const randStr = Math.random().toString(36).substring(2, 8).toUpperCase();
      couponCode = `RV-${randStr}`;
      const existing = await this.coupons.findOne({ where: { code: couponCode } });
      if (!existing) break;
      retries++;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days valid

    const coupon = this.coupons.create({
      code: couponCode,
      name: 'Voucher quà tặng từ đánh giá sản phẩm',
      description: 'Cảm ơn bạn đã gửi đánh giá cho sản phẩm! Mã giảm giá 10% cho đơn hàng tiếp theo.',
      discountType: DiscountType.PERCENT,
      discountValue: 10,
      maxDiscount: 50000,
      minOrderValue: 0,
      couponScope: CouponScope.ORDER,
      perCustomerLimit: 1,
      usageLimit: 1,
      usedCount: 0,
      status: CouponStatus.ACTIVE,
      startsAt: now,
      expiresAt: expiresAt,
      isApproved: true,
    });

    await this.coupons.save(coupon);

    // 6. Trigger Notification
    this.notificationsService
      .createNotification(userId, {
        orderId,
        type: 'voucher_reward',
        title: 'Bạn đã nhận được Voucher quà tặng!',
        message: `Cảm ơn bạn đã đánh giá sản phẩm! Bạn đã nhận được mã voucher ${couponCode} giảm 10% (Tối đa 50.000đ) cho đơn hàng tiếp theo.`,
      })
      .catch((err) => console.error('Failed to create voucher notification:', err));

    return {
      message: 'Gửi đánh giá thành công! Bạn đã nhận được voucher quà tặng.',
      review: savedReview,
      couponCode: coupon.code,
      discountText: '10% (Tối đa 50.000đ)',
    };
  }

  async createReview(userId: string, dto: CreateReviewDto): Promise<Review> {
    throw new BadRequestException(
      'Không thể tạo đánh giá từ trang sản phẩm. Vui lòng vào Lịch sử đơn hàng để đánh giá các sản phẩm đã mua.',
    );
  }
}
