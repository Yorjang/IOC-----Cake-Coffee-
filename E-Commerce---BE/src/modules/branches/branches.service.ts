import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Branch, BranchStatus } from './branch.entity';

export type BranchWithDistance = Branch & {
  distanceKm: number;
  deliveryEstimate: string;
};

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branches: Repository<Branch>,
  ) {}

  findAll(): Promise<Branch[]> {
    return this.branches.find({ order: { createdAt: 'DESC' } });
  }

  findActive(): Promise<Branch[]> {
    return this.branches.find({
      where: { isActive: true, status: BranchStatus.ACTIVE },
      order: { name: 'ASC' },
    });
  }

  async findNearest(latitude: number, longitude: number): Promise<BranchWithDistance> {
    const branches = await this.findNearby(latitude, longitude);
    return branches[0];
  }

  async findNearby(latitude: number, longitude: number): Promise<BranchWithDistance[]> {
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
      throw new BadRequestException('No active branch has coordinates');
    }

    return branchesWithDistance;
  }

  async findById(id: string): Promise<Branch | null> {
    return this.branches.findOne({ where: { id } });
  }

  async create(createBranchDto: CreateBranchDto): Promise<Branch> {
    const branch = this.branches.create({
      ...createBranchDto,
      isActive: createBranchDto.isActive ?? true,
    });
    return this.branches.save(branch);
  }

  async update(id: string, updateBranchDto: UpdateBranchDto): Promise<Branch> {
    const branch = await this.findById(id);
    if (!branch) {
      throw new BadRequestException('Branch not found');
    }

    Object.assign(branch, {
      ...updateBranchDto,
      phone: updateBranchDto.phone === '' ? null : updateBranchDto.phone,
      email: updateBranchDto.email === '' ? null : updateBranchDto.email,
      latitude: updateBranchDto.latitude === '' ? null : updateBranchDto.latitude,
      longitude: updateBranchDto.longitude === '' ? null : updateBranchDto.longitude,
    });

    return this.branches.save(branch);
  }

  async delete(id: string): Promise<{ message: string }> {
    const branch = await this.findById(id);
    if (!branch) {
      throw new BadRequestException('Branch not found');
    }

    await this.branches.delete(id);
    return { message: 'Branch deleted successfully' };
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
      throw new BadRequestException('Latitude or longitude is invalid');
    }
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
    const maxMinutes = minMinutes + (distanceKm <= 5 ? 12 : distanceKm <= 12 ? 18 : 25);

    return `${minMinutes}-${maxMinutes} phút`;
  }
}
