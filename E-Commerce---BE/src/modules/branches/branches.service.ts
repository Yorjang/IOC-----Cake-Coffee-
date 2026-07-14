import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { CreateBranchDto } from "./dto/create-branch.dto";
import { UpdateBranchDto } from "./dto/update-branch.dto";
import { Branch, BranchStatus } from "./branch.entity";
import { BranchOpeningHour, DayOfWeek } from "./branch-opening-hour.entity";
import {
  UpdateOpeningHoursDto,
  UpsertOpeningHourDto,
} from "./dto/upsert-opening-hour.dto";
import { User, UserRole } from "../users/user.entity";

export type BranchWithDistance = Branch & {
  distanceKm: number;
  deliveryEstimate: string;
  isOpenNow: boolean;
  todayOpeningHour: BranchOpeningHour | null;
};

export type BranchWithOpenStatus = Branch & {
  isOpenNow: boolean;
  todayOpeningHour: BranchOpeningHour | null;
};

export type BranchOpenStatus = {
  isOpenNow: boolean;
  dayOfWeek: DayOfWeek;
  openingTime: string | null;
  closingTime: string | null;
  isClosed: boolean;
};

const DAYS_OF_WEEK = Object.values(DayOfWeek);

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branches: Repository<Branch>,
    @InjectRepository(BranchOpeningHour)
    private readonly openingHours: Repository<BranchOpeningHour>,
  ) {}

  findAll(): Promise<Branch[]> {
    return this.branches.find({ order: { createdAt: "DESC" } });
  }

  async findActive(): Promise<BranchWithOpenStatus[]> {
    const branches = await this.branches.find({
      where: { isActive: true, status: BranchStatus.ACTIVE },
      order: { name: "ASC" },
    });
    const now = this.getLocalDateTime();
    const todayHours = branches.length
      ? await this.openingHours.find({
          where: {
            branchId: In(branches.map((branch) => branch.id)),
            dayOfWeek: now.dayOfWeek,
          },
        })
      : [];
    const hoursByBranchId = new Map(todayHours.map((hour) => [hour.branchId, hour]));
    return branches.map((branch) => {
      const todayOpeningHour = hoursByBranchId.get(branch.id) ?? null;
      return {
        ...branch,
        isOpenNow: this.isOpenAt(todayOpeningHour, now.time),
        todayOpeningHour,
      } as BranchWithOpenStatus;
    });
  }

  async findNearest(
    latitude: number,
    longitude: number,
  ): Promise<BranchWithDistance> {
    const branches = await this.findNearby(latitude, longitude);
    const nearestOpenBranch = branches.find((branch) => branch.isOpenNow);
    if (!nearestOpenBranch) {
      throw new BadRequestException("No branch is open at this time");
    }
    return nearestOpenBranch;
  }

  async findNearby(
    latitude: number,
    longitude: number,
  ): Promise<BranchWithDistance[]> {
    this.validateCoordinates(latitude, longitude);

    const branches = await this.findActive();
    const branchesWithDistance = branches
      .filter((branch) => branch.latitude !== null && branch.longitude !== null)
      .map((branch) => {
        const distanceKm = this.calculateDistanceKm(
          latitude,
          longitude,
          Number(branch.latitude),
          Number(branch.longitude),
        );

        return {
          ...branch,
          distanceKm: Number(distanceKm.toFixed(2)),
          deliveryEstimate: this.estimateDelivery(distanceKm),
        } as BranchWithDistance;
      })
      .filter((branch) => Number.isFinite(branch.distanceKm))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    if (branchesWithDistance.length === 0) {
      throw new BadRequestException("No active branch has coordinates");
    }

    return branchesWithDistance;
  }

  async findById(id: string): Promise<Branch | null> {
    return this.branches.findOne({ where: { id } });
  }

  async getOpeningHours(id: string): Promise<BranchOpeningHour[]> {
    await this.requireBranch(id);
    const hours = await this.openingHours.find({ where: { branchId: id } });
    return hours.sort(
      (left, right) =>
        DAYS_OF_WEEK.indexOf(left.dayOfWeek) -
        DAYS_OF_WEEK.indexOf(right.dayOfWeek),
    );
  }

  async getOpenStatus(id: string): Promise<BranchOpenStatus> {
    await this.requireBranch(id);
    const now = this.getLocalDateTime();
    const hour = await this.openingHours.findOne({
      where: { branchId: id, dayOfWeek: now.dayOfWeek },
    });
    return {
      isOpenNow: this.isOpenAt(hour, now.time),
      dayOfWeek: now.dayOfWeek,
      openingTime: hour?.openingTime ?? null,
      closingTime: hour?.closingTime ?? null,
      isClosed: hour?.isClosed ?? true,
    };
  }

  async updateOpeningHours(
    branchId: string,
    dto: UpdateOpeningHoursDto,
    user: User,
  ): Promise<BranchOpeningHour[]> {
    await this.requireBranch(branchId);
    if (user.role === UserRole.STORE_MANAGER && user.branchId !== branchId) {
      throw new ForbiddenException(
        "Store managers can only update their assigned branch",
      );
    }
    const days = dto.openingHours.map((item) => item.dayOfWeek);
    if (new Set(days).size !== days.length) {
      throw new BadRequestException("Each day of week can only appear once");
    }
    dto.openingHours.forEach((item) => this.validateOpeningHour(item));

    await this.openingHours.manager.transaction(async (manager) => {
      for (const item of dto.openingHours) {
        await manager.getRepository(BranchOpeningHour).upsert(
          {
            branchId,
            dayOfWeek: item.dayOfWeek,
            openingTime: item.isClosed ? null : item.openingTime,
            closingTime: item.isClosed ? null : item.closingTime,
            isClosed: item.isClosed,
          },
          ["branchId", "dayOfWeek"],
        );
      }
    });
    return this.getOpeningHours(branchId);
  }

  async create(createBranchDto: CreateBranchDto): Promise<Branch> {
    const branch = this.branches.create({
      ...createBranchDto,
      isActive: createBranchDto.isActive ?? true,
    });
    return this.branches.save(branch);
  }

  async update(id: string, updateBranchDto: UpdateBranchDto, user: User): Promise<Branch> {
    const branch = await this.findById(id);
    if (!branch) {
      throw new BadRequestException("Branch not found");
    }
    if (user.role === UserRole.STORE_MANAGER && user.branchId !== id) {
      throw new ForbiddenException("Store managers can only update their assigned branch");
    }

    Object.assign(branch, {
      ...updateBranchDto,
      phone: updateBranchDto.phone === "" ? null : updateBranchDto.phone,
      email: updateBranchDto.email === "" ? null : updateBranchDto.email,
      latitude:
        updateBranchDto.latitude === "" ? null : updateBranchDto.latitude,
      longitude:
        updateBranchDto.longitude === "" ? null : updateBranchDto.longitude,
    });

    return this.branches.save(branch);
  }

  async delete(id: string): Promise<{ message: string }> {
    const branch = await this.findById(id);
    if (!branch) {
      throw new BadRequestException("Branch not found");
    }

    await this.branches.delete(id);
    return { message: "Branch deleted successfully" };
  }

  private validateCoordinates(latitude: number, longitude: number): void {
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new BadRequestException("Latitude or longitude is invalid");
    }
  }

  private async requireBranch(id: string): Promise<Branch> {
    const branch = await this.findById(id);
    if (!branch) throw new NotFoundException("Branch not found");
    return branch;
  }

  private validateOpeningHour(item: UpsertOpeningHourDto): void {
    if (item.isClosed) return;
    if (!item.openingTime || !item.closingTime) {
      throw new BadRequestException(
        "Opening and closing times are required for an open day",
      );
    }
    if (item.openingTime === item.closingTime) {
      throw new BadRequestException(
        "Opening and closing times must be different",
      );
    }
  }

  private getLocalDateTime(date = new Date()): {
    dayOfWeek: DayOfWeek;
    time: string;
  } {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(date);
    const value = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? "";
    return {
      dayOfWeek: value("weekday").toLowerCase() as DayOfWeek,
      time: `${value("hour")}:${value("minute")}:${value("second")}`,
    };
  }

  private isOpenAt(
    hour: BranchOpeningHour | null | undefined,
    time: string,
  ): boolean {
    if (!hour || hour.isClosed || !hour.openingTime || !hour.closingTime)
      return false;
    const opening = hour.openingTime.slice(0, 8);
    const closing = hour.closingTime.slice(0, 8);
    if (opening < closing) return time >= opening && time < closing;
    return time >= opening || time < closing;
  }

  private calculateDistanceKm(
    fromLatitude: number,
    fromLongitude: number,
    toLatitude: number,
    toLongitude: number,
  ): number {
    const earthRadiusKm = 6371;
    const latDistance = this.toRadians(toLatitude - fromLatitude);
    const lngDistance = this.toRadians(toLongitude - fromLongitude);
    const fromLatRad = this.toRadians(fromLatitude);
    const toLatRad = this.toRadians(toLatitude);

    const a =
      Math.sin(latDistance / 2) * Math.sin(latDistance / 2) +
      Math.cos(fromLatRad) *
        Math.cos(toLatRad) *
        Math.sin(lngDistance / 2) *
        Math.sin(lngDistance / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
  }

  private toRadians(value: number): number {
    return (value * Math.PI) / 180;
  }

  private estimateDelivery(distanceKm: number): string {
    const minMinutes = Math.max(25, Math.ceil(22 + distanceKm * 4));
    const maxMinutes =
      minMinutes + (distanceKm <= 5 ? 12 : distanceKm <= 12 ? 18 : 25);

    return `${minMinutes}-${maxMinutes} phút`;
  }
}
