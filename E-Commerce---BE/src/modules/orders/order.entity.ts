import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Branch } from '../branches/branch.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  SHIPPING = 'shipping',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  COD = 'cod',
  MOMO = 'momo',
  VNPAY = 'vnpay',
  ZALOPAY = 'zalopay',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum OrderType {
  ONLINE = 'online',
  POS = 'pos',
}

export enum FulfillmentType {
  DELIVERY = 'delivery',
  PICKUP = 'pickup',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_code', length: 50, unique: true })
  orderCode: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'address_id', type: 'uuid', nullable: true })
  addressId: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ type: 'numeric', precision: 12, scale: 0, default: 0 })
  subtotal: number;

  @Column({ name: 'discount_amount', type: 'numeric', precision: 12, scale: 0, default: 0 })
  discountAmount: number;

  @Column({ name: 'shipping_fee', type: 'numeric', precision: 12, scale: 0, default: 0 })
  shippingFee: number;

  @Column({ name: 'total_amount', type: 'numeric', precision: 12, scale: 0, default: 0 })
  totalAmount: number;

  @Column({ name: 'payment_method', type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({ name: 'payment_status', type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Column({ name: 'order_status', type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  orderStatus: OrderStatus;

  @Column({ name: 'order_type', type: 'enum', enum: OrderType, default: OrderType.ONLINE })
  orderType: OrderType;

  @Column({ name: 'fulfillment_type', type: 'enum', enum: FulfillmentType, default: FulfillmentType.DELIVERY })
  fulfillmentType: FulfillmentType;

  @Column({ name: 'shipping_address_street', length: 255, nullable: true })
  shippingAddressStreet: string;

  @Column({ name: 'shipping_address_ward', length: 100, nullable: true })
  shippingAddressWard: string;

  @Column({ name: 'shipping_address_district', length: 100, nullable: true })
  shippingAddressDistrict: string;

  @Column({ name: 'shipping_address_province', length: 100, nullable: true })
  shippingAddressProvince: string;

  @Column({ name: 'shipping_address_phone', length: 20, nullable: true })
  shippingAddressPhone: string;

  @Column({ name: 'shipping_recipient_name', length: 150, nullable: true })
  shippingRecipientName: string;

  @Column({ name: 'pickup_at', type: 'timestamptz', nullable: true })
  pickupAt: Date;

  @Column({ name: 'delivery_at', type: 'timestamptz', nullable: true })
  deliveryAt: Date;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];
}
