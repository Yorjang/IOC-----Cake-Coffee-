import { Controller, Get, Delete, Param, Patch, Post, Body, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller(['admin/reviews', 'reviews'])
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('product/:productId')
  findByProduct(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.reviewsService.findByProduct(productId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.createReview(user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.VIEW_BRANCHES) // Staff, managers, admins
  findAll() {
    return this.reviewsService.findAll();
  }

  @Patch(':id/visibility')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.VIEW_BRANCHES) // Staff, managers, admins
  updateVisibility(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('isVisible') isVisible: boolean,
  ) {
    return this.reviewsService.updateVisibility(id, isVisible);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(Permission.MANAGE_BRANCHES) // Managers and admins only
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.delete(id);
  }
}
