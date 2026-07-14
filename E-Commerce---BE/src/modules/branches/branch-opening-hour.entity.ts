import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { Branch } from "./branch.entity";

export enum DayOfWeek {
  MONDAY = "monday",
  TUESDAY = "tuesday",
  WEDNESDAY = "wednesday",
  THURSDAY = "thursday",
  FRIDAY = "friday",
  SATURDAY = "saturday",
  SUNDAY = "sunday",
}

@Entity("branch_opening_hours")
@Unique("uq_branch_opening_hours_branch_day", ["branchId", "dayOfWeek"])
export class BranchOpeningHour {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "branch_id", type: "uuid" })
  branchId: string;

  @ManyToOne(() => Branch, (branch) => branch.openingHours, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "branch_id" })
  branch: Branch;

  @Column({
    name: "day_of_week",
    type: "enum",
    enum: DayOfWeek,
    enumName: "day_of_week",
  })
  dayOfWeek: DayOfWeek;

  @Column({ name: "opening_time", type: "time", nullable: true })
  openingTime: string | null;

  @Column({ name: "closing_time", type: "time", nullable: true })
  closingTime: string | null;

  @Column({ name: "is_closed", default: false })
  isClosed: boolean;
}
