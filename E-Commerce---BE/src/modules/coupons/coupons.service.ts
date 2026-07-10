import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon, CouponStatus, DiscountType } from './entities/coupon.entity';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponsRepository: Repository<Coupon>,
  ) {}

  async findAll(): Promise<Coupon[]> {
    return this.couponsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async create(payload: any): Promise<Coupon> {
    const existing = await this.couponsRepository.findOne({ where: { code: payload.code.toUpperCase().trim() } });
    if (existing) {
      throw new BadRequestException('Mã voucher này đã tồn tại.');
    }

    const coupon = this.couponsRepository.create({
      code: payload.code.toUpperCase().trim(),
      name: payload.name || `Voucher ${payload.code.toUpperCase()}`,
      description: payload.description || '',
      discountType: payload.discountType || DiscountType.PERCENT,
      discountValue: Number(payload.discountValue),
      minOrderValue: Number(payload.minOrderValue || 0),
      usageLimit: payload.usageLimit ? Number(payload.usageLimit) : null,
      startsAt: payload.startsAt ? new Date(payload.startsAt) : new Date(),
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // default 30 days
      status: CouponStatus.ACTIVE,
    });

    return this.couponsRepository.save(coupon);
  }

  async delete(id: string): Promise<{ message: string }> {
    const coupon = await this.couponsRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new BadRequestException('Voucher không tồn tại.');
    }
    await this.couponsRepository.delete(id);
    return { message: 'Xóa voucher thành công' };
  }
}
