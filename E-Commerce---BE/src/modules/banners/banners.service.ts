import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from './banner.entity';
import { CreateBannerDto } from './dto/create-banner.dto';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class BannersService implements OnModuleInit {
  constructor(
    @InjectRepository(Banner)
    private readonly banners: Repository<Banner>,
  ) {}

  async onModuleInit() {
    try {
      await this.banners.query('ALTER TABLE banners ADD COLUMN IF NOT EXISTS branch_id UUID');
    } catch (err) {
      console.error('Error adding branch_id to banners:', err);
    }
    try {
      await this.banners.query(
        'ALTER TABLE banners ADD CONSTRAINT fk_banners_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL'
      );
    } catch (err) {
      // Ignore if constraint already exists
    }
  }

  async findAll(user?: User, isAdminPath?: boolean): Promise<Banner[]> {
    const where: any = {};
    if (isAdminPath && user?.role === UserRole.STORE_MANAGER && user.branchId) {
      where.branchId = user.branchId;
    }
    return this.banners.find({
      where: Object.keys(where).length > 0 ? where : undefined,
      order: { sortOrder: 'ASC', createdAt: 'DESC' }
    });
  }

  async findPublicActive(): Promise<Banner[]> { return this.banners.find({ where: { isActive: true }, order: { sortOrder: 'ASC', createdAt: 'DESC' } }); }
  
  async create(dto: CreateBannerDto, user: User): Promise<Banner> {
    const branchId = user.role === UserRole.STORE_MANAGER ? user.branchId : dto.branchId;
    const { title, subtitle, imageUrl, linkUrl, sortOrder, isActive, startsAt, expiresAt, position } = dto;
    const banner = this.banners.create({
      title: title || 'Banner mới',
      imageUrl,
      linkUrl: linkUrl || '',
      sortOrder: Number(sortOrder || 0),
      isActive: isActive ?? true,
      startsAt: startsAt ? new Date(startsAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      subtitle: subtitle?.trim() || null,
      branchId: branchId || null,
      position: position || 'home_main',
    });
    return this.banners.save(banner);
  }

  async updateActiveStatus(id: string, isActive: boolean, user: User): Promise<Banner> {
    const banner = await this.banners.findOne({ where: { id } });
    if (!banner) {
      throw new BadRequestException('Banner không tồn tại.');
    }
    if (user.role === UserRole.STORE_MANAGER && banner.branchId !== user.branchId) {
      throw new BadRequestException('Bạn không có quyền chỉnh sửa banner của chi nhánh khác');
    }
    banner.isActive = isActive;
    return this.banners.save(banner);
  }

  async update(id: string, dto: CreateBannerDto, user: User): Promise<Banner> { 
    const banner = await this.banners.findOne({ where: { id } }); 
    if (!banner) throw new BadRequestException('Banner not found.'); 
    if (user.role === UserRole.STORE_MANAGER && banner.branchId !== user.branchId) {
      throw new BadRequestException('Bạn không có quyền chỉnh sửa banner của chi nhánh khác');
    }
    const branchId = user.role === UserRole.ADMIN ? (dto.branchId !== undefined ? dto.branchId : banner.branchId) : banner.branchId;
    
    banner.title = dto.title?.trim() || banner.title; 
    banner.subtitle = dto.subtitle?.trim() || null; 
    banner.imageUrl = dto.imageUrl; 
    banner.linkUrl = dto.linkUrl?.trim() || ''; 
    banner.sortOrder = Number(dto.sortOrder ?? banner.sortOrder); 
    banner.isActive = dto.isActive ?? banner.isActive; 
    banner.branchId = branchId || null;
    if (dto.position) banner.position = dto.position;
    return this.banners.save(banner); 
  }

  async delete(id: string, user: User): Promise<{ message: string }> {
    const banner = await this.banners.findOne({ where: { id } });
    if (!banner) {
      throw new BadRequestException('Banner không tồn tại.');
    }
    if (user.role === UserRole.STORE_MANAGER && banner.branchId !== user.branchId) {
      throw new BadRequestException('Bạn không có quyền xóa banner của chi nhánh khác');
    }
    await this.banners.delete(id);
    return { message: 'Xóa banner thành công.' };
  }
}
