import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Branch } from '../../branches/branch.entity';
import { User } from '../../users/user.entity';
import { PurchaseRequestItem } from './purchase-request-item.entity';
import { PurchaseOrder } from './purchase-order.entity';

export enum PurchaseRequestStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Entity('purchase_requests')
@Index(['prCode'], { unique: true })
@Index(['branchId', 'status'])
export class PurchaseRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pr_code', length: 50, unique: true })
  prCode: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'requested_by_id', type: 'uuid' })
  requestedById: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'requested_by_id' })
  requestedBy: User;

  @Column({ name: 'approved_by_id', type: 'uuid', nullable: true })
  approvedById: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approved_by_id' })
  approvedBy: User;

  @Column({
    type: 'enum',
    enum: PurchaseRequestStatus,
    default: PurchaseRequestStatus.PENDING_APPROVAL,
  })
  status: PurchaseRequestStatus;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ name: 'delivery_timeframe', type: 'varchar', length: 10, nullable: true })
  deliveryTimeframe: string;

  @Column({ name: 'preferred_delivery_date', type: 'date', nullable: true })
  preferredDeliveryDate: Date;

  @Column({ name: 'cancelled_by_id', type: 'uuid', nullable: true })
  cancelledById: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'cancelled_by_id' })
  cancelledBy: User;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date;

  @Column({ name: 'cancel_reason', type: 'text', nullable: true })
  cancelReason: string;

  @OneToMany(() => PurchaseRequestItem, (item) => item.purchaseRequest, {
    cascade: true,
  })
  items: PurchaseRequestItem[];

  @OneToMany(() => PurchaseOrder, (po) => po.purchaseRequest)
  purchaseOrders: PurchaseOrder[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
