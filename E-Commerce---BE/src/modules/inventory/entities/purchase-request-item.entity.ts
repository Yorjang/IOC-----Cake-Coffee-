import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PurchaseRequest } from './purchase-request.entity';
import { Ingredient } from './ingredient.entity';
import { ProductVariant } from '../../products/product-variant.entity';

@Entity('purchase_request_items')
@Index(['prId'])
export class PurchaseRequestItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pr_id', type: 'uuid' })
  prId: string;

  @ManyToOne(() => PurchaseRequest, (pr) => pr.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pr_id' })
  purchaseRequest: PurchaseRequest;

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

  @Column({ name: 'requested_quantity', type: 'numeric', precision: 10, scale: 3 })
  requestedQuantity: number;

  @Column({ type: 'text', nullable: true })
  note: string;
}
