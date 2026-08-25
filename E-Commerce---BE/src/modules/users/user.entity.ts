import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { LoyaltyTier } from '../points/loyalty-tier.entity';

export enum UserRole {
    GUEST = 'guest',
    CUSTOMER = 'customer',
    STAFF = 'staff',
    CASHIER = 'cashier',
    STORE_MANAGER = 'store_manager',
    ADMIN = 'admin',
    SHIPPER = 'shipper',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'full_name', length: 150 })
    fullName: string;

    @Column({ unique: true, nullable: true, length: 255 })
    email: string;

    @Column({ name: 'avatar_url', type: 'text', nullable: true })
    avatarUrl: string;

    @Column({ unique: true, nullable: true, length: 20 })
    phone: string;

    @Column({ name: 'password_hash', length: 255 })
    passwordHash: string;

    @Column({ type: 'enum', enum: UserRole, default: UserRole.GUEST })
    role: UserRole;

    @Column({ name: 'branch_id', type: 'uuid', nullable: true })
    branchId: string;

    @Column({ name: 'is_active', default: false })
    isActive: boolean;

    @Column({ name: 'email_verified_at', type: 'timestamptz', nullable: true })
    emailVerifiedAt: Date;

    @Column({ type: 'text', nullable: true })
    address: string;

    @Column({ type: 'int', default: 0 })
    points: number;

    @Column({ name: 'tier_id', type: 'uuid', nullable: true })
    tierId: string;

    @ManyToOne(() => LoyaltyTier, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'tier_id' })
    currentTier: LoyaltyTier;

    @Column({ name: 'total_spent', type: 'numeric', precision: 14, scale: 0, default: 0 })
    totalSpent: number;

    @Column({ name: 'total_products_purchased', type: 'int', default: 0 })
    totalProductsPurchased: number;

    @Column({ name: 'last_order_completed_at', type: 'timestamptz', nullable: true })
    lastOrderCompletedAt: Date;

    @Column({ name: 'tier_evaluated_at', type: 'timestamptz', nullable: true })
    tierEvaluatedAt: Date;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}

