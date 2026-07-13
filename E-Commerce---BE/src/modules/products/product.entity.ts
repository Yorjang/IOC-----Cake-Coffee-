import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Category } from './category.entity';
import { ProductVariant } from './product-variant.entity';

export enum ProductType {
    CAKE = 'cake',
    COFFEE = 'coffee',
    DRINK = 'drink',
    COMBO = 'combo',
}

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'category_id', type: 'uuid' })
    categoryId: string;

    @ManyToOne(() => Category)
    @JoinColumn({ name: 'category_id' })
    category: Category;

    @Column({ length: 255 })
    name: string;

    @Column({ unique: true, length: 255 })
    slug: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ name: 'ingredients_info', type: 'text', nullable: true })
    ingredientsInfo: string;

    @Column({ name: 'image_url', type: 'text', nullable: true })
    imageUrl: string;

    @Column({
        name: 'product_type',
        type: 'enum',
        enum: ProductType,
    })
    productType: ProductType;

    @Column({ name: 'requires_note', type: 'boolean', default: false })
    requiresNote: boolean;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @OneToMany(() => ProductVariant, (variant) => variant.product)
    variants: ProductVariant[];

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
