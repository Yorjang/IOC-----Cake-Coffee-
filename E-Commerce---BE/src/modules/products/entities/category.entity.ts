import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('categories')
export class Category {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'parent_id', type: 'uuid', nullable: true })
    parentId: string;

    @Column({ unique: true, length: 200 })
    name: string;

    @Column({ unique: true, length: 200 })
    slug: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ name: 'image_url', type: 'text', nullable: true })
    imageUrl: string;

    @Column({ name: 'sort_order', type: 'smallint', default: 0 })
    sortOrder: number;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;
}
