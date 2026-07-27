import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../products/category.entity';
import { ProductVariant } from '../products/product-variant.entity';
import { Product } from '../products/product.entity';
import { UsersModule } from '../users/users.module';
import { ComboItem } from './combo-item.entity';
import { CombosController } from './combos.controller';
import { CombosService } from './combos.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductVariant, Category, ComboItem]), UsersModule],
  controllers: [CombosController],
  providers: [CombosService],
})
export class CombosModule {}
