import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon, CouponStatus, DiscountType, CouponScope } from './coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class CouponsService implements OnModuleInit {
  constructor(
    @InjectRepository(Coupon)
    private readonly coupons: Repository<Coupon>,
  ) {}

  async onModuleInit() {
    try {
      await this.coupons.query('ALTER TABLE coupons ADD COLUMN IF NOT EXISTS product_id UUID');
    } catch (err) {
      console.error('Error adding product_id to coupons:', err);
    }
    try {
      await this.coupons.query(
        'ALTER TABLE coupons ADD CONSTRAINT fk_coupons_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL'
      );
    } catch (err) {
      // Ignore if constraint already exists
    }
    try {
      await this.coupons.query('ALTER TABLE coupons ADD COLUMN IF NOT EXISTS target_size VARCHAR(50)');
    } catch (err) {
      console.error('Error adding target_size to coupons:', err);
    }

  }

  async findAll(): Promise<Coupon[]> {
    const list = await this.coupons.find({
      relations: { product: { category: true }, category: true },
      order: { createdAt: 'DESC' },
    });
    return list.map(c => ({
      ...c,
      isActive: c.status === CouponStatus.ACTIVE,
    })) as any;
  }

  async findPublicActive(): Promise<Coupon[]> {
    const coupons = await this.coupons.find({
      where: { status: CouponStatus.ACTIVE },
      relations: { product: { category: true }, category: true },
      order: { createdAt: 'DESC' },
    });
    const now = new Date();
    return coupons
      .filter(c => new Date(c.expiresAt) > now)
      .map(c => ({
        ...c,
        isActive: true,
      })) as any;
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
      status: dto.isActive === false ? CouponStatus.DISABLED : CouponStatus.ACTIVE,
      productId: dto.productId || null,
      categoriesId: dto.categoriesId || null,
      targetSize: dto.targetSize || null,
      couponScope: dto.targetSize
        ? CouponScope.VARIANT
        : dto.productId
          ? CouponScope.PRODUCT
          : dto.categoriesId
            ? CouponScope.CATEGORY
            : CouponScope.ORDER,
      maxDiscount: dto.maxDiscount !== undefined && dto.maxDiscount !== null ? Number(dto.maxDiscount) : null,

    });

    const saved = await this.coupons.save(coupon);
    return {
      ...saved,
      isActive: saved.status === CouponStatus.ACTIVE,
    } as any;
  }

  async update(id: string, dto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.coupons.findOne({ where: { id } });
    if (!coupon) {
      throw new BadRequestException('Voucher không tồn tại.');
    }

    if (dto.code) {
      const codeUpper = dto.code.toUpperCase().trim();
      if (codeUpper !== coupon.code) {
        const existing = await this.coupons.findOne({ where: { code: codeUpper } });
        if (existing) {
          throw new BadRequestException('Mã voucher này đã tồn tại.');
        }
        coupon.code = codeUpper;
      }
    }

    if (dto.name !== undefined) coupon.name = dto.name;
    if (dto.description !== undefined) coupon.description = dto.description;
    if (dto.discountType !== undefined) coupon.discountType = dto.discountType;
    if (dto.discountValue !== undefined) coupon.discountValue = Number(dto.discountValue);
    if (dto.minOrderValue !== undefined) coupon.minOrderValue = Number(dto.minOrderValue);
    if (dto.usageLimit !== undefined) coupon.usageLimit = dto.usageLimit ? Number(dto.usageLimit) : null;
    if (dto.startsAt !== undefined) coupon.startsAt = new Date(dto.startsAt);
    if (dto.expiresAt !== undefined) coupon.expiresAt = new Date(dto.expiresAt);
    if (dto.productId !== undefined) {
      coupon.productId = dto.productId || null;
    }
    if (dto.categoriesId !== undefined) {
      coupon.categoriesId = dto.categoriesId || null;
    }
    if (dto.targetSize !== undefined) {
      coupon.targetSize = dto.targetSize || null;
    }
    // Recompute couponScope based on latest productId / categoriesId / targetSize
    if (dto.productId !== undefined || dto.categoriesId !== undefined || dto.targetSize !== undefined) {
      const effectiveProductId = dto.productId !== undefined ? dto.productId : coupon.productId;
      const effectiveCategoriesId = dto.categoriesId !== undefined ? dto.categoriesId : coupon.categoriesId;
      const effectiveTargetSize = dto.targetSize !== undefined ? dto.targetSize : coupon.targetSize;
      coupon.couponScope = effectiveTargetSize
        ? CouponScope.VARIANT
        : effectiveProductId
          ? CouponScope.PRODUCT
          : effectiveCategoriesId
            ? CouponScope.CATEGORY
            : CouponScope.ORDER;
    }

    if (dto.maxDiscount !== undefined) coupon.maxDiscount = dto.maxDiscount !== null ? Number(dto.maxDiscount) : null;
    if (dto.isActive !== undefined) {
      coupon.status = dto.isActive ? CouponStatus.ACTIVE : CouponStatus.DISABLED;
    }

    const saved = await this.coupons.save(coupon);
    return {
      ...saved,
      isActive: saved.status === CouponStatus.ACTIVE,
    } as any;
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


