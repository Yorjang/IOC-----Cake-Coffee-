import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Permission } from '../../common/constants/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { User } from '../users/user.entity';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Controller(['admin/vouchers', 'admin/coupons', 'coupons', 'vouchers'])
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get('public')
  @Public()
  findPublicActive(@Req() req: any, @Query('userId') userIdQuery?: string, @Query('branchId') branchId?: string) {
    let userId = req.user?.id || userIdQuery;
    if (!userId && req.headers?.authorization) {
      try {
        const token = req.headers.authorization.replace(/^Bearer\s+/i, '');
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          userId = payload.id || payload.sub;
        }
      } catch (e) {}
    }
    return this.couponsService.findPublicActive(userId, branchId);
  }

  @Get('redeemable')
  @Public()
  findRedeemable(@Req() req: any, @Query('userId') userIdQuery?: string, @Query('branchId') branchId?: string) {
    let userId = req.user?.id || userIdQuery;
    if (!userId && req.headers?.authorization) {
      try {
        const token = req.headers.authorization.replace(/^Bearer\s+/i, '');
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          userId = payload.id || payload.sub;
        }
      } catch (e) {}
    }
    return this.couponsService.findRedeemableCoupons(userId, branchId);
  }


  @Get()
  @Permissions(Permission.VIEW_BRANCHES) // Staff, managers, admins
  findAll(@CurrentUser() user: User) {
    return this.couponsService.findAll(user);
  }


  @Post()
  @Permissions(Permission.MANAGE_BRANCHES) // Managers and admins only
  create(@Body() dto: CreateCouponDto, @CurrentUser() user: User) {
    return this.couponsService.create(dto, user);
  }

  @Patch(':id')
  @Permissions(Permission.MANAGE_BRANCHES) // Managers and admins only
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCouponDto,
    @CurrentUser() user: User,
  ) {
    return this.couponsService.update(id, dto, user);
  }

  @Patch(':id/approve')
  @Permissions(Permission.MANAGE_BRANCHES) // RESTRICTED TO ADMIN ONLY IN SERVICE
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.couponsService.approve(id, user);
  }

  @Delete(':id')
  @Permissions(Permission.MANAGE_BRANCHES) // Managers and admins only
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.couponsService.delete(id, user);
  }

  @Post(':id/redeem')
  @UseGuards(JwtAuthGuard)
  redeem(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.couponsService.redeemCouponWithPoints(user.id, id);
  }
}

