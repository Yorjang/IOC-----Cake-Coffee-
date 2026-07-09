import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Branch } from '../branches/entities/branch.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, Branch])],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService], // Export UsersService so AuthModule can use it
})
export class UsersModule {}
