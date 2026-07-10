import { Controller, Get, Delete, Param, Patch, Body, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  @Permissions(Permission.VIEW_BRANCHES) // Staff, managers, admins
  findAll() {
    return this.reviewsService.findAll();
  }

  @Patch(':id/visibility')
  @Permissions(Permission.VIEW_BRANCHES) // Staff, managers, admins
  updateVisibility(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isVisible') isVisible: boolean,
  ) {
    return this.reviewsService.updateVisibility(id, isVisible);
  }

  @Delete(':id')
  @Permissions(Permission.MANAGE_BRANCHES) // Managers and admins only
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.delete(id);
  }
}
