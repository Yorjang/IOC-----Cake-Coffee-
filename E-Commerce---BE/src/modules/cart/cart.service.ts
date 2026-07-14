import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';

export type CartMutationResult = {
  itemId: string;
  quantity: number;
};

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
  ) {}

  async getCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { userId },
      relations: {
        items: {
          product: { category: true },
          variant: true,
        },
      },
    });

    if (!cart) {
      cart = await this.cartRepository.save(this.cartRepository.create({
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }));
      cart.items = [];
    }
    return cart;
  }

  async addItem(userId: string, dto: AddCartItemDto): Promise<CartMutationResult> {
    return this.cartRepository.manager.transaction(async (manager) => {
      const carts = manager.getRepository(Cart);
      const items = manager.getRepository(CartItem);
      let cart = await carts.findOne({ where: { userId } });
      if (!cart) {
        cart = await carts.save(carts.create({
          userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }));
      }

      const note = dto.note || null;
      let item = await items.findOne({
        where: { cartId: cart.id, variantId: dto.variantId, note },
        lock: { mode: 'pessimistic_write' },
      });
      if (item) {
        const quantity = item.quantity + dto.quantity;
        await items.update(item.id, { quantity });
        return { itemId: item.id, quantity };
      }

      item = await items.save(items.create({
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId,
        quantity: dto.quantity,
        note,
      }));
      return { itemId: item.id, quantity: item.quantity };
    });
  }

  async updateItem(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartMutationResult> {
    const values: Partial<CartItem> = { quantity: dto.quantity };
    if (dto.note !== undefined) values.note = dto.note || null;
    const result = await this.cartItemRepository
      .createQueryBuilder()
      .update(CartItem)
      .set(values)
      .where('id = :itemId', { itemId })
      .andWhere('cart_id IN (SELECT id FROM carts WHERE user_id = :userId)', { userId })
      .execute();

    if (!result.affected) {
      throw new NotFoundException('Sản phẩm không có trong giỏ hàng');
    }
    return { itemId, quantity: dto.quantity };
  }

  async removeItem(userId: string, itemId: string): Promise<{ itemId: string }> {
    const result = await this.cartItemRepository
      .createQueryBuilder()
      .delete()
      .from(CartItem)
      .where('id = :itemId', { itemId })
      .andWhere('cart_id IN (SELECT id FROM carts WHERE user_id = :userId)', { userId })
      .execute();

    if (!result.affected) {
      throw new NotFoundException('Sản phẩm không có trong giỏ hàng');
    }
    return { itemId };
  }

  async clearCart(userId: string): Promise<Cart> {
    const cart = await this.getCart(userId);
    if (cart.items.length > 0) await this.cartItemRepository.remove(cart.items);
    return this.getCart(userId);
  }

  async mergeCart(userId: string, localItems: any[]): Promise<Cart> {
    const cart = await this.getCart(userId);
    for (const localItem of localItems) {
      const { productId, variantId, quantity, note } = localItem;
      if (!productId || !variantId) continue;
      let item = cart.items.find(
        (cartItem) => cartItem.variantId === variantId &&
          (cartItem.note === note || (!cartItem.note && !note)),
      );
      if (item) {
        item.quantity += quantity;
        await this.cartItemRepository.save(item);
      } else {
        item = await this.cartItemRepository.save(this.cartItemRepository.create({
          cartId: cart.id,
          productId,
          variantId,
          quantity,
          note: note || null,
        }));
        cart.items.push(item);
      }
    }
    return this.getCart(userId);
  }
}
