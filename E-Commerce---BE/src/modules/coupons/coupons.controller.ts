import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';

@Controller('coupons')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

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

  @Delete(':id')
  @Permissions(Permission.MANAGE_BRANCHES) // Managers and admins only
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.couponsService.delete(id);
  }
}
