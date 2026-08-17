import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { Coupon } from './coupon.entity';
import { CouponsController } from './coupons.controller';
import { CouponsService } from './coupons.service';

import { User } from '../users/user.entity';
import { PointHistory } from '../points/point-history.entity';
import { Notification } from '../notifications/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Coupon, User, PointHistory, Notification]),
    UsersModule,
  ],
  controllers: [CouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
