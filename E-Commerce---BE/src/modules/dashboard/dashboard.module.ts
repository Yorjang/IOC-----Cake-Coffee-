import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from '../branches/branch.entity';
import { Coupon } from '../coupons/coupon.entity';
import { Order } from '../orders/order.entity';
import { OrdersModule } from '../orders/orders.module';
import { Product } from '../products/product.entity';
import { Review } from '../reviews/review.entity';
import { User } from '../users/user.entity';
import { UsersModule } from '../users/users.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

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
