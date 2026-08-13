import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { Permission } from '../../common/constants/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { User } from '../users/user.entity';
import { AdminAdjustPointsDto } from './dto/admin-adjust-points.dto';
import { PointsService } from './points.service';

@Controller(['points', 'api/points', 'admin/points'])
export class PointsController {
  constructor(private readonly pointsService: PointsService) {}

  @Get('my-points')
  @UseGuards(JwtAuthGuard)
  getMyPoints(@CurrentUser() user: User) {
    return this.pointsService.getUserPoints(user.id);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  getMyPointHistory(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.pointsService.getUserPointHistory(user.id, page, limit);
  }

  @Get('admin/users/:userId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.VIEW_USERS)
  getUserPointsByAdmin(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.pointsService.getUserPointHistory(userId, page, limit);
  }

  @Post('admin/adjust')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS)
  adjustPointsByAdmin(@CurrentUser() admin: User, @Body() dto: AdminAdjustPointsDto) {
    return this.pointsService.adjustPointsByAdmin(admin.id, dto);
  }
}
