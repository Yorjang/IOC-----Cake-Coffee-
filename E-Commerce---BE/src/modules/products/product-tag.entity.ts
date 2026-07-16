import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('product_tags')
export class ProductTag {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, length: 100 })
    name: string;

    @Column({ unique: true, length: 100 })
    slug: string;

    @ManyToMany(() => Product, (product) => product.tags)
    products: Product[];
}
