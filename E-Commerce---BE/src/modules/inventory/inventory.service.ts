import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchVariantStock } from './branch-variant-stock.entity';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(BranchVariantStock)
    private readonly stocks: Repository<BranchVariantStock>,
  ) {}

  async findAll(): Promise<BranchVariantStock[]> {
    return this.stocks.find({
      relations: { branch: true, variant: { product: true } },
      order: { updatedAt: 'DESC' },
    });
  }

  async updateStock(id: string, dto: UpdateInventoryDto): Promise<BranchVariantStock> {
    const stock = await this.stocks.findOne({
      where: { id },
      relations: { branch: true, variant: { product: true } }
    });
    if (!stock) {
      throw new BadRequestException('Mặt hàng tồn kho không tồn tại.');
    }

    if (dto.quantity !== undefined) {
      stock.quantity = Number(dto.quantity);
    }
    if (dto.minQuantity !== undefined) {
      stock.minQuantity = Number(dto.minQuantity);
    }

    return this.stocks.save(stock);
  }
}
