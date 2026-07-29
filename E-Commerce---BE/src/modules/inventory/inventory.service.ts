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
export class InventoryService {
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
  // SP2-09: Tồn kho variant theo chi nhánh
  // ───────────────────────────────────────────────────────────────────────────
  async findVariantStocks(query: QueryVariantStockDto) {
    const where: any = {};
    if (query.branchId) where.branchId = query.branchId;
    if (query.variantId) where.variantId = query.variantId;

    const stocks = await this.variantStockRepo.find({
      where,
      relations: { branch: true, variant: { product: true } },
      order: { updatedAt: 'DESC' },
    });

    return stocks.map((stock) => ({
      ...stock,
      availableQuantity: stock.quantity - stock.reservedQuantity,
    }));
  }

  async findVariantStockById(id: string) {
    const stock = await this.variantStockRepo.findOne({
      where: { id },
      relations: { branch: true, variant: { product: true } },
    });
    if (!stock) {
      throw new NotFoundException('Mặt hàng tồn kho không tồn tại.');
    }
    return {
      ...stock,
      availableQuantity: stock.quantity - stock.reservedQuantity,
    };
  }

  async updateVariantStock(id: string, dto: UpdateInventoryDto) {
    const stock = await this.variantStockRepo.findOne({
      where: { id },
      relations: { branch: true, variant: { product: true } },
    });
    if (!stock) {
      throw new NotFoundException('Mặt hàng tồn kho không tồn tại.');
    }

    if (dto.quantity !== undefined) {
      stock.quantity = Number(dto.quantity);
    }
    if (dto.minQuantity !== undefined) {
      stock.minQuantity = Number(dto.minQuantity);
    }

    const saved = await this.variantStockRepo.save(stock);
    return {
      ...saved,
      availableQuantity: saved.quantity - saved.reservedQuantity,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SP2-12: API công thức nguyên liệu theo variant (BOM)
  // ───────────────────────────────────────────────────────────────────────────
  async findVariantIngredients(variantId: string) {
    return this.variantIngredientRepo.find({
      where: { variantId },
      relations: { ingredient: true, variant: { product: true } },
      order: { createdAt: 'ASC' },
    });
  }

  async addVariantIngredient(variantId: string, dto: CreateVariantIngredientDto) {
    const existing = await this.variantIngredientRepo.findOne({
      where: { variantId, ingredientId: dto.ingredientId },
    });
    if (existing) {
      throw new BadRequestException('Nguyên liệu này đã có trong định mức của variant.');
    }

    const recipeItem = this.variantIngredientRepo.create({
      variantId,
      ingredientId: dto.ingredientId,
      quantityRequired: Number(dto.quantityRequired),
      unit: dto.unit,
    });

    return this.variantIngredientRepo.save(recipeItem);
  }

  async bulkSetVariantIngredients(variantId: string, dto: BulkSetVariantIngredientsDto) {
    await this.variantIngredientRepo.delete({ variantId });

    const newItems = dto.ingredients.map((item) =>
      this.variantIngredientRepo.create({
        variantId,
        ingredientId: item.ingredientId,
        quantityRequired: Number(item.quantityRequired),
        unit: item.unit,
      }),
    );

    return this.variantIngredientRepo.save(newItems);
  }

  async deleteVariantIngredient(id: string) {
    const item = await this.variantIngredientRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('Công thức nguyên liệu không tồn tại.');
    }
    await this.variantIngredientRepo.remove(item);
    return { message: 'Đã xóa nguyên liệu khỏi công thức variant.' };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SP2-13: API quản lý lô hàng (Stock Batches FEFO)
  // ───────────────────────────────────────────────────────────────────────────
  async createStockBatch(dto: CreateStockBatchDto, userId?: string) {
    if (!dto.ingredientId && !dto.variantId) {
      throw new BadRequestException('Lô hàng phải gắn với một Nguyên liệu hoặc một Variant sản phẩm.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const batch = queryRunner.manager.create(StockBatch, {
        batchCode: dto.batchCode,
        branchId: dto.branchId,
        ingredientId: dto.ingredientId,
        variantId: dto.variantId,
        initialQuantity: Number(dto.initialQuantity),
        quantity: Number(dto.initialQuantity),
        manufactureDate: dto.manufactureDate ? new Date(dto.manufactureDate) : undefined,
        expiryDate: new Date(dto.expiryDate),
        supplier: dto.supplier,
        status: BatchStatus.ACTIVE,
      });

      const savedBatch = await queryRunner.manager.save(batch);

      // Cập nhật tồn kho tổng tương ứng
      if (dto.ingredientId) {
        let stock = await queryRunner.manager.findOne(BranchIngredientStock, {
          where: { branchId: dto.branchId, ingredientId: dto.ingredientId },
        });
        if (!stock) {
          stock = queryRunner.manager.create(BranchIngredientStock, {
            branchId: dto.branchId,
            ingredientId: dto.ingredientId,
            quantity: Number(dto.initialQuantity),
            minStockLevel: 0,
          });
        } else {
          stock.quantity = Number(stock.quantity) + Number(dto.initialQuantity);
        }
        await queryRunner.manager.save(stock);
      }

      if (dto.variantId) {
        let stock = await queryRunner.manager.findOne(BranchVariantStock, {
          where: { branchId: dto.branchId, variantId: dto.variantId },
        });
        if (!stock) {
          stock = queryRunner.manager.create(BranchVariantStock, {
            branchId: dto.branchId,
            variantId: dto.variantId,
            quantity: Number(dto.initialQuantity),
            minQuantity: 0,
          });
        } else {
          stock.quantity = Number(stock.quantity) + Number(dto.initialQuantity);
        }
        await queryRunner.manager.save(stock);
      }

      // Ghi log giao dịch IMPORT
      const tx = queryRunner.manager.create(InventoryTransaction, {
        branchId: dto.branchId,
        transactionType: InventoryTransactionType.IMPORT,
        ingredientId: dto.ingredientId,
        variantId: dto.variantId,
        batchId: savedBatch.id,
        quantityChange: Number(dto.initialQuantity),
        reason: `Nhập lô hàng mới ${savedBatch.batchCode}`,
        referenceId: savedBatch.batchCode,
        performedById: userId,
      });
      await queryRunner.manager.save(tx);

      await queryRunner.commitTransaction();
      return savedBatch;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findStockBatches(query: QueryStockBatchDto) {
    const where: any = {};
    if (query.branchId) where.branchId = query.branchId;
    if (query.ingredientId) where.ingredientId = query.ingredientId;
    if (query.variantId) where.variantId = query.variantId;
    if (query.status) where.status = query.status;

    // FEFO: Ưu tiên sắp xếp theo Hạn sử dụng gần nhất trước (expiryDate ASC)
    return this.stockBatchRepo.find({
      where,
      relations: { branch: true, ingredient: true, variant: { product: true } },
      order: { expiryDate: 'ASC' },
    });
  }

  async findStockBatchById(id: string) {
    const batch = await this.stockBatchRepo.findOne({
      where: { id },
      relations: { branch: true, ingredient: true, variant: { product: true } },
    });
    if (!batch) {
      throw new NotFoundException('Lô hàng không tồn tại.');
    }
    return batch;
  }

  async updateStockBatch(id: string, dto: UpdateStockBatchDto) {
    const batch = await this.findStockBatchById(id);

    if (dto.quantity !== undefined) {
      batch.quantity = Number(dto.quantity);
      if (batch.quantity <= 0) {
        batch.status = BatchStatus.DEPLETED;
      }
    }
    if (dto.status) {
      batch.status = dto.status;
    }
    if (dto.expiryDate) {
      batch.expiryDate = new Date(dto.expiryDate);
    }
    if (dto.supplier !== undefined) {
      batch.supplier = dto.supplier;
    }

    return this.stockBatchRepo.save(batch);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SP2-14: API lịch sử giao dịch kho (Inventory Transactions Audit Log)
  // ───────────────────────────────────────────────────────────────────────────
  async recordTransaction(dto: CreateInventoryTransactionDto, userId?: string) {
    if (!dto.ingredientId && !dto.variantId) {
      throw new BadRequestException('Giao dịch phải chỉ định nguyên liệu hoặc variant.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const quantityChange = Number(dto.quantityChange);

      // Cập nhật tồn kho nguyên liệu nếu có
      if (dto.ingredientId) {
        let stock = await queryRunner.manager.findOne(BranchIngredientStock, {
          where: { branchId: dto.branchId, ingredientId: dto.ingredientId },
        });
        if (!stock) {
          if (quantityChange < 0) {
            throw new BadRequestException('Không đủ tồn kho nguyên liệu để xuất/hủy.');
          }
          stock = queryRunner.manager.create(BranchIngredientStock, {
            branchId: dto.branchId,
            ingredientId: dto.ingredientId,
            quantity: quantityChange,
            minStockLevel: 0,
          });
        } else {
          const newQty = Number(stock.quantity) + quantityChange;
          if (newQty < 0) {
            throw new BadRequestException('Số lượng xuất vượt quá tồn kho hiện tại.');
          }
          stock.quantity = newQty;
        }
        await queryRunner.manager.save(stock);
      }

      // Cập nhật tồn kho variant nếu có
      if (dto.variantId) {
        let stock = await queryRunner.manager.findOne(BranchVariantStock, {
          where: { branchId: dto.branchId, variantId: dto.variantId },
        });
        if (!stock) {
          if (quantityChange < 0) {
            throw new BadRequestException('Không đủ tồn kho variant để xuất/hủy.');
          }
          stock = queryRunner.manager.create(BranchVariantStock, {
            branchId: dto.branchId,
            variantId: dto.variantId,
            quantity: Math.round(quantityChange),
            minQuantity: 0,
          });
        } else {
          const newQty = Number(stock.quantity) + quantityChange;
          if (newQty < 0) {
            throw new BadRequestException('Số lượng xuất vượt quá tồn kho hiện tại.');
          }
          stock.quantity = Math.round(newQty);
        }
        await queryRunner.manager.save(stock);
      }

      // Lưu giao dịch
      const tx = queryRunner.manager.create(InventoryTransaction, {
        branchId: dto.branchId,
        transactionType: dto.transactionType,
        ingredientId: dto.ingredientId,
        variantId: dto.variantId,
        batchId: dto.batchId,
        quantityChange,
        reason: dto.reason,
        referenceId: dto.referenceId,
        performedById: userId,
      });
      const savedTx = await queryRunner.manager.save(tx);

      await queryRunner.commitTransaction();
      return savedTx;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findTransactions(query: QueryInventoryTransactionDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const queryBuilder = this.transactionRepo.createQueryBuilder('tx')
      .leftJoinAndSelect('tx.branch', 'branch')
      .leftJoinAndSelect('tx.ingredient', 'ingredient')
      .leftJoinAndSelect('tx.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      .leftJoinAndSelect('tx.batch', 'batch')
      .leftJoinAndSelect('tx.performedBy', 'performedBy');

    if (query.branchId) {
      queryBuilder.andWhere('tx.branchId = :branchId', { branchId: query.branchId });
    }
    if (query.transactionType) {
      queryBuilder.andWhere('tx.transactionType = :type', { type: query.transactionType });
    }
    if (query.ingredientId) {
      queryBuilder.andWhere('tx.ingredientId = :ingredientId', { ingredientId: query.ingredientId });
    }
    if (query.variantId) {
      queryBuilder.andWhere('tx.variantId = :variantId', { variantId: query.variantId });
    }
    if (query.startDate) {
      queryBuilder.andWhere('tx.createdAt >= :startDate', { startDate: new Date(query.startDate) });
    }
    if (query.endDate) {
      queryBuilder.andWhere('tx.createdAt <= :endDate', { endDate: new Date(query.endDate) });
    }

    queryBuilder
      .orderBy('tx.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SP2-15: API cảnh báo tồn kho thấp (Low Stock Alert)
  // ───────────────────────────────────────────────────────────────────────────
  async getLowStockAlerts(query: QueryLowStockDto) {
    const ingWhere: any = {};
    const varWhere: any = {};

    if (query.branchId) {
      ingWhere.branchId = query.branchId;
      varWhere.branchId = query.branchId;
    }

    const ingStocks = await this.branchIngredientStockRepo.find({
      where: ingWhere,
      relations: { branch: true, ingredient: true },
    });

    const varStocks = await this.variantStockRepo.find({
      where: varWhere,
      relations: { branch: true, variant: { product: true } },
    });

    const lowStockIngredients = ingStocks
      .filter((item) => Number(item.quantity) <= Number(item.minStockLevel))
      .map((item) => ({
        type: 'INGREDIENT',
        id: item.id,
        branchId: item.branchId,
        branchName: item.branch?.name,
        ingredientId: item.ingredientId,
        name: item.ingredient?.name,
        code: item.ingredient?.code,
        unit: item.ingredient?.unit,
        currentStock: Number(item.quantity),
        minStockLevel: Number(item.minStockLevel),
        shortfall: Number(item.minStockLevel) - Number(item.quantity),
      }));

    const lowStockVariants = varStocks
      .filter((item) => Number(item.quantity) <= Number(item.minQuantity))
      .map((item) => ({
        type: 'VARIANT',
        id: item.id,
        branchId: item.branchId,
        branchName: item.branch?.name,
        variantId: item.variantId,
        name: `${item.variant?.product?.name || ''} - ${item.variant?.variantName || ''}`,
        sku: item.variant?.sku,
        currentStock: Number(item.quantity),
        reservedQuantity: Number(item.reservedQuantity),
        availableQuantity: Number(item.quantity) - Number(item.reservedQuantity),
        minQuantity: Number(item.minQuantity),
        shortfall: Number(item.minQuantity) - Number(item.quantity),
      }));

    return {
      totalAlerts: lowStockIngredients.length + lowStockVariants.length,
      lowStockIngredients,
      lowStockVariants,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SP2-16: API cảnh báo sắp hết hạn (Expiry Warning)
  // ───────────────────────────────────────────────────────────────────────────
  async getExpiringBatches(query: QueryExpiryWarningDto) {
    const daysThreshold = query.daysThreshold ?? 7;
    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(now.getDate() + daysThreshold);

    const queryBuilder = this.stockBatchRepo.createQueryBuilder('batch')
      .leftJoinAndSelect('batch.branch', 'branch')
      .leftJoinAndSelect('batch.ingredient', 'ingredient')
      .leftJoinAndSelect('batch.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      .where('batch.status = :status', { status: BatchStatus.ACTIVE })
      .andWhere('batch.quantity > 0')
      .andWhere('batch.expiryDate <= :thresholdDate', { thresholdDate });

    if (query.branchId) {
      queryBuilder.andWhere('batch.branchId = :branchId', { branchId: query.branchId });
    }

    queryBuilder.orderBy('batch.expiryDate', 'ASC');

    const batches = await queryBuilder.getMany();

    const expiringBatches = batches.map((batch) => {
      const diffMs = new Date(batch.expiryDate).getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      return {
        id: batch.id,
        batchCode: batch.batchCode,
        branchId: batch.branchId,
        branchName: batch.branch?.name,
        itemName: batch.ingredient ? batch.ingredient.name : `${batch.variant?.product?.name || ''} (${batch.variant?.variantName || ''})`,
        itemType: batch.ingredient ? 'INGREDIENT' : 'VARIANT',
        quantity: Number(batch.quantity),
        expiryDate: batch.expiryDate,
        daysRemaining,
        isExpired: daysRemaining <= 0,
        supplier: batch.supplier,
      };
    });

    return {
      totalExpiring: expiringBatches.length,
      daysThreshold,
      expiringBatches,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Purchase Order & Inbound Barcode Scan Workflow
}
