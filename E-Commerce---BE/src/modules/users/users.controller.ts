import { Controller, Get, Patch, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

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
}

