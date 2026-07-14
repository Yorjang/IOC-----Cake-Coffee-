import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from '../products/product.entity';

export enum DiscountType {
  PERCENT = 'percent',
  FIXED = 'fixed',
}

export enum CouponScope {
  ORDER = 'order',
  PRODUCT = 'product',
  CATEGORY = 'category',
  VARIANT = 'variant',
  BRANCH = 'branch',
}

export enum CouponStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  DISABLED = 'disabled',
}

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  code: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'discount_type', type: 'enum', enum: DiscountType })
  discountType: DiscountType;

  @Column({ name: 'discount_value', type: 'numeric', precision: 12, scale: 2 })
  discountValue: number;

  @Column({ name: 'coupon_scope', type: 'enum', enum: CouponScope, default: CouponScope.ORDER })
  couponScope: CouponScope;

  @Column({ name: 'min_order_value', type: 'numeric', precision: 12, scale: 0, default: 0 })
  minOrderValue: number;

  @Column({ name: 'min_quantity', type: 'integer', default: 1 })
  minQuantity: number;

  @Column({ name: 'max_discount', type: 'numeric', precision: 12, scale: 0, nullable: true })
  maxDiscount: number;

  @Column({ name: 'usage_limit', type: 'integer', nullable: true })
  usageLimit: number;

  @Column({ name: 'per_customer_limit', type: 'integer', default: 1 })
  perCustomerLimit: number;

  @Column({ name: 'used_count', type: 'integer', default: 0 })
  usedCount: number;

  @Column({ type: 'enum', enum: CouponStatus, default: CouponStatus.ACTIVE })
  status: CouponStatus;

  @Column({ name: 'starts_at', type: 'timestamptz' })
  startsAt: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId: string;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
