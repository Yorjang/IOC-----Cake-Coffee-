import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Branch } from '../../branches/branch.entity';
import { ProductVariant } from '../../products/product-variant.entity';
import { User } from '../../users/user.entity';
import { Ingredient } from './ingredient.entity';
import { StockBatch } from './stock-batch.entity';

export enum InventoryTransactionType {
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
  ADJUSTMENT = 'ADJUSTMENT',
  WASTE = 'WASTE',
}

@Entity('inventory_transactions')
@Index(['branchId', 'createdAt'])
@Index(['ingredientId'])
@Index(['variantId'])
export class InventoryTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({
    name: 'transaction_type',
    type: 'enum',
    enum: InventoryTransactionType,
  })
  transactionType: InventoryTransactionType;

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

  @Column({ name: 'batch_id', type: 'uuid', nullable: true })
  batchId: string;

  @ManyToOne(() => StockBatch, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'batch_id' })
  batch: StockBatch;

  @Column({ name: 'quantity_change', type: 'numeric', precision: 12, scale: 3 })
  quantityChange: number;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ name: 'reference_id', length: 255, nullable: true })
  referenceId: string;

  @Column({ name: 'performed_by_id', type: 'uuid', nullable: true })
  performedById: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'performed_by_id' })
  performedBy: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
