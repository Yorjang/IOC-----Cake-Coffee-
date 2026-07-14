import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Branch } from '../branches/branch.entity';
import { ProductVariant } from '../products/product-variant.entity';

@Entity('branch_variant_stocks')
export class BranchVariantStock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId: string;

  @ManyToOne(() => Branch)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'variant_id', type: 'uuid' })
  variantId: string;

  @ManyToOne(() => ProductVariant)
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  @Column({ type: 'integer', default: 0 })
  quantity: number;

  @Column({ name: 'reserved_quantity', type: 'integer', default: 0 })
  reservedQuantity: number;

  @Column({ name: 'min_quantity', type: 'integer', default: 0 })
  minQuantity: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
