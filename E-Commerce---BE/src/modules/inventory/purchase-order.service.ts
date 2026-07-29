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
export class PurchaseOrderService {
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
