import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Permission } from '../../common/constants/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { User } from '../users/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller(['admin/orders', 'orders', 'api/orders'])
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Public()
  create(@Req() req: any, @CurrentUser() user: any, @Body() dto: CreateOrderDto, @Headers('x-session-id') sessionId: string) {
    let userId = user?.id || null;
    if (!userId && req.headers?.authorization) {
      try {
        const token = req.headers.authorization.replace(/^Bearer\s+/i, '');
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          userId = payload.id || payload.sub || null;
        }
      } catch (e) {}
    }
    return this.ordersService.createOrder(userId, sessionId || null, dto);
  }

  @Get('public/:id')
  @Public()
  findPublic(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findPublicOrder(id);
  }

  @Patch('public/:id/cancel')
  @Public()
  cancelPublic(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('refundInfo') refundInfo: any,
    @CurrentUser() user: any,
    @Headers('x-session-id') sessionId: string
  ) {
    return this.ordersService.cancelMyOrder(id, user?.id || null, sessionId || null, refundInfo);
  }

  @Patch(':id/refund')
  @Permissions(Permission.UPDATE_ORDER)
  processRefund(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.processRefund(id);
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
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.ordersService.updateStatus(id, dto.status, user);
  }
}
