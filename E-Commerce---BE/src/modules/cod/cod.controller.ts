import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { CodService } from './cod.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';

@Controller('cod')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CodController {
  constructor(private readonly codService: CodService) {}

  @Post('remit-request')
  @Permissions(Permission.MANAGE_DELIVERIES) // Shipper
  async createRemitRequest(@Request() req: any) {
    return this.codService.createRemitRequest(req.user);
  }

  @Get('my-requests')
  @Permissions(Permission.MANAGE_DELIVERIES) // Shipper
  async getMyRequests(@Request() req: any) {
    return this.codService.getMyRequests(req.user);
  }

  @Get('pending')
  // Dành cho Cashier / Store Manager (những người có quyền quản lý orders / deliveries)
  @Permissions(Permission.UPDATE_ORDER)
  async getPendingRequests(@Request() req: any) {
    return this.codService.getPendingRequests(req.user);
  }

  @Post(':id/confirm')
  @Permissions(Permission.UPDATE_ORDER) // Cashier / Store Manager
  async confirmRemitRequest(
    @Param('id') id: string,
    @Body('actualAmount') actualAmount: number,
    @Body('note') note: string,
    @Request() req: any
  ) {
    return this.codService.confirmRemitRequest(id, req.user, actualAmount, note);
  }
}
