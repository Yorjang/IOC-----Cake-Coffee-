import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OrdersService } from './orders.service';
import { OrderStatus } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(user.id, dto);
  }

  @Get('my')
  findMy(@CurrentUser() user: any) {
    return this.ordersService.findMyOrders(user.id);
  }

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
