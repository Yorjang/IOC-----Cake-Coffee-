import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Index } from 'typeorm';
import { Order, DeliveryStatus } from '../orders/order.entity';
import { User } from '../users/user.entity';

@Entity('delivery_logs')
@Index(['orderId'])
@Index(['shipperId'])
@Index(['createdAt'])
export class DeliveryLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'shipper_id', type: 'uuid', nullable: true })
  shipperId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'shipper_id' })
  shipper: User;

  @Column({ name: 'status', type: 'enum', enum: DeliveryStatus })
  status: DeliveryStatus;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
