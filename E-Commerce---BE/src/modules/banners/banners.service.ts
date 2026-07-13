import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from './banner.entity';
import { CreateBannerDto } from './dto/create-banner.dto';

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner)
    private readonly banners: Repository<Banner>,
  ) {}

  async findAll(): Promise<Banner[]> {
    return this.banners.find({ order: { sortOrder: 'ASC', createdAt: 'DESC' } });
  }

  async create(dto: CreateBannerDto): Promise<Banner> {
    const { title, imageUrl, linkUrl, sortOrder, isActive, startsAt, expiresAt } = dto;
    const banner = this.banners.create({
      title: title || 'Banner mới',
      imageUrl,
      linkUrl: linkUrl || '',
      sortOrder: Number(sortOrder || 0),
      isActive: isActive ?? true,
      startsAt: startsAt ? new Date(startsAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });
    return this.banners.save(banner);
  }

  async updateActiveStatus(id: string, isActive: boolean): Promise<Banner> {
    const banner = await this.banners.findOne({ where: { id } });
    if (!banner) {
      throw new BadRequestException('Banner không tồn tại.');
    }
    banner.isActive = isActive;
    return this.banners.save(banner);
  }

  async delete(id: string): Promise<{ message: string }> {
    const banner = await this.banners.findOne({ where: { id } });
    if (!banner) {
      throw new BadRequestException('Banner không tồn tại.');
    }
    await this.banners.delete(id);
    return { message: 'Xóa banner thành công.' };
  }
}
