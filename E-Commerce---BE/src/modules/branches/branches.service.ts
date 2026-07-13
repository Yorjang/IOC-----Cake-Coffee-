import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Branch, BranchStatus } from './entities/branch.entity';

export type BranchWithDistance = Branch & {
  distanceKm: number;
  deliveryEstimate: string;
};

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchesRepository: Repository<Branch>,
  ) {}

  findAll(): Promise<Branch[]> {
    return this.branchesRepository.find({ order: { createdAt: 'DESC' } });
  }

  findActive(): Promise<Branch[]> {
    return this.branchesRepository.find({
      where: { isActive: true, status: BranchStatus.ACTIVE },
      order: { name: 'ASC' },
    });
  }

  async findNearest(latitude: number, longitude: number): Promise<BranchWithDistance> {
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

    return branchesWithDistance[0];
  }

  async findById(id: string): Promise<Branch | null> {
    return this.branchesRepository.findOne({ where: { id } });
  }

  async create(createBranchDto: CreateBranchDto): Promise<Branch> {
    const branch = this.branchesRepository.create({
      ...createBranchDto,
      isActive: createBranchDto.isActive ?? true,
    });
    return this.branchesRepository.save(branch);
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

    return this.branchesRepository.save(branch);
  }

  async delete(id: string): Promise<{ message: string }> {
    const branch = await this.findById(id);
    if (!branch) {
      throw new BadRequestException('Branch not found');
    }

    await this.branchesRepository.delete(id);
    return { message: 'Branch deleted successfully' };
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
    if (distanceKm <= 2) return '30-45 phút';
    if (distanceKm <= 5) return '40-55 phút';
    if (distanceKm <= 8) return '50-65 phút';
    return '60-90 phút';
  }
}
