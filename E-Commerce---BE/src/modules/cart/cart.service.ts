import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';

type CartOwner = { userId: string | null; sessionId: string | null };
export type CartMutationResult = { itemId: string; quantity: number };

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem) private readonly cartItemRepository: Repository<CartItem>,
  ) {}

  async getCart(userId: string | undefined, sessionId: string | undefined, branchId: string): Promise<Cart> {
    const owner = this.resolveOwner(userId, sessionId);
    return this.getOrCreateCart(this.cartRepository.manager, owner, branchId, true);
  }

  async addItem(
    userId: string | undefined,
    sessionId: string | undefined,
    branchId: string,
    dto: AddCartItemDto,
  ): Promise<CartMutationResult> {
    const owner = this.resolveOwner(userId, sessionId);
    return this.cartRepository.manager.transaction(async (manager) => {
      const cart = await this.getOrCreateCart(manager, owner, branchId, false);
      const items = manager.getRepository(CartItem);
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
    userId: string | undefined,
    sessionId: string | undefined,
    branchId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartMutationResult> {
    const owner = this.resolveOwner(userId, sessionId);
    const values: Partial<CartItem> = { quantity: dto.quantity };
    if (dto.note !== undefined) values.note = dto.note || null;
    const result = await this.cartItemRepository
      .createQueryBuilder()
      .update(CartItem)
      .set(values)
      .where('id = :itemId', { itemId })
      .andWhere(this.ownerItemCondition(owner), { ownerId: owner.userId ?? owner.sessionId, branchId })
      .execute();
    if (!result.affected) throw new NotFoundException('Sản phẩm không có trong giỏ hàng của chi nhánh này');
    return { itemId, quantity: dto.quantity };
  }

  async removeItem(
    userId: string | undefined,
    sessionId: string | undefined,
    branchId: string,
    itemId: string,
  ): Promise<{ itemId: string }> {
    const owner = this.resolveOwner(userId, sessionId);
    const result = await this.cartItemRepository
      .createQueryBuilder()
      .delete()
      .from(CartItem)
      .where('id = :itemId', { itemId })
      .andWhere(this.ownerItemCondition(owner), { ownerId: owner.userId ?? owner.sessionId, branchId })
      .execute();
    if (!result.affected) throw new NotFoundException('Sản phẩm không có trong giỏ hàng của chi nhánh này');
    return { itemId };
  }

  async clearCart(
    userId: string | undefined,
    sessionId: string | undefined,
    branchId: string,
  ): Promise<{ message: string }> {
    const owner = this.resolveOwner(userId, sessionId);
    await this.cartItemRepository
      .createQueryBuilder()
      .delete()
      .from(CartItem)
      .where(this.ownerItemCondition(owner), { ownerId: owner.userId ?? owner.sessionId, branchId })
      .execute();
    return { message: 'Cart cleared successfully' };
  }

  async mergeSessionCart(
    userId: string | undefined,
    sessionId: string | undefined,
    branchId: string,
  ): Promise<Cart> {
    if (!userId) throw new UnauthorizedException('Login is required to merge a session cart');
    const guestOwner = this.resolveOwner(undefined, sessionId);
    await this.cartRepository.manager.transaction(async (manager) => {
      const carts = manager.getRepository(Cart);
      const items = manager.getRepository(CartItem);
      const guestCart = await carts.findOne({
        where: { sessionId: guestOwner.sessionId, branchId },
        relations: { items: true },
      });
      if (!guestCart) return;

      const userCart = await this.getOrCreateCart(
        manager,
        { userId, sessionId: null },
        branchId,
        false,
      );
      for (const guestItem of guestCart.items) {
        const existing = await items.findOne({
          where: {
            cartId: userCart.id,
            variantId: guestItem.variantId,
            note: guestItem.note,
          },
        });
        if (existing) {
          await items.update(existing.id, { quantity: existing.quantity + guestItem.quantity });
          await items.delete(guestItem.id);
        } else {
          await items.update(guestItem.id, { cartId: userCart.id });
        }
      }
      await carts.delete(guestCart.id);
    });
    return this.getCart(userId, undefined, branchId);
  }

  private resolveOwner(userId?: string, sessionId?: string): CartOwner {
    if (userId) return { userId, sessionId: null };
    if (!sessionId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sessionId)) {
      throw new BadRequestException('A valid X-Session-Id header is required for guest carts');
    }
    return { userId: null, sessionId };
  }

  private async getOrCreateCart(
    manager: EntityManager,
    owner: CartOwner,
    branchId: string,
    withRelations: boolean,
  ): Promise<Cart> {
    const carts = manager.getRepository(Cart);
    const where = owner.userId
      ? { userId: owner.userId, branchId }
      : { sessionId: owner.sessionId, branchId };
    let cart = await carts.findOne({
      where,
      relations: withRelations ? { items: { product: { category: true }, variant: true } } : undefined,
    });
    if (!cart) {
      cart = await carts.save(carts.create({
        ...owner,
        branchId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }));
      cart.items = [];
    }
    return cart;
  }

  private ownerItemCondition(owner: CartOwner): string {
    const column = owner.userId ? 'user_id' : 'session_id';
    return `cart_id IN (SELECT id FROM carts WHERE ${column} = :ownerId AND branch_id = :branchId)`;
  }
}
