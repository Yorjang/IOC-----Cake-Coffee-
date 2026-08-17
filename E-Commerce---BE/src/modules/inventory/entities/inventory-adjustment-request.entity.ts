import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Branch } from '../../branches/branch.entity';
import { ProductVariant } from '../../products/product-variant.entity';
import { User } from '../../users/user.entity';
import { Ingredient } from './ingredient.entity';

export enum AdjustmentRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('inventory_adjustment_requests')
@Index(['branchId', 'status'])
export class InventoryAdjustmentRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'variant_id', type: 'uuid', nullable: true })
  variantId: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  @Column({ name: 'ingredient_id', type: 'uuid', nullable: true })
  ingredientId: string;

  @ManyToOne(() => Ingredient, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient;

  @Column({ name: 'current_quantity', type: 'integer' })
  currentQuantity: number;

  @Column({ name: 'requested_quantity', type: 'integer' })
  requestedQuantity: number;

  @Column({ name: 'current_min_quantity', type: 'integer', default: 0 })
  currentMinQuantity: number;

  @Column({ name: 'requested_min_quantity', type: 'integer', default: 0 })
  requestedMinQuantity: number;

  @Column({
    type: 'enum',
    enum: AdjustmentRequestStatus,
    default: AdjustmentRequestStatus.PENDING,
  })
  status: AdjustmentRequestStatus;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string;

  @Column({ name: 'requested_by_id', type: 'uuid', nullable: true })
  requestedById: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'requested_by_id' })
  requestedBy: User;

  @Column({ name: 'approved_by_id', type: 'uuid', nullable: true })
  approvedById: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approved_by_id' })
  approvedBy: User;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
