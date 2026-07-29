import { describe, expect, it, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { DataSource, EntityManager, FindOperator, Repository } from 'typeorm';
import { ProductVariant } from '../products/product-variant.entity';
import { Product, ProductType } from '../products/product.entity';
import { User, UserRole } from '../users/user.entity';
import { CombosService, createComboSku } from './combos.service';
import { UpdateComboDto } from './dto/combo.dto';

describe('createComboSku', () => {
  it.each([
    ['Combo Trà Chiều Thảnh Thơi', 'COMBO-TRA-CHIEU-THANH-THOI'],
    ['Tươi mới mỗi ngày', 'COMBO-TUOI-MOI-MOI-NGAY'],
    ['Combo Tiramisu + Latte', 'COMBO-TIRAMISU-LATTE'],
  ])('should generate SKU from "%s"', (name, expectedSku) => {
    expect(createComboSku(name)).toBe(expectedSku);
  });
});

describe('CombosService.update', () => {
  it('should lock only the combo row before loading variants separately', async () => {
    const combo = {
      id: '6edfe5bc-3edd-473e-ac41-ff4f964c0a6e',
      productType: ProductType.COMBO,
      branchId: 'branch-a',
      variants: [],
    } as Product;
    const productRepository = {
      findOne: jest.fn<Repository<Product>['findOne']>().mockResolvedValue(combo),
    };
    const variantRepository = {
      find: jest.fn<Repository<ProductVariant>['find']>().mockResolvedValue([]),
    };
    const manager = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === Product) return productRepository;
        if (entity === ProductVariant) return variantRepository;
        return {};
      }),
    } as unknown as EntityManager;
    const dataSource = {
      transaction: jest.fn(async (callback: (entityManager: EntityManager) => Promise<void>) => callback(manager)),
    } as unknown as DataSource;
    const service = new CombosService(productRepository as unknown as Repository<Product>, dataSource);
    const user = { role: UserRole.STORE_MANAGER, branchId: 'branch-b' } as User;

    await expect(service.update(combo.id, {} as UpdateComboDto, user)).rejects.toBeInstanceOf(BadRequestException);

    expect(productRepository.findOne).toHaveBeenCalledWith({
      where: { id: combo.id, productType: ProductType.COMBO },
      lock: { mode: 'pessimistic_write' },
    });
    expect(variantRepository.find).toHaveBeenCalledWith({
      where: { productId: combo.id },
      order: { createdAt: 'ASC' },
    });
  });
});

describe('CombosService.findAll', () => {
  it('should return branch-specific and system-wide combos for a selected public branch', async () => {
    const productRepository = {
      find: jest.fn<Repository<Product>['find']>().mockResolvedValue([]),
    };
    const service = new CombosService(
      productRepository as unknown as Repository<Product>,
      {} as DataSource,
    );
    const branchId = 'c1a4e986-8556-47ed-b686-495e13525c5e';

    await service.findAll(undefined, false, branchId);

    const findOptions = productRepository.find.mock.calls[0][0];
    const where = findOptions?.where as Array<{ productType: ProductType; branchId: string | FindOperator<string> }>;
    expect(where).toHaveLength(2);
    expect(where[0]).toEqual({ productType: ProductType.COMBO, branchId });
    expect(where[1].productType).toBe(ProductType.COMBO);
    expect(where[1].branchId).toBeInstanceOf(FindOperator);
  });

  it('should restrict a store manager to their assigned branch', async () => {
    const productRepository = {
      find: jest.fn<Repository<Product>['find']>().mockResolvedValue([]),
    };
    const service = new CombosService(
      productRepository as unknown as Repository<Product>,
      {} as DataSource,
    );
    const manager = {
      role: UserRole.STORE_MANAGER,
      branchId: 'c1a4e986-8556-47ed-b686-495e13525c5e',
    } as User;

    await service.findAll(manager, true);

    expect(productRepository.find.mock.calls[0][0]?.where).toEqual({
      productType: ProductType.COMBO,
      branchId: manager.branchId,
    });
  });
});
