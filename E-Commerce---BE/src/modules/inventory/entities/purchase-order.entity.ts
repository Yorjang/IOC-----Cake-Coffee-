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
import { PurchaseOrderItem } from './purchase-order-item.entity';
import { PurchaseRequest } from './purchase-request.entity';

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  PENDING = 'PENDING',
  ORDERED = 'ORDERED',
  SHIPPED = 'SHIPPED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  RECEIVED = 'RECEIVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

@Entity('purchase_orders')
@Index(['poCode'], { unique: true })
@Index(['branchId', 'status'])
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'po_code', length: 50, unique: true })
  poCode: string;

  @Column({ name: 'pr_id', type: 'uuid', nullable: true })
  prId: string;

  @ManyToOne(() => PurchaseRequest, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'pr_id' })
  purchaseRequest: PurchaseRequest;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'supplier_id', type: 'uuid', nullable: true })
  supplierId: string;

  @Column({ name: 'supplier_name', length: 255, nullable: true })
  supplierName: string;

  @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
  createdById: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column({
    type: 'enum',
    enum: PurchaseOrderStatus,
    default: PurchaseOrderStatus.PENDING,
  })
  status: PurchaseOrderStatus;

  @Column({ name: 'expected_delivery', type: 'timestamptz', nullable: true })
  expectedDelivery: Date;

  @Column({ name: 'delivery_timeframe', type: 'varchar', length: 10, nullable: true })
  deliveryTimeframe: string;

  @Column({ name: 'expired_at', type: 'timestamptz', nullable: true })
  expiredAt: Date;

  @Column({ name: 'cancelled_by_id', type: 'uuid', nullable: true })
  cancelledById: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'cancelled_by_id' })
  cancelledBy: User;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date;

  @Column({ name: 'cancel_reason', type: 'text', nullable: true })
  cancelReason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @OneToMany(() => PurchaseOrderItem, (item) => item.purchaseOrder, {
    cascade: true,
  })
  items: PurchaseOrderItem[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
