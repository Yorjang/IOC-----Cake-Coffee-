import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';

@Module({
    imports: [
    AuthModule,
    UsersModule,
    ProductsModule,
    // Load biến môi trường từ file .env
    ConfigModule.forRoot({
        isGlobal: true,
    }),
    
    // Khởi tạo kết nối TypeORM với PostgreSQL
    TypeOrmModule.forRootAsync({
        useFactory: () => ({
            type: 'postgres',
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT, 10),
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,

            // Hỗ trợ kết nối SSL cho cloud DB (như Supabase)
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,

            // Tư duy "Giữ nhẹ project" của NestJS:
            autoLoadEntities: true,

            // Bẫy sinh tử: TUYỆT ĐỐI ĐỂ FALSE
            synchronize: false,
        }),
    }),
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}