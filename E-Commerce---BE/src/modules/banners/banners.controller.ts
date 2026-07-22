import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { Public } from '../../common/decorators/public.decorator';
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';

@Controller(['admin/banners', 'banners'])
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}
  @Get('public')
  @Public()
  findPublicActive() {
    return this.bannersService.findPublicActive();
  }


  @Get()
  @Permissions(Permission.VIEW_BRANCHES) // Staff, managers, admins
  findAll() {
    return this.bannersService.findAll();
  }

  @Post()
  @Permissions(Permission.MANAGE_BRANCHES) // Managers and admins only
  create(@Body() dto: CreateBannerDto) {
    return this.bannersService.create(dto);
  }
  @Patch(':id')
  @Permissions(Permission.MANAGE_BRANCHES)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateBannerDto) {
    return this.bannersService.update(id, dto);
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
