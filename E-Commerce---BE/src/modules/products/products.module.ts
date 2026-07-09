import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Category, Product, ProductVariant]),
        UsersModule,
    ],
    controllers: [ProductsController],
    providers: [ProductsService],
    exports: [ProductsService, TypeOrmModule],
})
export class ProductsModule {}
