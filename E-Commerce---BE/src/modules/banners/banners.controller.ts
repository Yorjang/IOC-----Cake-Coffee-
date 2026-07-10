import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { BannersService } from './banners.service';

@Controller('banners')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  @Permissions(Permission.VIEW_BRANCHES) // Staff, managers, admins
  findAll() {
    return this.bannersService.findAll();
  }

  @Post()
  @Permissions(Permission.MANAGE_BRANCHES) // Managers and admins only
  create(@Body() body: any) {
    return this.bannersService.create(body);
  }

  @Patch(':id/active')
  @Permissions(Permission.MANAGE_BRANCHES) // Managers and admins only
  updateActiveStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.bannersService.updateActiveStatus(id, isActive);
  }

  @Delete(':id')
  @Permissions(Permission.MANAGE_BRANCHES) // Managers and admins only
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.bannersService.delete(id);
  }
}
