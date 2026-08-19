import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { LoyaltyTier } from './loyalty-tier.entity';

export enum LoyaltyTierChangeReason {
  QUARTERLY_REVIEW = 'quarterly_review',
  ORDER_COMPLETED_UPGRADE = 'order_completed_upgrade',
  INACTIVE_1_YEAR_RESET = 'inactive_1_year_reset',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
}

@Entity('loyalty_tier_histories')
export class LoyaltyTierHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'old_tier_id', type: 'uuid', nullable: true })
  oldTierId: string;

  @ManyToOne(() => LoyaltyTier, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'old_tier_id' })
  oldTier: LoyaltyTier;

  @Column({ name: 'new_tier_id', type: 'uuid' })
  newTierId: string;

  @ManyToOne(() => LoyaltyTier, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'new_tier_id' })
  newTier: LoyaltyTier;

  @Column({ name: 'total_spent_at_eval', type: 'numeric', precision: 14, scale: 0, default: 0 })
  totalSpentAtEval: number;

  @Column({ name: 'total_products_at_eval', type: 'int', default: 0 })
  totalProductsAtEval: number;

  @Column({ name: 'change_reason', type: 'enum', enum: LoyaltyTierChangeReason })
  changeReason: LoyaltyTierChangeReason;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
