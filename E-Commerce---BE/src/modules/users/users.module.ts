import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from '../branches/branch.entity';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserAddress } from './user-address.entity';
import { UserAddressesService } from './user-addresses.service';

@Module({
    imports: [TypeOrmModule.forFeature([User, Branch, UserAddress])],
    controllers: [UsersController],
    providers: [UsersService, UserAddressesService],
    exports: [UsersService], // Export UsersService so AuthModule can use it
})
export class UsersModule {}
