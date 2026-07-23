import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { User } from '../users/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { Public } from '../../common/decorators/public.decorator';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Controller(['admin/vouchers', 'admin/coupons', 'coupons', 'vouchers'])
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get('public')
  @Public()
  findPublicActive(@Req() req: Request & { user?: User }) {
    return this.couponsService.findPublicActive(req.user?.id);
  }


  @Get()
  @Permissions(Permission.VIEW_BRANCHES) // Staff, managers, admins
  findAll() {
    return this.couponsService.findAll();
  }


  @Post()
  @Permissions(Permission.MANAGE_BRANCHES) // Managers and admins only
  create(@Body() dto: CreateCouponDto) {
    return this.couponsService.create(dto);
  }

  @Patch(':id')
  @Permissions(Permission.MANAGE_BRANCHES) // Managers and admins only
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCouponDto) {
    return this.couponsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions(Permission.MANAGE_BRANCHES) // Managers and admins only
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.couponsService.delete(id);
  }
}

