import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Branch } from './entities/branch.entity';

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
      where: { isActive: true },
      order: { name: 'ASC' },
    });
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
}
