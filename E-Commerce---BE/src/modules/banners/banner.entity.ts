import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('banners')
export class Banner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ name: 'image_url', type: 'text' })
  imageUrl: string;

  @Column({ name: 'link_url', type: 'text', nullable: true })
  linkUrl: string;

  @Column({ name: 'sort_order', type: 'smallint', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'starts_at', type: 'timestamptz', nullable: true })
  startsAt: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
