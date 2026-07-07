import { Controller, Get, Patch, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { UpdateRoleDto } from './dto/update-role.dto';

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
}

