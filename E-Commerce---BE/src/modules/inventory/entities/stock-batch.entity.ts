import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Branch } from '../../branches/branch.entity';
import { Ingredient } from './ingredient.entity';
import { ProductVariant } from '../../products/product-variant.entity';

export enum BatchStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  DEPLETED = 'DEPLETED',
  DISCARDED = 'DISCARDED',
}

@Entity('stock_batches')
@Index(['branchId', 'ingredientId'])
@Index(['branchId', 'variantId'])
@Index(['expiryDate'])
export class StockBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'batch_code', length: 100 })
  batchCode: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'ingredient_id', type: 'uuid', nullable: true })
  ingredientId: string;

  @ManyToOne(() => Ingredient, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient;

  @Column({ name: 'variant_id', type: 'uuid', nullable: true })
  variantId: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  @Column({ name: 'initial_quantity', type: 'numeric', precision: 12, scale: 3 })
  initialQuantity: number;

  @Column({ type: 'numeric', precision: 12, scale: 3 })
  quantity: number;

  @Column({ name: 'manufacture_date', type: 'timestamptz', nullable: true })
  manufactureDate: Date;

  @Column({ name: 'expiry_date', type: 'timestamptz' })
  expiryDate: Date;

  @Column({ name: 'received_date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  receivedDate: Date;

  @Column({ length: 255, nullable: true })
  supplier: string;

  @Column({
    type: 'enum',
    enum: BatchStatus,
    default: BatchStatus.ACTIVE,
  })
  status: BatchStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
