import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';

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
          product: {
            category: true,
          },
          variant: true,
        },
      },
    });

    if (!cart) {
      cart = this.cartRepository.create({
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
      cart = await this.cartRepository.save(cart);
      cart.items = [];
    }

    return cart;
  }

  async addItem(
    userId: string,
    productId: string,
    variantId: string,
    quantity: number,
    note: string,
  ): Promise<Cart> {
    const cart = await this.getCart(userId);

    // Find if the variant and note already exist in the cart
    let item = cart.items.find(
      (i) => i.variantId === variantId && (i.note === note || (!i.note && !note)),
    );

    if (item) {
      item.quantity += quantity;
      await this.cartItemRepository.save(item);
    } else {
      item = this.cartItemRepository.create({
        cartId: cart.id,
        productId,
        variantId,
        quantity,
        note: note || null,
      });
      await this.cartItemRepository.save(item);
    }

    return this.getCart(userId);
  }

  async updateItem(
    userId: string,
    itemId: string,
    quantity: number,
    note?: string,
  ): Promise<Cart> {
    const cart = await this.getCart(userId);
    const item = cart.items.find((i) => i.id === itemId);

    if (!item) {
      throw new NotFoundException('Sản phẩm không có trong giỏ hàng');
    }

    item.quantity = quantity;
    if (note !== undefined) {
      item.note = note || null;
    }

    await this.cartItemRepository.save(item);
    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.getCart(userId);
    const item = cart.items.find((i) => i.id === itemId);

    if (!item) {
      throw new NotFoundException('Sản phẩm không có trong giỏ hàng');
    }

    await this.cartItemRepository.remove(item);
    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<Cart> {
    const cart = await this.getCart(userId);
    if (cart.items.length > 0) {
      await this.cartItemRepository.remove(cart.items);
    }
    return this.getCart(userId);
  }

  async mergeCart(userId: string, localItems: any[]): Promise<Cart> {
    const cart = await this.getCart(userId);

    for (const localItem of localItems) {
      const { productId, variantId, quantity, note } = localItem;
      if (!productId || !variantId) continue;

      let item = cart.items.find(
        (i) => i.variantId === variantId && (i.note === note || (!i.note && !note)),
      );

      if (item) {
        item.quantity += quantity;
        await this.cartItemRepository.save(item);
      } else {
        item = this.cartItemRepository.create({
          cartId: cart.id,
          productId,
          variantId,
          quantity,
          note: note || null,
        });
        await this.cartItemRepository.save(item);
      }
    }

    return this.getCart(userId);
  }
}
