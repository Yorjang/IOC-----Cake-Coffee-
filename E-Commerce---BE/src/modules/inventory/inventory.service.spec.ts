import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

import { InventoryService } from './inventory.service';
import { BranchVariantStock } from './branch-variant-stock.entity';
import { Ingredient } from './entities/ingredient.entity';
import { BranchIngredientStock } from './entities/branch-ingredient-stock.entity';
import { VariantIngredient } from './entities/variant-ingredient.entity';
import { StockBatch, BatchStatus } from './entities/stock-batch.entity';
import { InventoryTransaction, InventoryTransactionType } from './entities/inventory-transaction.entity';
import { PurchaseOrder, PurchaseOrderStatus } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { UserRole } from '../users/user.entity';

describe('InventoryService', () => {
  let service: InventoryService;

  let variantStockRepo: jest.Mocked<Repository<BranchVariantStock>>;
  let ingredientRepo: jest.Mocked<Repository<Ingredient>>;
  let branchIngredientStockRepo: jest.Mocked<Repository<BranchIngredientStock>>;
  let variantIngredientRepo: jest.Mocked<Repository<VariantIngredient>>;
  let stockBatchRepo: jest.Mocked<Repository<StockBatch>>;
  let transactionRepo: jest.Mocked<Repository<InventoryTransaction>>;
  let poRepo: jest.Mocked<Repository<PurchaseOrder>>;
  let poItemRepo: jest.Mocked<Repository<PurchaseOrderItem>>;
  let dataSource: jest.Mocked<DataSource>;

  const mockQueryRunner: any = {
    connect: (jest.fn() as any).mockResolvedValue(undefined),
    startTransaction: (jest.fn() as any).mockResolvedValue(undefined),
    commitTransaction: (jest.fn() as any).mockResolvedValue(undefined),
    rollbackTransaction: (jest.fn() as any).mockResolvedValue(undefined),
    release: (jest.fn() as any).mockResolvedValue(undefined),
    manager: {
      create: jest.fn((entityClass: any, dto: any) => ({ id: 'mock-gen-id', ...(dto || {}) })),
      save: jest.fn((entityClassOrObj: any, obj?: any) => Promise.resolve(obj || entityClassOrObj)),
      findOne: jest.fn() as any,
    },
  };

  beforeEach(async () => {
    const createMockRepo = () => ({
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto: any) => ({ id: 'mock-id', ...(dto || {}) })),
      save: jest.fn((dto: any) => Promise.resolve({ id: 'mock-id', ...(dto || {}) })),
      delete: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: getRepositoryToken(BranchVariantStock), useValue: createMockRepo() },
        { provide: getRepositoryToken(Ingredient), useValue: createMockRepo() },
        { provide: getRepositoryToken(BranchIngredientStock), useValue: createMockRepo() },
        { provide: getRepositoryToken(VariantIngredient), useValue: createMockRepo() },
        { provide: getRepositoryToken(StockBatch), useValue: createMockRepo() },
        { provide: getRepositoryToken(InventoryTransaction), useValue: createMockRepo() },
        { provide: getRepositoryToken(PurchaseOrder), useValue: createMockRepo() },
        { provide: getRepositoryToken(PurchaseOrderItem), useValue: createMockRepo() },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
          },
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    variantStockRepo = module.get(getRepositoryToken(BranchVariantStock));
    ingredientRepo = module.get(getRepositoryToken(Ingredient));
    branchIngredientStockRepo = module.get(getRepositoryToken(BranchIngredientStock));
    variantIngredientRepo = module.get(getRepositoryToken(VariantIngredient));
    stockBatchRepo = module.get(getRepositoryToken(StockBatch));
    transactionRepo = module.get(getRepositoryToken(InventoryTransaction));
    poRepo = module.get(getRepositoryToken(PurchaseOrder));
    poItemRepo = module.get(getRepositoryToken(PurchaseOrderItem));
    dataSource = module.get(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('SP2-10: Master Data Ingredient Management', () => {
    it('should create an ingredient successfully', async () => {
      ingredientRepo.findOne.mockResolvedValue(null);
      const dto = { name: 'Fresh Milk', code: 'ING-MILK-01', unit: 'Litre', costPerUnit: 30000 };
      
      const result = await service.createIngredient(dto);

      expect(ingredientRepo.findOne).toHaveBeenCalledWith({ where: { code: 'ING-MILK-01' } });
      expect(ingredientRepo.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Fresh Milk' }));
      expect(result).toHaveProperty('id');
    });

    it('should throw BadRequestException if ingredient code already exists', async () => {
      ingredientRepo.findOne.mockResolvedValue({ id: 'existing-id', code: 'ING-MILK-01' } as Ingredient);
      const dto = { name: 'Fresh Milk', code: 'ING-MILK-01', unit: 'Litre' };

      await expect(service.createIngredient(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('Purchase Orders & Inbound Barcode Scan Workflow', () => {
    const mockBranchId = 'branch-uuid-hn1';
    const mockPo = {
      id: 'po-uuid-01',
      poCode: 'PO-HN01-20260722',
      branchId: mockBranchId,
      supplierId: 'supp-uuid-01',
      supplierName: 'Vinamilk Enterprise',
      status: PurchaseOrderStatus.PENDING,
      expectedDelivery: new Date('2026-07-25'),
      createdAt: new Date(),
      items: [
        {
          id: 'po-item-uuid-01',
          ingredientId: 'ing-uuid-milk',
          orderedQuantity: 50,
          receivedQuantity: 0,
          unitPrice: 32000,
          ingredient: { name: 'Fresh Milk 1L', unit: 'Box' },
        },
      ],
    } as any;

    it('should create a Purchase Order', async () => {
      poRepo.findOne.mockResolvedValue(null);

      const dto = {
        poCode: 'PO-HN01-20260722',
        branchId: mockBranchId,
        supplierName: 'Vinamilk Enterprise',
        items: [
          { ingredientId: 'ing-uuid-milk', orderedQuantity: 50, unitPrice: 32000 },
        ],
      };

      const result = await service.createPurchaseOrder(dto, 'user-manager-id');
      expect(poRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should scan barcode PO successfully for valid Store Manager', async () => {
      poRepo.findOne.mockResolvedValue(mockPo);

      const storeManager = {
        id: 'user-manager-id',
        role: UserRole.STORE_MANAGER,
        branchId: mockBranchId,
      };

      const res = await service.scanInboundBarcode('PO-HN01-20260722', storeManager);

      expect(res.status).toBe('success');
      expect(res.data.po_code).toBe('PO-HN01-20260722');
      expect(res.data.items).toHaveLength(1);
    });

    it('should reject scan if Store Manager scans PO for another branch', async () => {
      poRepo.findOne.mockResolvedValue(mockPo);

      const anotherBranchManager = {
        id: 'user-manager-2',
        role: UserRole.STORE_MANAGER,
        branchId: 'other-branch-uuid',
      };

      await expect(
        service.scanInboundBarcode('PO-HN01-20260722', anotherBranchManager),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject scan if PO is already RECEIVED', async () => {
      poRepo.findOne.mockResolvedValue({
        ...mockPo,
        status: PurchaseOrderStatus.RECEIVED,
      });

      const storeManager = {
        id: 'user-manager-id',
        role: UserRole.STORE_MANAGER,
        branchId: mockBranchId,
      };

      await expect(
        service.scanInboundBarcode('PO-HN01-20260722', storeManager),
      ).rejects.toThrow(BadRequestException);
    });

    it('should confirm inbound stock atomically with transaction, stock update & FEFO batching', async () => {
      mockQueryRunner.manager.findOne.mockImplementation((entity, opts) => {
        if (entity === PurchaseOrder) return Promise.resolve(mockPo);
        if (entity === BranchIngredientStock) return Promise.resolve(null);
        return Promise.resolve(null);
      });

      const confirmDto = {
        poId: 'po-uuid-01',
        items: [
          {
            poItemId: 'po-item-uuid-01',
            receivedQuantity: 50,
            expiryDate: '2026-08-30T00:00:00Z',
            batchCode: 'LOT-MILK-20260722',
          },
        ],
      };

      const storeManager = {
        id: 'user-manager-id',
        role: UserRole.STORE_MANAGER,
        branchId: mockBranchId,
      };

      const res = await service.confirmInbound(confirmDto, storeManager);

      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(res.status).toBe(PurchaseOrderStatus.RECEIVED);
    });

    it('should rollback transaction if error occurs during confirmInbound', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue(mockPo);
      mockQueryRunner.manager.save.mockRejectedValueOnce(new Error('DB Error'));

      const confirmDto = {
        poId: 'po-uuid-01',
        items: [
          {
            poItemId: 'po-item-uuid-01',
            receivedQuantity: 50,
            expiryDate: '2026-08-30T00:00:00Z',
          },
        ],
      };

      await expect(service.confirmInbound(confirmDto, null)).rejects.toThrow();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('SP2-15 & SP2-16 Alerts', () => {
    it('should calculate low stock alerts correctly', async () => {
      branchIngredientStockRepo.find.mockResolvedValue([
        {
          id: 'stock-1',
          branchId: 'b1',
          ingredientId: 'ing1',
          quantity: 2,
          minStockLevel: 10,
          ingredient: { name: 'Sugar', code: 'SUGAR', unit: 'kg' },
        } as any,
      ]);

      variantStockRepo.find.mockResolvedValue([]);

      const result = await service.getLowStockAlerts({ branchId: 'b1' });

      expect(result.totalAlerts).toBe(1);
      expect(result.lowStockIngredients[0].shortfall).toBe(8);
    });
  });
});
