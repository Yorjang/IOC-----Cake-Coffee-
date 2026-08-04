import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

export enum CodRemittanceStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
}

@Entity('cod_remittances')
export class CodRemittance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'shipper_id', type: 'uuid' })
  shipperId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'shipper_id' })
  shipper: User;

  @Column({ name: 'cashier_id', type: 'uuid', nullable: true })
  cashierId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'cashier_id' })
  cashier: User;

  @Column({ name: 'total_expected', type: 'numeric', precision: 12, scale: 0, default: 0 })
  totalExpected: number;

  @Column({ name: 'total_actual', type: 'numeric', precision: 12, scale: 0, nullable: true })
  totalActual: number;

  @Column({ type: 'numeric', precision: 12, scale: 0, default: 0 })
  discrepancy: number;

  @Column({ type: 'enum', enum: CodRemittanceStatus, default: CodRemittanceStatus.PENDING })
  status: CodRemittanceStatus;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
