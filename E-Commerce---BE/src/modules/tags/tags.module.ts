import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

@Module({
  imports: [ProductsModule, UsersModule],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
