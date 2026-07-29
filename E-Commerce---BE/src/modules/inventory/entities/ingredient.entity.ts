import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('ingredients')
@Index(['code'], { unique: true })
export class Ingredient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ unique: true, length: 50 })
  code: string;

  @Column({ length: 30, comment: 'Đơn vị tính: kg, g, l, ml, pack...' })
  unit: string;

  @Column({ name: 'cost_per_unit', type: 'numeric', precision: 12, scale: 2, default: 0 })
  costPerUnit: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
