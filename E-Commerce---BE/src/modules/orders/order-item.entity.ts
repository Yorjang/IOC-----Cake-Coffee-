import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ProductVariant } from '../products/product-variant.entity';
import { Product } from '../products/product.entity';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'variant_id', type: 'uuid' })
  variantId: string;

  @ManyToOne(() => ProductVariant)
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  @Column({ name: 'product_name', length: 255 })
  productName: string;

  @Column({ name: 'variant_name', length: 255 })
  variantName: string;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ name: 'unit_price', type: 'numeric', precision: 12, scale: 0 })
  unitPrice: number;

  @Column({ name: 'discount_amount', type: 'numeric', precision: 12, scale: 0, default: 0 })
  discountAmount: number;

  @Column({ name: 'total_price', type: 'numeric', precision: 12, scale: 0 })
  totalPrice: number;
}
