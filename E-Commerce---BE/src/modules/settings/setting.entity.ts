import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('settings')
export class Setting {
  @PrimaryColumn({ length: 100 })
  key: string;

  @Column({ type: 'text', nullable: true })
  value: string;

  @Column({ nullable: true, length: 255 })
  description: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
