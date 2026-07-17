import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { Category } from '../products/category.entity';
import { Product } from '../products/product.entity';
import { ProductVariant } from '../products/product-variant.entity';
import { ComboItem } from './combo-item.entity';
import { CombosController } from './combos.controller';
import { CombosService } from './combos.service';

@Module({
    imports: [TypeOrmModule.forFeature([ComboItem, Product, ProductVariant, Category]), UsersModule],
    controllers: [CombosController],
    providers: [CombosService],
    exports: [CombosService],
})
export class CombosModule {}
