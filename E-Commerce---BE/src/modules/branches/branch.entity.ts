import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { BranchOpeningHour } from "./branch-opening-hour.entity";

export enum BranchStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  TEMPORARILY_CLOSED = "temporarily_closed",
}

@Entity("branches")
export class Branch {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ type: "text" })
  address: string;

  @Column({ nullable: true, length: 20 })
  phone: string;

  @Column({ nullable: true, length: 255 })
  email: string;

  @Column({ type: "numeric", nullable: true })
  latitude: string;

  @Column({ type: "numeric", nullable: true })
  longitude: string;

  @Column({ type: "enum", enum: BranchStatus, enumName: "branch_status" })
  status: BranchStatus;

  @Column({ name: "is_active", default: true })
  isActive: boolean;

  @OneToMany(() => BranchOpeningHour, (openingHour) => openingHour.branch)
  openingHours: BranchOpeningHour[];

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
