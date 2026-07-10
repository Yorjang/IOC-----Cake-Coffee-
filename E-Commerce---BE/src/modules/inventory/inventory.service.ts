import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchVariantStock } from './entities/branch-variant-stock.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(BranchVariantStock)
    private readonly stockRepository: Repository<BranchVariantStock>,
  ) {}

  async findAll(): Promise<BranchVariantStock[]> {
    return this.stockRepository.find({
      relations: { branch: true, variant: { product: true } },
      order: { updatedAt: 'DESC' },
    });
  }

  async updateStock(id: string, payload: { quantity?: number; minQuantity?: number }): Promise<BranchVariantStock> {
    const stock = await this.stockRepository.findOne({
      where: { id },
      relations: { branch: true, variant: { product: true } }
    });
    if (!stock) {
      throw new BadRequestException('Mặt hàng tồn kho không tồn tại.');
    }

    if (payload.quantity !== undefined) {
      stock.quantity = Number(payload.quantity);
    }
    if (payload.minQuantity !== undefined) {
      stock.minQuantity = Number(payload.minQuantity);
    }

    return this.stockRepository.save(stock);
  }
}
