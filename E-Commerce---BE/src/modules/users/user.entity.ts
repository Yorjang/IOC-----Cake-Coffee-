import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
    GUEST = 'guest',
    CUSTOMER = 'customer',
    STAFF = 'staff',
    CASHIER = 'cashier',
    STORE_MANAGER = 'store_manager',
    ADMIN = 'admin',
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

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
