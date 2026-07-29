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
  // ───────────────────────────────────────────────────────────────────────────
  async createPurchaseOrder(dto: CreatePurchaseOrderDto, userId?: string) {
    const existing = await this.poRepo.findOne({ where: { poCode: dto.poCode } });
    if (existing) {
      throw new BadRequestException(`Mã đơn hàng '${dto.poCode}' đã tồn tại.`);
    }

    const items = dto.items.map((item) =>
      this.poItemRepo.create({
        ingredientId: item.ingredientId,
        variantId: item.variantId,
        orderedQuantity: Number(item.orderedQuantity),
        receivedQuantity: 0,
        unitPrice: Number(item.unitPrice ?? 0),
      }),
    );

    const po = this.poRepo.create({
      poCode: dto.poCode,
      branchId: dto.branchId,
      supplierId: dto.supplierId,
      supplierName: dto.supplierName,
      createdById: userId,
      status: PurchaseOrderStatus.PENDING,
      expectedDelivery: dto.expectedDelivery ? new Date(dto.expectedDelivery) : undefined,
      notes: dto.notes,
      items,
    });

    return this.poRepo.save(po);
  }

  async findPurchaseOrders(query: QueryPurchaseOrderDto) {
    const where: any = {};
    if (query.branchId) where.branchId = query.branchId;
    if (query.status) where.status = query.status;
    if (query.poCode) where.poCode = Like(`%${query.poCode}%`);

    return this.poRepo.find({
      where,
      relations: {
        branch: true,
        createdBy: true,
        items: { ingredient: true, variant: { product: true } },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findPurchaseOrderById(id: string) {
    const po = await this.poRepo.findOne({
      where: { id },
      relations: {
        branch: true,
        createdBy: true,
        items: { ingredient: true, variant: { product: true } },
      },
    });
    if (!po) {
      throw new NotFoundException('Phiếu đặt hàng không tồn tại.');
    }
    return po;
  }

  async scanInboundBarcode(poCode: string, user: any) {
    if (!poCode) {
      throw new BadRequestException('Mã barcode đơn hàng (po_code) là bắt buộc.');
    }

    const po = await this.poRepo.findOne({
      where: { poCode },
      relations: {
        branch: true,
        createdBy: true,
        items: { ingredient: true, variant: { product: true } },
      },
    });

    if (!po) {
      throw new NotFoundException(`Không tìm thấy phiếu đặt hàng với mã '${poCode}'.`);
    }

    // Branch isolation for Store Manager
    if (user?.role === UserRole.STORE_MANAGER && user?.branchId && po.branchId !== user.branchId) {
      throw new ForbiddenException('Store Manager chỉ có quyền kiểm kê/nhập hàng tại chi nhánh mình quản lý.');
    }

    if (po.status === PurchaseOrderStatus.RECEIVED) {
      throw new BadRequestException(`Phiếu đặt hàng '${poCode}' đã hoàn thành nhập kho trước đó.`);
    }

    if (po.status === PurchaseOrderStatus.CANCELLED) {
      throw new BadRequestException(`Phiếu đặt hàng '${poCode}' đã bị hủy.`);
    }

    return {
      status: 'success',
      data: {
        po_id: po.id,
        po_code: po.poCode,
        branch_id: po.branchId,
        branch_name: po.branch?.name,
        supplier: {
          id: po.supplierId || null,
          name: po.supplierName || 'N/A',
        },
        status: po.status,
        expected_delivery: po.expectedDelivery,
        created_at: po.createdAt,
        items: po.items.map((item) => ({
          po_item_id: item.id,
          ingredient_id: item.ingredientId,
          variant_id: item.variantId,
          name: item.ingredient ? item.ingredient.name : `${item.variant?.product?.name || ''} - ${item.variant?.variantName || ''}`,
          unit: item.ingredient ? item.ingredient.unit : 'Cái',
          ordered_quantity: Number(item.orderedQuantity),
          received_quantity: Number(item.receivedQuantity),
          unit_price: Number(item.unitPrice),
        })),
      },
    };
  }

  async confirmInbound(dto: ConfirmInboundDto, user: any) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const po = await queryRunner.manager.findOne(PurchaseOrder, {
        where: { id: dto.poId },
        relations: { items: { ingredient: true, variant: true } },
      });

      if (!po) {
        throw new NotFoundException('Phiếu đặt hàng không tồn tại.');
      }

      if (user?.role === UserRole.STORE_MANAGER && user?.branchId && po.branchId !== user.branchId) {
        throw new ForbiddenException('Store Manager chỉ có quyền nhập hàng tại chi nhánh mình quản lý.');
      }

      if (po.status === PurchaseOrderStatus.RECEIVED) {
        throw new BadRequestException('Phiếu đặt hàng này đã được xác nhận nhập kho.');
      }

      if (po.status === PurchaseOrderStatus.CANCELLED) {
        throw new BadRequestException('Phiếu đặt hàng đã bị hủy.');
      }

      for (const itemDto of dto.items) {
        const poItem = po.items.find((i) => i.id === itemDto.poItemId);
        if (!poItem) {
          throw new BadRequestException(`Chi tiết đơn hàng ID '${itemDto.poItemId}' không thuộc PO này.`);
        }

        const receivedQty = Number(itemDto.receivedQuantity);
        poItem.receivedQuantity = receivedQty;
        await queryRunner.manager.save(PurchaseOrderItem, poItem);

        if (receivedQty > 0) {
          const batchCode = itemDto.batchCode || `${po.poCode}-LOT-${Date.now()}`;
          const batch = queryRunner.manager.create(StockBatch, {
            batchCode,
            branchId: po.branchId,
            ingredientId: poItem.ingredientId,
            variantId: poItem.variantId,
            initialQuantity: receivedQty,
            quantity: receivedQty,
            manufactureDate: itemDto.manufactureDate ? new Date(itemDto.manufactureDate) : undefined,
            expiryDate: new Date(itemDto.expiryDate),
            supplier: po.supplierName || undefined,
            status: BatchStatus.ACTIVE,
          });

          const savedBatch = await queryRunner.manager.save(StockBatch, batch);

          // Update stock table
          if (poItem.ingredientId) {
            let stock = await queryRunner.manager.findOne(BranchIngredientStock, {
              where: { branchId: po.branchId, ingredientId: poItem.ingredientId },
            });
            if (!stock) {
              stock = queryRunner.manager.create(BranchIngredientStock, {
                branchId: po.branchId,
                ingredientId: poItem.ingredientId,
                quantity: receivedQty,
                minStockLevel: 0,
              });
            } else {
              stock.quantity = Number(stock.quantity) + receivedQty;
            }
            await queryRunner.manager.save(BranchIngredientStock, stock);
          }

          if (poItem.variantId) {
            let stock = await queryRunner.manager.findOne(BranchVariantStock, {
              where: { branchId: po.branchId, variantId: poItem.variantId },
            });
            if (!stock) {
              stock = queryRunner.manager.create(BranchVariantStock, {
                branchId: po.branchId,
                variantId: poItem.variantId,
                quantity: Math.round(receivedQty),
                minQuantity: 0,
              });
            } else {
              stock.quantity = Math.round(Number(stock.quantity) + receivedQty);
            }
            await queryRunner.manager.save(BranchVariantStock, stock);
          }

          // Log InventoryTransaction (IMPORT)
          const tx = queryRunner.manager.create(InventoryTransaction, {
            branchId: po.branchId,
            transactionType: InventoryTransactionType.IMPORT,
            ingredientId: poItem.ingredientId,
            variantId: poItem.variantId,
            batchId: savedBatch.id,
            quantityChange: receivedQty,
            reason: `Scan nhập kho từ PO ${po.poCode}`,
            referenceId: po.poCode,
            performedById: user?.id,
          });
          await queryRunner.manager.save(InventoryTransaction, tx);
        }
      }

      po.status = PurchaseOrderStatus.RECEIVED;
      await queryRunner.manager.save(PurchaseOrder, po);

      await queryRunner.commitTransaction();

      return {
        message: `Xác nhận nhập kho thành công cho đơn hàng ${po.poCode}`,
        poId: po.id,
        poCode: po.poCode,
        status: po.status,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
