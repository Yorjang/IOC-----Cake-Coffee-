import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';

@Controller('delivery')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions(Permission.MANAGE_DELIVERIES)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('dashboard')
  async getDashboard(@Request() req: any) {
    return this.deliveryService.getDashboard(req.user);
  }

  @Get('pending')
  async getPendingDeliveries(@Request() req: any) {
    return this.deliveryService.getPendingDeliveries(req.user);
  }

  @Get('my-deliveries')
  async getMyDeliveries(@Request() req: any) {
    return this.deliveryService.getMyDeliveries(req.user);
  }

  @Get('history')
  async getDeliveryHistory(@Request() req: any) {
    return this.deliveryService.getDeliveryHistory(req.user);
  }

  @Post(':id/assign')
  async assignDelivery(@Param('id') id: string, @Request() req: any) {
    return this.deliveryService.assignDelivery(id, req.user);
  }

  @Post(':id/pickup')
  async pickupDelivery(@Param('id') id: string, @Request() req: any) {
    return this.deliveryService.pickupDelivery(id, req.user);
  }

  @Post(':id/start')
  async startDelivery(@Param('id') id: string, @Request() req: any) {
    return this.deliveryService.startDelivery(id, req.user);
  }

  @Post(':id/complete')
  async completeDelivery(@Param('id') id: string, @Request() req: any) {
    return this.deliveryService.completeDelivery(id, req.user);
  }

  @Post(':id/fail')
  async failDelivery(@Param('id') id: string, @Body('reason') reason: string, @Request() req: any) {
    return this.deliveryService.failDelivery(id, req.user, reason);
  }
}
