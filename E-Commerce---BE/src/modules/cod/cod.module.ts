import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CodService } from './cod.service';
import { CodController } from './cod.controller';
import { CodRemittance } from './cod-remittance.entity';
import { Order } from '../orders/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CodRemittance, Order])],
  providers: [CodService],
  controllers: [CodController],
  exports: [CodService],
})
export class CodModule {}
