import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../users/user.entity';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Public()
@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(
    @CurrentUser() user: User | undefined,
    @Headers('x-session-id') sessionId: string | undefined,
    @Query('branchId', ParseUUIDPipe) branchId: string,
  ) {
    return this.cartService.getCart(user?.id, sessionId, branchId);
  }

  @Post()
  addItem(
    @CurrentUser() user: User | undefined,
    @Headers('x-session-id') sessionId: string | undefined,
    @Query('branchId', ParseUUIDPipe) branchId: string,
    @Body() dto: AddCartItemDto,
  ) {
    return this.cartService.addItem(user?.id, sessionId, branchId, dto);
  }

  @Post('merge-session')
  mergeSessionCart(
    @CurrentUser() user: User | undefined,
    @Headers('x-session-id') sessionId: string | undefined,
    @Query('branchId', ParseUUIDPipe) branchId: string,
  ) {
    return this.cartService.mergeSessionCart(user?.id, sessionId, branchId);
  }

  @Patch(':itemId')
  updateItem(
    @CurrentUser() user: User | undefined,
    @Headers('x-session-id') sessionId: string | undefined,
    @Query('branchId', ParseUUIDPipe) branchId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user?.id, sessionId, branchId, itemId, dto);
  }

  @Delete(':itemId')
  removeItem(
    @CurrentUser() user: User | undefined,
    @Headers('x-session-id') sessionId: string | undefined,
    @Query('branchId', ParseUUIDPipe) branchId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.cartService.removeItem(user?.id, sessionId, branchId, itemId);
  }

  @Delete()
  clearCart(
    @CurrentUser() user: User | undefined,
    @Headers('x-session-id') sessionId: string | undefined,
    @Query('branchId', ParseUUIDPipe) branchId: string,
  ) {
    return this.cartService.clearCart(user?.id, sessionId, branchId);
  }
}
