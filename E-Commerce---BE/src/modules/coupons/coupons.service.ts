import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon, CouponStatus, DiscountType } from './coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly coupons: Repository<Coupon>,
  ) {}

  async findAll(): Promise<Coupon[]> {
    return this.coupons.find({ order: { createdAt: 'DESC' } });
  }

  async create(dto: CreateCouponDto): Promise<Coupon> {
    const existing = await this.coupons.findOne({ where: { code: dto.code.toUpperCase().trim() } });
    if (existing) {
      throw new BadRequestException('Mã voucher này đã tồn tại.');
    }

    const coupon = this.coupons.create({
      code: dto.code.toUpperCase().trim(),
      name: dto.name || `Voucher ${dto.code.toUpperCase()}`,
      description: dto.description || '',
      discountType: dto.discountType || DiscountType.PERCENT,
      discountValue: Number(dto.discountValue),
      minOrderValue: Number(dto.minOrderValue || 0),
      usageLimit: dto.usageLimit ? Number(dto.usageLimit) : null,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : new Date(),
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // default 30 days
      status: CouponStatus.ACTIVE,
    });

    return this.coupons.save(coupon);
  }

  async delete(id: string): Promise<{ message: string }> {
    const coupon = await this.coupons.findOne({ where: { id } });
    if (!coupon) {
      throw new BadRequestException('Voucher không tồn tại.');
    }
    await this.coupons.delete(id);
    return { message: 'Xóa voucher thành công' };
  }
}
