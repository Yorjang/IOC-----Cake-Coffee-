import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ProductVariant } from '../products/product-variant.entity';
import { Product } from '../products/product.entity';

@Entity('combo_items')
@Index(['comboProductId', 'sortOrder'])
export class ComboItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'combo_product_id', type: 'uuid' })
  comboProductId: string;

  @ManyToOne(() => Product, (product) => product.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'combo_product_id' })
  comboProduct: Product;

  @Column({ name: 'child_product_id', type: 'uuid' })
  childProductId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'child_product_id' })
  childProduct: Product;

  @Column({ name: 'child_variant_id', type: 'uuid', nullable: true })
  childVariantId: string | null;

  @ManyToOne(() => ProductVariant, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'child_variant_id' })
  childVariant: ProductVariant | null;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ name: 'is_optional', type: 'boolean', default: false })
  isOptional: boolean;

  @Column({ name: 'sort_order', type: 'smallint', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
