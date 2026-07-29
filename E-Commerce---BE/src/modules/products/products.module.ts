import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductTopping } from './product-topping.entity';
import { ProductTag } from './product-tag.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { UsersModule } from '../users/users.module';
import { OrderItem } from '../orders/order-item.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Category, Product, ProductVariant, ProductTopping, ProductTag, OrderItem]),
        UsersModule,
    ],
    controllers: [ProductsController],
    providers: [ProductsService],
    exports: [ProductsService, TypeOrmModule],
})
export class ProductsModule {}
