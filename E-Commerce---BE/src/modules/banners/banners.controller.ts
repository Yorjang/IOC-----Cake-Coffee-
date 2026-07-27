import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { Public } from '../../common/decorators/public.decorator';
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

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
  @UseGuards(JwtAuthGuard)
  @Public()
  findAll(@Req() req: any, @CurrentUser() user?: User) {
    const isAdminPath = req.originalUrl?.includes('/admin/');
    return this.bannersService.findAll(user, isAdminPath);
  }

  @Post()
  @Permissions(Permission.MANAGE_BRANCHES) // Managers and admins only
  create(@Body() dto: CreateBannerDto, @CurrentUser() user: User) {
    return this.bannersService.create(dto, user);
  }

  @Patch(':id')
  @Permissions(Permission.MANAGE_BRANCHES)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateBannerDto,
    @CurrentUser() user: User,
  ) {
    return this.bannersService.update(id, dto, user);
  }

  @Patch(':id/active')
  @Permissions(Permission.MANAGE_BRANCHES) // Managers and admins only
  updateActiveStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isActive') isActive: boolean,
    @CurrentUser() user: User,
  ) {
    return this.bannersService.updateActiveStatus(id, isActive, user);
  }

  @Delete(':id')
  @Permissions(Permission.MANAGE_BRANCHES) // Managers and admins only
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.bannersService.delete(id, user);
  }
}
