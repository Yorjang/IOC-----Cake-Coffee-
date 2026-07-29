import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Product } from './product.entity';
import { VariantIngredient } from '../inventory/entities/variant-ingredient.entity';

export enum VariantStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    OUT_OF_STOCK = 'out_of_stock',
}

@Entity('product_variants')
export class ProductVariant {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'product_id', type: 'uuid' })
    productId: string;

    @ManyToOne(() => Product, (product) => product.variants, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column({ unique: true, length: 100 })
    sku: string;

    @Column({ name: 'variant_name', length: 255 })
    variantName: string;

    @Column({ length: 50, nullable: true })
    size: string;

    @Column({ length: 100, nullable: true })
    flavor: string;

    @Column({ length: 100, nullable: true })
    topping: string;

    @Column({ type: 'numeric', precision: 12, scale: 0 })
    price: number;

    @Column({
        type: 'enum',
        enum: VariantStatus,
        default: VariantStatus.ACTIVE,
    })
    status: VariantStatus;

    @Column({ name: 'image_url', type: 'text', nullable: true })
    imageUrl: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;

    @OneToMany(() => VariantIngredient, (vi) => vi.variant)
    variantIngredients: VariantIngredient[];
}
