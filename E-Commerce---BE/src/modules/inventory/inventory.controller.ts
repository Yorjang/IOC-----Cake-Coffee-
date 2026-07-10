import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { InventoryService } from './inventory.service';

@Controller('inventory')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @Permissions(Permission.VIEW_INVENTORY)
  findAll() {
    return this.inventoryService.findAll();
  }

  @Patch(':id')
  @Permissions(Permission.MANAGE_INVENTORY)
  updateStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { quantity?: number; minQuantity?: number },
  ) {
    return this.inventoryService.updateStock(id, body);
  }
}
