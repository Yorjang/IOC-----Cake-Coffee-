import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointHistory } from './point-history.entity';
import { User } from '../users/user.entity';
import { PointsService } from './points.service';
import { PointsController } from './points.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PointHistory, User]),
    UsersModule,
  ],
  controllers: [PointsController],
  providers: [PointsService],
  exports: [PointsService],
})
export class PointsModule {}
