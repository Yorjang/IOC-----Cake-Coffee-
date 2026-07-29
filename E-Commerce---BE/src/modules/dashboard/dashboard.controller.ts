import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { OrdersService } from '../orders/orders.service';
import { UserRole } from '../users/user.entity';
import { DashboardService } from './dashboard.service';

@Controller(['admin/dashboard', 'dashboard'])
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly ordersService: OrdersService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  getDashboard() {
    return this.ordersService.getDashboardStats();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  getDashboardStats() {
    return this.ordersService.getDashboardStats();
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  getSummary() {
    return this.dashboardService.getSummary();
  }
}
