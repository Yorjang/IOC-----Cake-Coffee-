import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from '../branches/branch.entity';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
    imports: [TypeOrmModule.forFeature([User, Branch])],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService], // Export UsersService so AuthModule can use it
})
export class UsersModule {}
