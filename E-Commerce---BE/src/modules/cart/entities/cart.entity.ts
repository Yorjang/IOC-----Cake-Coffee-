import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CartItem } from './cart-item.entity';

export enum FulfillmentType {
  DELIVERY = 'delivery',
  PICKUP = 'pickup',
}

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'session_id', type: 'uuid', nullable: true })
  sessionId: string;

  @Column({ name: 'branch_id', type: 'uuid', nullable: true })
  branchId: string;

  @Column({
    name: 'fulfillment_type',
    type: 'enum',
    enum: FulfillmentType,
    default: FulfillmentType.DELIVERY,
    nullable: true,
  })
  fulfillmentType: FulfillmentType;

  @Column({ name: 'expires_at', type: 'timestamptz', default: () => "now() + interval '7 days'" })
  expiresAt: Date;

  @OneToMany(() => CartItem, (item) => item.cart, { cascade: true })
  items: CartItem[];
}
