import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Tạo một instance của ứng dụng NestJS, nạp 'trái tim' AppModule vào
    const app = await NestFactory.create(AppModule);

  // Kích hoạt CORS để Frontend có thể gọi API
    app.enableCors();

  // Bật ValidationPipe để tự động kiểm tra dữ liệu gửi lên (DTO)
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true, // Loại bỏ các trường không được khai báo trong DTO
      forbidNonWhitelisted: true, // Báo lỗi nếu gửi lên trường dư thừa
      transform: true, // Tự động chuyển đổi kiểu dữ liệu
    }));

  // Lắng nghe ở cổng PORT cấu hình trong file .env hoặc mặc định 3000
    const port = process.env.PORT || 3000;
    await app.listen(port);

  // In ra một dòng log để chúng ta biết server đã chạy thành công
    console.log(`Project Cake & Coffee đã khởi chạy tại: ${await app.getUrl()}`);
}

// Bấm nút khởi động!
bootstrap();