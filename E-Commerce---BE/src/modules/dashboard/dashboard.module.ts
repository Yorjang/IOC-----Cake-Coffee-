import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Order } from '../orders/order.entity';
import { Product } from '../products/product.entity';
import { Branch } from '../branches/branch.entity';
import { User } from '../users/user.entity';
import { Review } from '../reviews/review.entity';
import { Coupon } from '../coupons/coupon.entity';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Product, Branch, User, Review, Coupon]),
    UsersModule,
    OrdersModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
