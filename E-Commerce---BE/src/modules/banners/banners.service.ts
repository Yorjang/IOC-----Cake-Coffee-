import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from './entities/banner.entity';

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner)
    private readonly bannersRepository: Repository<Banner>,
  ) {}

  async findAll(): Promise<Banner[]> {
    return this.bannersRepository.find({ order: { sortOrder: 'ASC', createdAt: 'DESC' } });
  }

  async create(payload: any): Promise<Banner> {
    if (!payload.imageUrl) {
      throw new BadRequestException('Vui lòng chọn hình ảnh banner.');
    }
    const banner = this.bannersRepository.create({
      title: payload.title || 'Banner mới',
      imageUrl: payload.imageUrl,
      linkUrl: payload.linkUrl || '',
      sortOrder: Number(payload.sortOrder || 0),
      isActive: payload.isActive ?? true,
      startsAt: payload.startsAt ? new Date(payload.startsAt) : null,
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
    });
    return this.bannersRepository.save(banner);
  }

  async updateActiveStatus(id: string, isActive: boolean): Promise<Banner> {
    const banner = await this.bannersRepository.findOne({ where: { id } });
    if (!banner) {
      throw new BadRequestException('Banner không tồn tại.');
    }
    banner.isActive = isActive;
    return this.bannersRepository.save(banner);
  }

  async delete(id: string): Promise<{ message: string }> {
    const banner = await this.bannersRepository.findOne({ where: { id } });
    if (!banner) {
      throw new BadRequestException('Banner không tồn tại.');
    }
    await this.bannersRepository.delete(id);
    return { message: 'Xóa banner thành công.' };
  }
}
