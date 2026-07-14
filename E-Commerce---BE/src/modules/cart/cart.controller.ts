import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CartService } from './cart.service';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: User) {
    return this.cartService.getCart(user.id);
  }

  @Post()
  addItem(
    @CurrentUser() user: User,
    @Body('productId', ParseUUIDPipe) productId: string,
    @Body('variantId', ParseUUIDPipe) variantId: string,
    @Body('quantity') quantity: number,
    @Body('note') note: string,
  ) {
    return this.cartService.addItem(user.id, productId, variantId, quantity, note);
  }

  @Patch(':itemId')
  updateItem(
    @CurrentUser() user: User,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body('quantity') quantity: number,
    @Body('note') note?: string,
  ) {
    return this.cartService.updateItem(user.id, itemId, quantity, note);
  }

  @Delete(':itemId')
  removeItem(
    @CurrentUser() user: User,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.cartService.removeItem(user.id, itemId);
  }

  @Delete()
  clearCart(@CurrentUser() user: User) {
    return this.cartService.clearCart(user.id);
  }

  @Post('merge')
  mergeCart(
    @CurrentUser() user: User,
    @Body('items') localItems: any[],
  ) {
    return this.cartService.mergeCart(user.id, localItems);
  }
}
