import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Repository } from 'typeorm';
import { UserRole } from '../users/user.entity';
import { BranchVariantStock } from './branch-variant-stock.entity';
import { CreateBranchIngredientStockDto, UpdateBranchIngredientStockDto } from './dto/branch-ingredient-stock.dto';
import { ConfirmInboundDto } from './dto/confirm-inbound.dto';
import { CreateIngredientDto, UpdateIngredientDto } from './dto/create-ingredient.dto';
import { CreateInventoryTransactionDto } from './dto/create-inventory-transaction.dto';
import { CreatePurchaseOrderDto, QueryPurchaseOrderDto } from './dto/create-purchase-order.dto';
import {
  QueryExpiryWarningDto,
  QueryIngredientStockDto,
  QueryInventoryTransactionDto,
  QueryLowStockDto,
  QueryStockBatchDto,
  QueryVariantStockDto,
} from './dto/query-inventory.dto';
import { CreateStockBatchDto, UpdateStockBatchDto } from './dto/stock-batch.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { BulkSetVariantIngredientsDto, CreateVariantIngredientDto } from './dto/variant-ingredient.dto';
import { BranchIngredientStock } from './entities/branch-ingredient-stock.entity';
import { Ingredient } from './entities/ingredient.entity';
import { InventoryTransaction, InventoryTransactionType } from './entities/inventory-transaction.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { PurchaseOrder, PurchaseOrderStatus } from './entities/purchase-order.entity';
import { BatchStatus, StockBatch } from './entities/stock-batch.entity';
import { VariantIngredient } from './entities/variant-ingredient.entity';

@Injectable()
export class IngredientService {
  constructor(
    @InjectRepository(BranchVariantStock)
    private readonly variantStockRepo: Repository<BranchVariantStock>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepo: Repository<Ingredient>,
    @InjectRepository(BranchIngredientStock)
    private readonly branchIngredientStockRepo: Repository<BranchIngredientStock>,
    @InjectRepository(VariantIngredient)
    private readonly variantIngredientRepo: Repository<VariantIngredient>,
    @InjectRepository(StockBatch)
    private readonly stockBatchRepo: Repository<StockBatch>,
    @InjectRepository(InventoryTransaction)
    private readonly transactionRepo: Repository<InventoryTransaction>,
    @InjectRepository(PurchaseOrder)
    private readonly poRepo: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private readonly poItemRepo: Repository<PurchaseOrderItem>,
    private readonly dataSource: DataSource,
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // SP2-10: API quản lý nguyên liệu (Master Data)
  // ───────────────────────────────────────────────────────────────────────────
  async createIngredient(dto: CreateIngredientDto): Promise<Ingredient> {
    const existing = await this.ingredientRepo.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new BadRequestException(`Mã nguyên liệu '${dto.code}' đã tồn tại.`);
    }

    const ingredient = this.ingredientRepo.create({
      name: dto.name,
      code: dto.code,
      unit: dto.unit,
      costPerUnit: dto.costPerUnit ?? 0,
      description: dto.description,
      isActive: dto.isActive ?? true,
    });

    return this.ingredientRepo.save(ingredient);
  }

  async findAllIngredients(search?: string, isActive?: boolean): Promise<Ingredient[]> {
    const where: any = {};
    if (search) {
      where.name = Like(`%${search}%`);
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.ingredientRepo.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async findIngredientById(id: string): Promise<Ingredient> {
    const ingredient = await this.ingredientRepo.findOne({ where: { id } });
    if (!ingredient) {
      throw new NotFoundException('Nguyên liệu không tồn tại.');
    }
    return ingredient;
  }

  async updateIngredient(id: string, dto: UpdateIngredientDto): Promise<Ingredient> {
    const ingredient = await this.findIngredientById(id);

    if (dto.code && dto.code !== ingredient.code) {
      const existing = await this.ingredientRepo.findOne({ where: { code: dto.code } });
      if (existing) {
        throw new BadRequestException(`Mã nguyên liệu '${dto.code}' đã tồn tại.`);
      }
    }

    Object.assign(ingredient, dto);
    return this.ingredientRepo.save(ingredient);
  }

  async deleteIngredient(id: string): Promise<{ message: string }> {
    const ingredient = await this.findIngredientById(id);
    ingredient.isActive = false;
    await this.ingredientRepo.save(ingredient);
    return { message: 'Đã hủy kích hoạt nguyên liệu thành công.' };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SP2-11: API tồn kho nguyên liệu theo chi nhánh
  // ───────────────────────────────────────────────────────────────────────────
  async findBranchIngredientStocks(query: QueryIngredientStockDto) {
    const where: any = {};
    if (query.branchId) where.branchId = query.branchId;
    if (query.ingredientId) where.ingredientId = query.ingredientId;

    return this.branchIngredientStockRepo.find({
      where,
      relations: { branch: true, ingredient: true },
      order: { updatedAt: 'DESC' },
    });
  }

  async upsertBranchIngredientStock(dto: CreateBranchIngredientStockDto) {
    let stock = await this.branchIngredientStockRepo.findOne({
      where: { branchId: dto.branchId, ingredientId: dto.ingredientId },
    });

    if (stock) {
      stock.quantity = Number(dto.quantity);
      if (dto.minStockLevel !== undefined) {
        stock.minStockLevel = Number(dto.minStockLevel);
      }
    } else {
      stock = this.branchIngredientStockRepo.create({
        branchId: dto.branchId,
        ingredientId: dto.ingredientId,
        quantity: Number(dto.quantity),
        minStockLevel: Number(dto.minStockLevel ?? 0),
      });
    }

    return this.branchIngredientStockRepo.save(stock);
  }

  async updateBranchIngredientStock(id: string, dto: UpdateBranchIngredientStockDto) {
    const stock = await this.branchIngredientStockRepo.findOne({
      where: { id },
      relations: { branch: true, ingredient: true },
    });
    if (!stock) {
      throw new NotFoundException('Bản ghi tồn kho nguyên liệu chi nhánh không tồn tại.');
    }

    if (dto.quantity !== undefined) {
      stock.quantity = Number(dto.quantity);
    }
    if (dto.minStockLevel !== undefined) {
      stock.minStockLevel = Number(dto.minStockLevel);
    }

    return this.branchIngredientStockRepo.save(stock);
  }

}
