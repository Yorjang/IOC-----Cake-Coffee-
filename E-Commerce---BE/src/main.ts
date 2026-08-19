import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  // Tạo một instance của ứng dụng NestJS, nạp 'trái tim' AppModule vào
    const app = await NestFactory.create(AppModule);

  // Kích hoạt CORS để Frontend có thể gọi API
    app.enableCors({
    origin: '*',
    credentials: true,
  });
  
  // Áp dụng Global Interceptor & Filter (Fix for IOC)
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // Bật ValidationPipe để tự động kiểm tra dữ liệu gửi lên (DTO)
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true, // Loại bỏ các trường không được khai báo trong DTO
      forbidNonWhitelisted: false, // Không báo lỗi nếu gửi lên trường dư thừa (phù hợp cho Webhook)
      transform: true, // Tự động chuyển đổi kiểu dữ liệu
    }));

  // Lắng nghe ở cổng 3000 (bạn có thể đổi thành 8080 tùy ý)
    await app.listen(3000);

  // In ra một dòng log để chúng ta biết server đã chạy thành công
    console.log(`Project Cake & Coffee đã khởi chạy tại: ${await app.getUrl()}`);
}

// Bấm nút khởi động!
bootstrap();