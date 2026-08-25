import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { Permission } from '../../common/constants/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { User } from '../users/user.entity';
import { AdminAdjustPointsDto } from './dto/admin-adjust-points.dto';
import { UpdateLoyaltyTierDto } from './dto/update-loyalty-tier.dto';
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

  @Get('loyalty-status')
  @UseGuards(JwtAuthGuard)
  getMyLoyaltyStatus(@CurrentUser() user: User) {
    return this.pointsService.getUserLoyaltyStatus(user.id);
  }

  // =========================================================================
  // ADMIN LOYALTY CONTROLLERS
  // =========================================================================

  @Get('admin/loyalty-tiers')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.VIEW_USERS)
  getAdminLoyaltyTiers() {
    return this.pointsService.getLoyaltyTiers();
  }

  @Put('admin/loyalty-tiers/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS)
  updateLoyaltyTier(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLoyaltyTierDto,
  ) {
    return this.pointsService.updateLoyaltyTierConfig(id, dto);
  }

  @Post('admin/loyalty-recalculate')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS)
  recalculateAllLoyaltyTiers() {
    return this.pointsService.recalculateAllUsersLoyalty();
  }

  @Get('admin/loyalty-members')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.VIEW_USERS)
  getAdminLoyaltyMembers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('tierId') tierId?: string,
  ) {
    return this.pointsService.getAdminLoyaltyMembers(page, limit, search, tierId);
  }

  @Patch('admin/users/:userId/loyalty-tier')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_USERS)
  manuallyAdjustUserTier(
    @CurrentUser() admin: User,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body('tierId') targetTierId: string,
    @Body('reason') reason?: string,
  ) {
    return this.pointsService.manuallyAdjustUserTier(admin.id, userId, targetTierId, reason);
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
