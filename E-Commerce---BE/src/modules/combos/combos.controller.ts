import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Permission } from '../../common/constants/permissions';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CombosService } from './combos.service';
import { CreateComboDto, UpdateComboDto } from './dto/combo.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { Public } from '../../common/decorators/public.decorator';
import { FindCombosQueryDto } from './dto/find-combos-query.dto';

@Controller('combos')
export class CombosController {
  constructor(private readonly combosService: CombosService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Public()
  findAll(@Req() req: any, @Query() query: FindCombosQueryDto, @CurrentUser() user?: User) {
    const isAdminPath = req.originalUrl?.includes('/admin/');
    return this.combosService.findAll(user, isAdminPath, query.branchId);
  }

  @Get('available-products')
  findAvailableProducts() {
    return this.combosService.findAvailableProducts();
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.CREATE_PRODUCT)
  create(@Body() dto: CreateComboDto, @CurrentUser() user: User) {
    return this.combosService.create(dto, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.UPDATE_PRODUCT)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateComboDto,
    @CurrentUser() user: User,
  ) {
    return this.combosService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.DELETE_PRODUCT)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.combosService.remove(id, user);
  }
}
