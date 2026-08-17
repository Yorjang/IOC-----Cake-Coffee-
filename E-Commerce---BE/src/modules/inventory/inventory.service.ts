import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThanOrEqual, Between, Like } from 'typeorm';
import { Branch } from '../branches/branch.entity';
import { ProductVariant, VariantStatus } from '../products/product-variant.entity';
import { BranchVariantStock } from './branch-variant-stock.entity';
import { Ingredient } from './entities/ingredient.entity';
import { BranchIngredientStock } from './entities/branch-ingredient-stock.entity';
import { VariantIngredient } from './entities/variant-ingredient.entity';
import { StockBatch, BatchStatus } from './entities/stock-batch.entity';
import { InventoryTransaction, InventoryTransactionType } from './entities/inventory-transaction.entity';
import { PurchaseOrder, PurchaseOrderStatus } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { PurchaseRequest, PurchaseRequestStatus } from './entities/purchase-request.entity';
import { PurchaseRequestItem } from './entities/purchase-request-item.entity';
import { InventoryAdjustmentRequest, AdjustmentRequestStatus } from './entities/inventory-adjustment-request.entity';
import { UserRole } from '../users/user.entity';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { CreateIngredientDto, UpdateIngredientDto } from './dto/create-ingredient.dto';
import { CreateBranchIngredientStockDto, UpdateBranchIngredientStockDto } from './dto/branch-ingredient-stock.dto';
import { CreateVariantIngredientDto, BulkSetVariantIngredientsDto } from './dto/variant-ingredient.dto';
import { CreateStockBatchDto, UpdateStockBatchDto } from './dto/stock-batch.dto';
import { CreateInventoryTransactionDto } from './dto/create-inventory-transaction.dto';
import { CreatePurchaseOrderDto, QueryPurchaseOrderDto } from './dto/create-purchase-order.dto';
import { CreatePurchaseRequestDto, QueryPurchaseRequestDto } from './dto/create-purchase-request.dto';
import { CancelReasonDto } from './dto/cancel-dto';
import { ConfirmInboundDto } from './dto/confirm-inbound.dto';
import { QueryAdjustmentDto } from './dto/query-adjustment.dto';
import {
  QueryVariantStockDto,
  QueryIngredientStockDto,
  QueryStockBatchDto,
  QueryInventoryTransactionDto,
  QueryExpiryWarningDto,
  QueryLowStockDto,
} from './dto/query-inventory.dto';

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
    @InjectRepository(PurchaseRequest)
    private readonly prRepo: Repository<PurchaseRequest>,
    @InjectRepository(PurchaseRequestItem)
    private readonly prItemRepo: Repository<PurchaseRequestItem>,
    @InjectRepository(InventoryAdjustmentRequest)
    private readonly adjustmentRepo: Repository<InventoryAdjustmentRequest>,
    private readonly dataSource: DataSource,
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // SP2-09: Tồn kho variant theo chi nhánh
  // ───────────────────────────────────────────────────────────────────────────
  async findVariantStocks(query: QueryVariantStockDto) {
    const branchRepo = this.dataSource.getRepository(Branch);
    const variantRepo = this.dataSource.getRepository(ProductVariant);

    // 1. Get target branches
    let targetBranches = [];
    if (query.branchId) {
      const b = await branchRepo.findOne({ where: { id: query.branchId } });
      if (b) targetBranches = [b];
    } else {
      targetBranches = await branchRepo.find();
    }

    // 2. Get active variants (and their products to check branchId)
    const variants = await variantRepo.find({
      relations: { product: true },
      where: { status: VariantStatus.ACTIVE },
    });

    // 3. Get existing stock combinations
    const existingStocks = await this.variantStockRepo.find({
      select: { branchId: true, variantId: true },
    });
    const existingKeys = new Set(existingStocks.map(s => `${s.branchId}_${s.variantId}`));

    const newStocksToCreate = [];
    for (const branch of targetBranches) {
      for (const variant of variants) {
        // A variant is allowed if product has no branch (null) or matches the branchId
        const isAllowed = !variant.product?.branchId || variant.product.branchId === branch.id;
        if (!isAllowed) continue;

        const key = `${branch.id}_${variant.id}`;
        if (!existingKeys.has(key)) {
          existingKeys.add(key);
          newStocksToCreate.push(
            this.variantStockRepo.create({
              branchId: branch.id,
              variantId: variant.id,
              quantity: 0,
              minQuantity: 0,
              reservedQuantity: 0,
            })
          );
        }
      }
    }

    if (newStocksToCreate.length > 0) {
      try {
        await this.variantStockRepo.save(newStocksToCreate);
      } catch (err) {
        // Ignore duplicate key race condition from concurrent requests
      }
    }

    const where: any = {};
    if (query.branchId) where.branchId = query.branchId;
    if (query.variantId) where.variantId = query.variantId;

    const stocks = await this.variantStockRepo.find({
      where,
      relations: { branch: true, variant: { product: { category: true }, variantIngredients: { ingredient: true } } },
      order: { updatedAt: 'DESC' },
    });

    const pendingRequests = await this.adjustmentRepo.find({
      where: { status: AdjustmentRequestStatus.PENDING },
    });

    const ingStocks = await this.branchIngredientStockRepo.find();
    const ingStockMap = new Map(ingStocks.map(s => [`${s.branchId}_${s.ingredientId}`, s.quantity]));

    return stocks.map((stock) => {
      const pending = pendingRequests.find(
        (r) => r.branchId === stock.branchId && r.variantId === stock.variantId,
      );

      const recipe = stock.variant?.variantIngredients || [];
      let maxSellableQuantity = null;
      if (recipe.length > 0) {
        let maxSellable = Infinity;
        for (const ri of recipe) {
          const key = `${stock.branchId}_${ri.ingredientId}`;
          const availableIngQty = Number(ingStockMap.get(key) || 0);
          const reqQty = Number(ri.quantityRequired || 0);
          if (reqQty > 0) {
            const possible = Math.floor(availableIngQty / reqQty);
            if (possible < maxSellable) {
              maxSellable = possible;
            }
          }
        }
        maxSellableQuantity = maxSellable === Infinity ? 0 : maxSellable;
      }

      return {
        ...stock,
        availableQuantity: stock.quantity - stock.reservedQuantity,
        maxSellableQuantity,
        pendingAdjustment: pending
          ? {
              id: pending.id,
              requestedQuantity: pending.requestedQuantity,
              requestedMinQuantity: pending.requestedMinQuantity,
              createdAt: pending.createdAt,
            }
          : null,
      };
    });
  }

  async findVariantStockById(id: string) {
    const stock = await this.variantStockRepo.findOne({
      where: { id },
      relations: { branch: true, variant: { product: true } },
    });
    if (!stock) {
      throw new NotFoundException('Mặt hàng tồn kho không tồn tại.');
    }
    const pending = await this.adjustmentRepo.findOne({
      where: {
        branchId: stock.branchId,
        variantId: stock.variantId,
        status: AdjustmentRequestStatus.PENDING,
      },
    });
    return {
      ...stock,
      availableQuantity: stock.quantity - stock.reservedQuantity,
      pendingAdjustment: pending
        ? {
            id: pending.id,
            requestedQuantity: pending.requestedQuantity,
            requestedMinQuantity: pending.requestedMinQuantity,
            createdAt: pending.createdAt,
          }
        : null,
    };
  }

  async updateVariantStock(id: string, dto: UpdateInventoryDto, user?: any) {
    const stock = await this.variantStockRepo.findOne({
      where: { id },
      relations: { branch: true, variant: { product: true } },
    });
    if (!stock) {
      throw new NotFoundException('Mặt hàng tồn kho không tồn tại.');
    }

    if (user?.role === UserRole.STORE_MANAGER) {
      if (user.branchId && stock.branchId !== user.branchId) {
        throw new ForbiddenException(
          'Store Manager chỉ có quyền yêu cầu điều chỉnh tồn kho tại chi nhánh mình quản lý.',
        );
      }

      if (!dto.reason || !dto.imageUrl) {
        throw new BadRequestException(
          'Khi quản lý yêu cầu điều chỉnh tồn kho, bắt buộc phải cung cấp lý do và ảnh minh họa.',
        );
      }

      let request = await this.adjustmentRepo.findOne({
        where: {
          branchId: stock.branchId,
          variantId: stock.variantId,
          status: AdjustmentRequestStatus.PENDING,
        },
      });

      if (request) {
        if (dto.quantity !== undefined) request.requestedQuantity = Number(dto.quantity);
        if (dto.minQuantity !== undefined) request.requestedMinQuantity = Number(dto.minQuantity);
        request.reason = dto.reason;
        request.imageUrl = dto.imageUrl;
        request.requestedById = user.id;
      } else {
        request = this.adjustmentRepo.create({
          branchId: stock.branchId,
          variantId: stock.variantId,
          currentQuantity: stock.quantity,
          requestedQuantity: dto.quantity !== undefined ? Number(dto.quantity) : stock.quantity,
          currentMinQuantity: stock.minQuantity,
          requestedMinQuantity: dto.minQuantity !== undefined ? Number(dto.minQuantity) : stock.minQuantity,
          status: AdjustmentRequestStatus.PENDING,
          reason: dto.reason,
          imageUrl: dto.imageUrl,
          requestedById: user.id,
        });
      }

      const savedRequest = await this.adjustmentRepo.save(request);
      return {
        message: 'Đã gửi yêu cầu điều chỉnh tồn kho, chờ Admin xác nhận.',
        pending: true,
        request: savedRequest,
      };
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
      pending: false,
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

    const stocks = await this.branchIngredientStockRepo.find({
      where,
      relations: { branch: true, ingredient: true },
      order: { updatedAt: 'DESC' },
    });

    const pendingRequests = await this.adjustmentRepo.find({
      where: { status: AdjustmentRequestStatus.PENDING },
    });

    return stocks.map((stock) => {
      const pending = pendingRequests.find(
        (r) => r.branchId === stock.branchId && r.ingredientId === stock.ingredientId,
      );
      return {
        ...stock,
        pendingAdjustment: pending
          ? {
              id: pending.id,
              requestedQuantity: pending.requestedQuantity,
              requestedMinQuantity: pending.requestedMinQuantity,
              createdAt: pending.createdAt,
            }
          : null,
      };
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

  async updateBranchIngredientStock(id: string, dto: UpdateBranchIngredientStockDto, user?: any) {
    const stock = await this.branchIngredientStockRepo.findOne({
      where: { id },
      relations: { branch: true, ingredient: true },
    });
    if (!stock) {
      throw new NotFoundException('Bản ghi tồn kho nguyên liệu chi nhánh không tồn tại.');
    }

    if (user?.role === UserRole.STORE_MANAGER) {
      if (user.branchId && stock.branchId !== user.branchId) {
        throw new ForbiddenException(
          'Store Manager chỉ có quyền yêu cầu điều chỉnh tồn kho tại chi nhánh mình quản lý.',
        );
      }

      if (!dto.reason || !dto.imageUrl) {
        throw new BadRequestException(
          'Khi quản lý yêu cầu điều chỉnh tồn kho, bắt buộc phải cung cấp lý do và ảnh minh họa.',
        );
      }

      let request = await this.adjustmentRepo.findOne({
        where: {
          branchId: stock.branchId,
          ingredientId: stock.ingredientId,
          status: AdjustmentRequestStatus.PENDING,
        },
      });

      if (request) {
        if (dto.quantity !== undefined) request.requestedQuantity = Number(dto.quantity);
        if (dto.minStockLevel !== undefined) request.requestedMinQuantity = Number(dto.minStockLevel);
        request.reason = dto.reason;
        request.imageUrl = dto.imageUrl;
        request.requestedById = user.id;
      } else {
        request = this.adjustmentRepo.create({
          branchId: stock.branchId,
          ingredientId: stock.ingredientId,
          currentQuantity: Math.round(Number(stock.quantity)),
          requestedQuantity: dto.quantity !== undefined ? Number(dto.quantity) : Math.round(Number(stock.quantity)),
          currentMinQuantity: Math.round(Number(stock.minStockLevel || 0)),
          requestedMinQuantity: dto.minStockLevel !== undefined ? Number(dto.minStockLevel) : Math.round(Number(stock.minStockLevel || 0)),
          status: AdjustmentRequestStatus.PENDING,
          reason: dto.reason,
          imageUrl: dto.imageUrl,
          requestedById: user.id,
        });
      }

      const savedRequest = await this.adjustmentRepo.save(request);
      return {
        message: 'Đã gửi yêu cầu điều chỉnh tồn kho, chờ Admin xác nhận.',
        pending: true,
        request: savedRequest,
      };
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
      .filter((item) => Number(item.quantity) <= Number(item.minStockLevel || 0) * 1.1)
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
      .filter((item) => Number(item.quantity) <= Number(item.minQuantity || 0) * 1.1)
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
  // Purchase Request (PR) Workflow
  // ───────────────────────────────────────────────────────────────────────────
  async createPurchaseRequest(dto: CreatePurchaseRequestDto, userId: string) {
    const branchRepo = this.dataSource.getRepository(Branch);
    const branch = await branchRepo.findOne({ where: { id: dto.branchId } });
    if (!branch) {
      throw new NotFoundException('Chi nhánh không tồn tại.');
    }

    const branchPrefix = branch.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'CH';
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    const prCode = `PR-${branchPrefix}-${dateStr}-${rand}`;

    // Xác định trạng thái PR: Chỉ cần admin duyệt khi đặt sản phẩm/nguyên liệu vượt quá 200% (2 lần) lượng tối thiểu (min stock)
    let status = PurchaseRequestStatus.APPROVED;
    const branchIngStockRepo = this.dataSource.getRepository(BranchIngredientStock);
    const branchVarStockRepo = this.dataSource.getRepository(BranchVariantStock);

    for (const item of dto.items) {
      let minStock = 0;
      if (item.ingredientId) {
        const stock = await branchIngStockRepo.findOne({
          where: { branchId: dto.branchId, ingredientId: item.ingredientId }
        });
        minStock = stock ? Number(stock.minStockLevel || 0) : 0;
      } else if (item.variantId) {
        const stock = await branchVarStockRepo.findOne({
          where: { branchId: dto.branchId, variantId: item.variantId }
        });
        minStock = stock ? Number(stock.minQuantity || 0) : 0;
      }

      // Chỉ bắt duyệt khi lượng tối thiểu > 0 và lượng đặt > lượng tối thiểu * 2 (tức là quá 200%)
      if (minStock > 0 && Number(item.requestedQuantity) > minStock * 2) {
        status = PurchaseRequestStatus.PENDING_APPROVAL;
        break;
      }
    }

    const items = dto.items.map((item) =>
      this.prItemRepo.create({
        ingredientId: item.ingredientId,
        variantId: item.variantId,
        requestedQuantity: Number(item.requestedQuantity),
        note: item.note,
      }),
    );

    const pr = this.prRepo.create({
      prCode,
      branchId: dto.branchId,
      requestedById: userId,
      status,
      note: dto.note,
      deliveryTimeframe: dto.deliveryTimeframe,
      preferredDeliveryDate: dto.preferredDeliveryDate ? new Date(dto.preferredDeliveryDate) : null,
      items,
    });

    const savedPr = await this.prRepo.save(pr);

    // Tự động duyệt và sinh PO nếu status là APPROVED
    if (status === PurchaseRequestStatus.APPROVED) {
      const poCode = `PO-${branchPrefix}-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;
      const defaultExpiredAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const poItems = [];
      const ingRepo = this.dataSource.getRepository(Ingredient);
      const varRepo = this.dataSource.getRepository(ProductVariant);

      for (const item of savedPr.items) {
        let barcode = '';
        if (item.ingredientId) {
          const ing = await ingRepo.findOne({ where: { id: item.ingredientId } });
          barcode = ing ? ing.code : '';
        } else if (item.variantId) {
          const v = await varRepo.findOne({ where: { id: item.variantId } });
          barcode = v ? v.sku : '';
        }

        poItems.push(
          this.poItemRepo.create({
            ingredientId: item.ingredientId,
            variantId: item.variantId,
            barcode,
            orderedQuantity: Number(item.requestedQuantity),
            receivedQuantity: 0,
            rejectedQuantity: 0,
            unitPrice: 0,
          })
        );
      }

      const expectedDelivery = pr.preferredDeliveryDate
        ? new Date(pr.preferredDeliveryDate)
        : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      if (pr.deliveryTimeframe === '18PM') {
        expectedDelivery.setHours(18, 0, 0, 0);
      } else {
        expectedDelivery.setHours(2, 0, 0, 0);
      }

      const po = this.poRepo.create({
        poCode,
        prId: savedPr.id,
        branchId: savedPr.branchId,
        supplierName: 'Nhà cung cấp Sweet Bean Central',
        createdById: userId,
        status: PurchaseOrderStatus.SHIPPED,
        expectedDelivery,
        deliveryTimeframe: pr.deliveryTimeframe,
        expiredAt: defaultExpiredAt,
        notes: `Đơn hàng tự động duyệt và sinh từ PR ${savedPr.prCode}`,
        items: poItems,
      });

      await this.poRepo.save(po);
    }

    return savedPr;
  }

  async findPurchaseRequests(query: QueryPurchaseRequestDto, user?: any) {
    const where: any = {};
    if (user?.role === UserRole.STORE_MANAGER && user?.branchId) {
      where.branchId = user.branchId;
    } else if (query.branchId) {
      where.branchId = query.branchId;
    }

    if (query.status) {
      where.status = query.status;
    }

    return this.prRepo.find({
      where,
      relations: {
        branch: true,
        requestedBy: true,
        approvedBy: true,
        cancelledBy: true,
        purchaseOrders: true,
        items: { ingredient: true, variant: { product: true } },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async approvePrToPos(prId: string, adminId: string) {
    const pr = await this.prRepo.findOne({
      where: { id: prId },
      relations: { branch: true, items: { ingredient: true, variant: { product: true } } },
    });

    if (!pr) {
      throw new NotFoundException('Phiếu yêu cầu đặt hàng (PR) không tồn tại.');
    }

    if (pr.status !== PurchaseRequestStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Phiếu PR này không ở trạng thái chờ duyệt.');
    }

    const createdPOs: PurchaseOrder[] = [];
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const branchPrefix = pr.branch?.name?.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'CH';

    const poCode = `PO-${branchPrefix}-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;
    const defaultExpiredAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const poItems = pr.items.map((item) =>
      this.poItemRepo.create({
        ingredientId: item.ingredientId,
        variantId: item.variantId,
        barcode: item.ingredient ? item.ingredient.code : item.variant?.sku,
        orderedQuantity: Number(item.requestedQuantity),
        receivedQuantity: 0,
        rejectedQuantity: 0,
        unitPrice: 0,
      }),
    );

    const expectedDelivery = pr.preferredDeliveryDate
      ? new Date(pr.preferredDeliveryDate)
      : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    if (pr.deliveryTimeframe === '18PM') {
      expectedDelivery.setHours(18, 0, 0, 0);
    } else {
      expectedDelivery.setHours(2, 0, 0, 0);
    }

    const po = this.poRepo.create({
      poCode,
      prId: pr.id,
      branchId: pr.branchId,
      supplierName: 'Nhà cung cấp Sweet Bean Central',
      createdById: adminId,
      status: PurchaseOrderStatus.SHIPPED,
      expectedDelivery,
      deliveryTimeframe: pr.deliveryTimeframe,
      expiredAt: defaultExpiredAt,
      notes: `Đơn hàng tự động sinh từ PR ${pr.prCode}`,
      items: poItems,
    });

    const savedPo = await this.poRepo.save(po);
    createdPOs.push(savedPo);

    pr.status = PurchaseRequestStatus.APPROVED;
    pr.approvedById = adminId;
    await this.prRepo.save(pr);

    return {
      message: `Đã duyệt PR thành công và tự động sinh đơn đặt hàng PO: ${poCode}`,
      pr,
      purchaseOrders: createdPOs,
    };
  }

  async cancelPurchaseRequest(prId: string, dto: CancelReasonDto, user: any) {
    const pr = await this.prRepo.findOne({ where: { id: prId } });
    if (!pr) {
      throw new NotFoundException('Phiếu Yêu cầu PR không tồn tại.');
    }

    if (pr.status === PurchaseRequestStatus.CANCELLED) {
      throw new BadRequestException('Phiếu PR đã ở trạng thái bị hủy trước đó.');
    }

    pr.status = PurchaseRequestStatus.CANCELLED;
    pr.cancelledById = user?.id;
    pr.cancelledAt = new Date();
    pr.cancelReason = dto.cancelReason;

    await this.prRepo.save(pr);
    return { message: 'Đã hủy phiếu yêu cầu đặt hàng (PR) thành công.', pr };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Purchase Order & Inbound Barcode Scan Workflow (With SLA Expiration)
  // ───────────────────────────────────────────────────────────────────────────
  async checkExpiredPurchaseOrders() {
    const now = new Date();
    const expiredPOs = await this.poRepo.find({
      where: {
        status: PurchaseOrderStatus.SHIPPED,
        expiredAt: LessThanOrEqual(now),
      },
    });

    for (const po of expiredPOs) {
      po.status = PurchaseOrderStatus.EXPIRED;
      await this.poRepo.save(po);
    }
  }

  async createPurchaseOrder(dto: CreatePurchaseOrderDto, userId?: string) {
    const existing = await this.poRepo.findOne({ where: { poCode: dto.poCode } });
    if (existing) {
      throw new BadRequestException(`Mã đơn hàng '${dto.poCode}' đã tồn tại.`);
    }

    const items = dto.items.map((item) =>
      this.poItemRepo.create({
        ingredientId: item.ingredientId,
        variantId: item.variantId,
        barcode: item.barcode,
        orderedQuantity: Number(item.orderedQuantity),
        receivedQuantity: 0,
        rejectedQuantity: 0,
        unitPrice: Number(item.unitPrice ?? 0),
      }),
    );

    const defaultExpiredAt = dto.expiredAt
      ? new Date(dto.expiredAt)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const po = this.poRepo.create({
      poCode: dto.poCode,
      prId: dto.prId,
      branchId: dto.branchId,
      supplierId: dto.supplierId,
      supplierName: dto.supplierName,
      createdById: userId,
      status: PurchaseOrderStatus.SHIPPED,
      expectedDelivery: dto.expectedDelivery ? new Date(dto.expectedDelivery) : undefined,
      deliveryTimeframe: dto.deliveryTimeframe,
      expiredAt: defaultExpiredAt,
      notes: dto.notes,
      items,
    });

    return this.poRepo.save(po);
  }

  async markPoAsShipped(id: string, user: any) {
    const po = await this.poRepo.findOne({ where: { id } });
    if (!po) {
      throw new NotFoundException('Phiếu PO không tồn tại.');
    }
    po.status = PurchaseOrderStatus.SHIPPED;
    if (!po.expiredAt) {
      po.expiredAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    await this.poRepo.save(po);
    return { message: 'Đã cập nhật trạng thái đơn PO sang SHIPPED (Đang giao hàng).', po };
  }

  async cancelPurchaseOrder(id: string, dto: CancelReasonDto, user: any) {
    const po = await this.poRepo.findOne({ where: { id } });
    if (!po) {
      throw new NotFoundException('Phiếu PO không tồn tại.');
    }

    if (po.status === PurchaseOrderStatus.COMPLETED || po.status === PurchaseOrderStatus.RECEIVED) {
      throw new BadRequestException('Không thể hủy đơn PO đã hoàn thành nhập kho.');
    }

    po.status = PurchaseOrderStatus.CANCELLED;
    po.cancelledById = user?.id;
    po.cancelledAt = new Date();
    po.cancelReason = dto.cancelReason;

    await this.poRepo.save(po);
    return { message: 'Đã hủy đơn đặt hàng PO thành công (Audit logged).', po };
  }

  async findPurchaseOrders(query: QueryPurchaseOrderDto) {
    await this.checkExpiredPurchaseOrders();

    const where: any = {};
    if (query.branchId) where.branchId = query.branchId;
    if (query.status) where.status = query.status;
    if (query.poCode) where.poCode = Like(`%${query.poCode}%`);

    return this.poRepo.find({
      where,
      relations: {
        branch: true,
        createdBy: true,
        cancelledBy: true,
        purchaseRequest: true,
        items: { ingredient: true, variant: { product: true } },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findPurchaseOrderById(id: string) {
    await this.checkExpiredPurchaseOrders();

    const po = await this.poRepo.findOne({
      where: { id },
      relations: {
        branch: true,
        createdBy: true,
        cancelledBy: true,
        purchaseRequest: true,
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

    await this.checkExpiredPurchaseOrders();

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

    if (user?.role === UserRole.STORE_MANAGER && user?.branchId && po.branchId !== user.branchId) {
      throw new ForbiddenException('Store Manager chỉ có quyền kiểm kê/nhập hàng tại chi nhánh mình quản lý.');
    }

    if (po.status === PurchaseOrderStatus.EXPIRED) {
      throw new BadRequestException(`Phiếu PO '${poCode}' đã QUÁ HẠN NHẬP KHO (SLA Expired lúc ${po.expiredAt ? new Date(po.expiredAt).toLocaleString('vi-VN') : 'N/A'}).`);
    }

    if (po.status === PurchaseOrderStatus.COMPLETED || po.status === PurchaseOrderStatus.RECEIVED) {
      throw new BadRequestException(`Phiếu đặt hàng '${poCode}' đã hoàn thành nhập kho trước đó.`);
    }

    if (po.status === PurchaseOrderStatus.CANCELLED) {
      throw new BadRequestException(`Phiếu đặt hàng '${poCode}' đã bị hủy (Lý do: ${po.cancelReason || 'N/A'}).`);
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
        delivery_timeframe: po.deliveryTimeframe,
        expired_at: po.expiredAt,
        created_at: po.createdAt,
        items: po.items.map((item) => ({
          po_item_id: item.id,
          ingredient_id: item.ingredientId,
          variant_id: item.variantId,
          barcode: item.barcode || (item.ingredient ? item.ingredient.code : item.variant?.sku),
          name: item.ingredient ? item.ingredient.name : `${item.variant?.product?.name || ''} - ${item.variant?.variantName || ''}`,
          unit: item.ingredient ? item.ingredient.unit : 'Cái',
          ordered_quantity: Number(item.orderedQuantity),
          received_quantity: Number(item.receivedQuantity),
          rejected_quantity: Number(item.rejectedQuantity || 0),
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

      if (po.status === PurchaseOrderStatus.EXPIRED) {
        throw new BadRequestException('Phiếu PO này đã quá hạn nhập kho.');
      }

      if (po.status === PurchaseOrderStatus.COMPLETED || po.status === PurchaseOrderStatus.RECEIVED) {
        throw new BadRequestException('Phiếu đặt hàng này đã được xác nhận nhập kho.');
      }

      if (po.status === PurchaseOrderStatus.CANCELLED) {
        throw new BadRequestException('Phiếu đặt hàng đã bị hủy.');
      }

      let allItemsFullyHandled = true;

      for (const itemDto of dto.items) {
        const poItem = po.items.find((i) => i.id === itemDto.poItemId);
        if (!poItem) {
          throw new BadRequestException(`Chi tiết đơn hàng ID '${itemDto.poItemId}' không thuộc PO này.`);
        }

        const prevReceived = Number(poItem.receivedQuantity || 0);
        const prevRejected = Number(poItem.rejectedQuantity || 0);
        const currentReceived = Number(itemDto.receivedQuantity || 0);
        const currentRejected = Number(itemDto.rejectedQuantity || 0);

        const totalPlanned = prevReceived + prevRejected + currentReceived + currentRejected;

        if (totalPlanned > Number(poItem.orderedQuantity)) {
          throw new BadRequestException(
            `Tổng số lượng (đã nhận trước đó: ${prevReceived + prevRejected}, lần này nhận: ${currentReceived}, hỏng: ${currentRejected}) là ${totalPlanned}, vượt quá số lượng đặt (${poItem.orderedQuantity}) của mặt hàng '${poItem.ingredient ? poItem.ingredient.name : poItem.variant?.product?.name}'. Vui lòng liên hệ và báo cáo Admin để xử lý.`
          );
        }

        poItem.receivedQuantity = prevReceived + currentReceived;
        poItem.rejectedQuantity = prevRejected + currentRejected;
        if (itemDto.barcode) {
          poItem.barcode = itemDto.barcode;
        }

        await queryRunner.manager.save(PurchaseOrderItem, poItem);

        if (prevReceived + prevRejected + currentReceived + currentRejected < Number(poItem.orderedQuantity)) {
          allItemsFullyHandled = false;
        }

        let isIng = poItem.ingredientId ? true : false;
        if (itemDto.isIngredient !== undefined) {
          isIng = itemDto.isIngredient;
        }

        let unitSelected = itemDto.unit;
        if (!unitSelected) {
          unitSelected = poItem.ingredient ? poItem.ingredient.unit : 'Cái';
        }

        let stockQty = currentReceived;
        if (isIng) {
          const lowerUnit = unitSelected?.toLowerCase();
          if (lowerUnit === 'kg' || lowerUnit === 'l') {
            stockQty = currentReceived * 1000;
          }
        }

        if (stockQty > 0) {
          const batchCode = itemDto.batchCode || `${po.poCode}-LOT-${Date.now()}`;
          const batch = queryRunner.manager.create(StockBatch, {
            batchCode,
            branchId: po.branchId,
            ingredientId: isIng ? poItem.ingredientId : null,
            variantId: !isIng ? poItem.variantId : null,
            initialQuantity: stockQty,
            quantity: stockQty,
            manufactureDate: itemDto.manufactureDate ? new Date(itemDto.manufactureDate) : undefined,
            expiryDate: new Date(itemDto.expiryDate),
            supplier: po.supplierName || undefined,
            status: BatchStatus.ACTIVE,
          });

          const savedBatch = await queryRunner.manager.save(StockBatch, batch);

          // Update stock table
          if (isIng && poItem.ingredientId) {
            let stock = await queryRunner.manager.findOne(BranchIngredientStock, {
              where: { branchId: po.branchId, ingredientId: poItem.ingredientId },
            });
            if (!stock) {
              stock = queryRunner.manager.create(BranchIngredientStock, {
                branchId: po.branchId,
                ingredientId: poItem.ingredientId,
                quantity: stockQty,
                minStockLevel: 0,
              });
            } else {
              stock.quantity = Number(stock.quantity) + stockQty;
            }
            await queryRunner.manager.save(BranchIngredientStock, stock);
          }

          if (!isIng && poItem.variantId) {
            let stock = await queryRunner.manager.findOne(BranchVariantStock, {
              where: { branchId: po.branchId, variantId: poItem.variantId },
            });
            if (!stock) {
              stock = queryRunner.manager.create(BranchVariantStock, {
                branchId: po.branchId,
                variantId: poItem.variantId,
                quantity: Math.round(stockQty),
                minQuantity: 0,
              });
            } else {
              stock.quantity = Math.round(Number(stock.quantity) + stockQty);
            }
            await queryRunner.manager.save(BranchVariantStock, stock);
          }

          // Log InventoryTransaction (IMPORT)
          const tx = queryRunner.manager.create(InventoryTransaction, {
            branchId: po.branchId,
            transactionType: InventoryTransactionType.IMPORT,
            ingredientId: isIng ? poItem.ingredientId : null,
            variantId: !isIng ? poItem.variantId : null,
            batchId: savedBatch.id,
            quantityChange: stockQty,
            reason: `Scan nhập kho từ PO ${po.poCode}${currentRejected > 0 ? ` (Từ chối hỏng: ${currentRejected})` : ''}`,
            referenceId: po.id,
            performedById: user?.id,
          });
          await queryRunner.manager.save(InventoryTransaction, tx);
        }
      }

      po.status = (allItemsFullyHandled || dto.completePo) ? PurchaseOrderStatus.RECEIVED : PurchaseOrderStatus.PARTIALLY_RECEIVED;
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

  // ───────────────────────────────────────────────────────────────────────────
  // Stock Adjustment Requests Approval Workflow
  // ───────────────────────────────────────────────────────────────────────────
  async findAllAdjustments(query: QueryAdjustmentDto, user: any) {
    const where: any = {};

    if (user?.role === UserRole.STORE_MANAGER && user?.branchId) {
      where.branchId = user.branchId;
    } else if (query.branchId) {
      where.branchId = query.branchId;
    }

    if (query.status) {
      where.status = query.status;
    }

    return this.adjustmentRepo.find({
      where,
      relations: {
        branch: true,
        variant: { product: true },
        ingredient: true,
        requestedBy: true,
        approvedBy: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async approveAdjustment(id: string, adminId: string) {
    const request = await this.adjustmentRepo.findOne({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Yêu cầu điều chỉnh không tồn tại.');
    }

    if (request.status !== AdjustmentRequestStatus.PENDING) {
      throw new BadRequestException('Yêu cầu này đã được xử lý.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let qtyDiff = 0;

      if (request.ingredientId) {
        let stock = await queryRunner.manager.findOne(BranchIngredientStock, {
          where: { branchId: request.branchId, ingredientId: request.ingredientId },
        });

        const oldQty = stock ? Number(stock.quantity) : 0;
        qtyDiff = request.requestedQuantity - oldQty;

        if (!stock) {
          stock = queryRunner.manager.create(BranchIngredientStock, {
            branchId: request.branchId,
            ingredientId: request.ingredientId,
            quantity: request.requestedQuantity,
            minStockLevel: request.requestedMinQuantity,
          });
        } else {
          stock.quantity = request.requestedQuantity;
          stock.minStockLevel = request.requestedMinQuantity;
        }

        await queryRunner.manager.save(BranchIngredientStock, stock);
      } else {
        let stock = await queryRunner.manager.findOne(BranchVariantStock, {
          where: { branchId: request.branchId, variantId: request.variantId },
        });

        const oldQty = stock ? Number(stock.quantity) : 0;
        qtyDiff = request.requestedQuantity - oldQty;

        if (!stock) {
          stock = queryRunner.manager.create(BranchVariantStock, {
            branchId: request.branchId,
            variantId: request.variantId,
            quantity: request.requestedQuantity,
            minQuantity: request.requestedMinQuantity,
          });
        } else {
          stock.quantity = request.requestedQuantity;
          stock.minQuantity = request.requestedMinQuantity;
        }

        await queryRunner.manager.save(BranchVariantStock, stock);
      }

      // Log transaction
      const tx = queryRunner.manager.create(InventoryTransaction, {
        branchId: request.branchId,
        transactionType: InventoryTransactionType.ADJUSTMENT,
        variantId: request.variantId || undefined,
        ingredientId: request.ingredientId || undefined,
        quantityChange: qtyDiff,
        reason: `Phê duyệt yêu cầu điều chỉnh từ quản lý.`,
        referenceId: request.id,
        performedById: request.requestedById,
      });
      await queryRunner.manager.save(InventoryTransaction, tx);

      // Update request status
      request.status = AdjustmentRequestStatus.APPROVED;
      request.approvedById = adminId;
      await queryRunner.manager.save(InventoryAdjustmentRequest, request);

      await queryRunner.commitTransaction();

      return {
        message: 'Đã phê duyệt và cập nhật tồn kho thành công.',
        request,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async rejectAdjustment(id: string, adminId: string) {
    const request = await this.adjustmentRepo.findOne({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Yêu cầu điều chỉnh không tồn tại.');
    }

    if (request.status !== AdjustmentRequestStatus.PENDING) {
      throw new BadRequestException('Yêu cầu này đã được xử lý.');
    }

    request.status = AdjustmentRequestStatus.REJECTED;
    request.approvedById = adminId;

    await this.adjustmentRepo.save(request);

    return {
      message: 'Đã từ chối yêu cầu điều chỉnh tồn kho.',
      request,
    };
  }
}
