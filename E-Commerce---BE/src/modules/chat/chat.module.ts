import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/product.entity';
import { ChatController } from './chat.controller';
import { ChatMessage } from './chat-message.entity';
import { ChatSession } from './chat-session.entity';
import { ChatService } from './chat.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ChatSession, ChatMessage, Product]),
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
