import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Permission } from '../../common/constants/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { CreateUserAddressDto } from './dto/create-user-address.dto';
import { UpdateUserAddressDto } from './dto/update-user-address.dto';
import { UserAddressesService } from './user-addresses.service';

@Controller(['admin/users', 'users'])
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly userAddressesService: UserAddressesService,
    ) {}

    @Get('addresses')
    @UseGuards(JwtAuthGuard)
    getAddresses(@CurrentUser() user: User) {
        return this.userAddressesService.findAll(user.id);
    }

    @Post('addresses')
    @UseGuards(JwtAuthGuard)
    createAddress(@CurrentUser() user: User, @Body() dto: CreateUserAddressDto) {
        return this.userAddressesService.create(user.id, dto);
    }

    @Patch('addresses/:addressId')
    @UseGuards(JwtAuthGuard)
    updateAddress(
        @CurrentUser() user: User,
        @Param('addressId', ParseUUIDPipe) addressId: string,
        @Body() dto: UpdateUserAddressDto,
    ) {
        return this.userAddressesService.update(user.id, addressId, dto);
    }

    @Delete('addresses/:addressId')
    @UseGuards(JwtAuthGuard)
    async deleteAddress(
        @CurrentUser() user: User,
        @Param('addressId', ParseUUIDPipe) addressId: string,
    ) {
        await this.userAddressesService.remove(user.id, addressId);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    getMe(@CurrentUser() user: User) {
        return user;
    }

    @Get()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions(Permission.VIEW_USERS)
    findAll() {
        return this.usersService.findAll();
    }

    @Post()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions(Permission.MANAGE_USERS)
    createUser(@Body() createUserDto: CreateUserDto) {
        return this.usersService.createByAdmin(createUserDto);
    }

    @Patch(':id/role')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions(Permission.MANAGE_USERS)
    updateRole(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateRoleDto: UpdateRoleDto,
    ) {
        return this.usersService.updateRole(id, updateRoleDto.role);
    }

    @Patch('profile')
    @UseGuards(JwtAuthGuard)
    updateProfile(
        @CurrentUser() user: User,
        @Body() updateProfileDto: UpdateProfileDto,
    ) {
        return this.usersService.updateProfile(user.id, updateProfileDto);
    }

    @Patch('change-password')
    @UseGuards(JwtAuthGuard)
    changePassword(
        @CurrentUser() user: User,
        @Body() changePasswordDto: ChangePasswordDto,
    ) {
        return this.usersService.changePassword(user.id, changePasswordDto);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions(Permission.MANAGE_USERS)
    updateUser(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        return this.usersService.updateUser(id, updateUserDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions(Permission.MANAGE_USERS)
    deleteUser(@Param('id', ParseUUIDPipe) id: string) {
        return this.usersService.deleteUser(id);
    }
}

