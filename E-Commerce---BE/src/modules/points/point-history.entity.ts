import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';

export enum PointTransactionType {
  ORDER_COMPLETED = 'order_completed',
  PRODUCT_REVIEW = 'product_review',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
  POINTS_REDEEMED = 'points_redeemed',
}

@Entity('point_histories')
export class PointHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int' })
  points: number;

  @Column({ type: 'int' })
  balance: number;

  @Column({ type: 'enum', enum: PointTransactionType })
  type: PointTransactionType;

  @Column({ name: 'reference_id', type: 'varchar', length: 255, nullable: true })
  referenceId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
