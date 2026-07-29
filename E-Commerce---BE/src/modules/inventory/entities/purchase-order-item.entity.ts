import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PurchaseOrder } from './purchase-order.entity';
import { Ingredient } from './ingredient.entity';
import { ProductVariant } from '../../products/product-variant.entity';

@Entity('purchase_order_items')
@Index(['poId'])
export class PurchaseOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'po_id', type: 'uuid' })
  poId: string;

  @ManyToOne(() => PurchaseOrder, (po) => po.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'po_id' })
  purchaseOrder: PurchaseOrder;

  @Column({ name: 'ingredient_id', type: 'uuid', nullable: true })
  ingredientId: string;

  @ManyToOne(() => Ingredient, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient;

  @Column({ name: 'variant_id', type: 'uuid', nullable: true })
  variantId: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  @Column({ name: 'ordered_quantity', type: 'numeric', precision: 10, scale: 3 })
  orderedQuantity: number;

  @Column({ name: 'received_quantity', type: 'numeric', precision: 10, scale: 3, default: 0 })
  receivedQuantity: number;

  @Column({ name: 'unit_price', type: 'numeric', precision: 15, scale: 2, default: 0 })
  unitPrice: number;
}
