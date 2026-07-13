import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';
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
