import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../orders/order.entity';
import { Product } from '../products/product.entity';
import { Branch } from '../branches/branch.entity';
import { User } from '../users/user.entity';
import { Review } from '../reviews/review.entity';
import { Coupon, CouponStatus } from '../coupons/coupon.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) {}

  async getSummary() {
    const [
      totalOrders,
      pendingOrders,
      totalProducts,
      totalBranches,
      totalUsers,
      totalReviews,
      totalCoupons,
      completedOrdersRevenue,
    ] = await Promise.all([
      this.orderRepository.count(),
      this.orderRepository.count({ where: { orderStatus: OrderStatus.PENDING } }),
      this.productRepository.count(),
      this.branchRepository.count(),
      this.userRepository.count(),
      this.reviewRepository.count(),
      this.couponRepository.count({ where: { status: CouponStatus.ACTIVE } }),
      this.orderRepository
        .createQueryBuilder('order')
        .select('SUM(order.totalAmount)', 'sum')
        .where('order.orderStatus = :status', { status: OrderStatus.COMPLETED })
        .getRawOne(),
    ]);

    return {
      summary: {
        totalRevenue: Number(completedOrdersRevenue?.sum || 0),
        totalOrders,
        pendingOrders,
        totalProducts,
        totalBranches,
        totalUsers,
        totalReviews,
        activeCoupons: totalCoupons,
      },
      updatedAt: new Date().toISOString(),
    };
  }
}
