import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { Category } from './category.entity';
import { ProductTag } from './product-tag.entity';
import { ProductTopping } from './product-topping.entity';
import { ProductVariant } from './product-variant.entity';
import { Product } from './product.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Category, Product, ProductVariant, ProductTopping, ProductTag]),
        UsersModule,
    ],
    controllers: [ProductsController],
    providers: [ProductsService],
    exports: [ProductsService, TypeOrmModule],
})
export class ProductsModule {}
