import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { Order } from '../orders/order.entity';
import { DeliveryLog } from './delivery-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, DeliveryLog])],
  providers: [DeliveryService],
  controllers: [DeliveryController],
  exports: [DeliveryService],
})
export class DeliveryModule {}
