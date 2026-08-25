import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { BannersModule } from './modules/banners/banners.module';
import { BranchesModule } from './modules/branches/branches.module';
import { CartModule } from './modules/cart/cart.module';
import { CombosModule } from './modules/combos/combos.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ProductsModule } from './modules/products/products.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { UsersModule } from './modules/users/users.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { CodModule } from './modules/cod/cod.module';

import { CategoriesModule } from './modules/categories/categories.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { MapModule } from './modules/map/map.module';
import { SettingsModule } from './modules/settings/settings.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { TagsModule } from './modules/tags/tags.module';
import { GeocodingModule } from './modules/geocoding/geocoding.module';

import { PointsModule } from './modules/points/points.module';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    AuthModule,
    UsersModule,
    BranchesModule,
    ProductsModule,
    CategoriesModule,
    TagsModule,
    OrdersModule,
    CouponsModule,
    ReviewsModule,
    DeliveryModule,
    CodModule,
    BannersModule,
    InventoryModule,
    CartModule,
    PaymentsModule,
    CombosModule,
    DashboardModule,
    MapModule,
    StatisticsModule,
    SettingsModule,
    GeocodingModule,
    PointsModule,
    ChatModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

