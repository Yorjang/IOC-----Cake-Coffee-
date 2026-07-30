import { Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Branch } from '../branches/branch.entity';
import { ComboItem } from '../combos/combo-item.entity';
import { Category } from './category.entity';
import { ProductTag } from './product-tag.entity';
import { ProductTopping } from './product-topping.entity';
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

    @Column({ name: 'branch_id', type: 'uuid', nullable: true })
    branchId: string;

    @ManyToOne(() => Branch, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'branch_id' })
    branch: Branch;

    @OneToMany(() => ProductVariant, (variant) => variant.product)
    variants: ProductVariant[];

    @OneToMany(() => ProductTopping, (topping) => topping.product)
    toppings: ProductTopping[];

    @ManyToMany(() => ProductTag, (tag) => tag.products)
    @JoinTable({
        name: 'product_tag_map',
        joinColumn: { name: 'product_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
    })
    tags: ProductTag[];

    @OneToMany(() => ComboItem, (item) => item.comboProduct)
    items: ComboItem[];

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
