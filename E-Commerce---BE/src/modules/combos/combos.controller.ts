import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Permission } from '../../common/constants/permissions';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CombosService } from './combos.service';
import { CreateComboDto, UpdateComboDto } from './dto/combo.dto';

@Controller('combos')
export class CombosController {
  constructor(private readonly combosService: CombosService) {}

  @Get()
  findAll() {
    return this.combosService.findAll();
  }

  @Get('available-products')
  findAvailableProducts() {
    return this.combosService.findAvailableProducts();
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CREATE_PRODUCT)
  create(@Body() dto: CreateComboDto) {
    return this.combosService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.UPDATE_PRODUCT)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateComboDto) {
    return this.combosService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.DELETE_PRODUCT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.combosService.remove(id);
  }
}
