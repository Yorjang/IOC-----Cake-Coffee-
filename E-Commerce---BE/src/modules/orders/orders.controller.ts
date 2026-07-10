import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { OrdersService } from './orders.service';
import { OrderStatus } from './entities/order.entity';

@Controller('orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('dashboard/stats')
  @Permissions(Permission.VIEW_ORDER)
  getDashboardStats() {
    return this.ordersService.getDashboardStats();
  }

  @Get()
  @Permissions(Permission.VIEW_ORDER)
  findAll() {
    return this.ordersService.findAll();
  }

  @Patch(':id/status')
  @Permissions(Permission.UPDATE_ORDER)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: OrderStatus,
  ) {
    return this.ordersService.updateStatus(id, status);
  }
}
