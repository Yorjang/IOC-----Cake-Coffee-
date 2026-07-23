import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import { Category } from '../products/category.entity';
import { ProductVariant, VariantStatus } from '../products/product-variant.entity';
import { Product, ProductType } from '../products/product.entity';
import { ComboItem } from './combo-item.entity';
import { ComboItemDto, CreateComboDto, UpdateComboDto } from './dto/combo.dto';
import { User, UserRole } from '../users/user.entity';

function createSlug(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

@Injectable()
export class CombosService {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(user?: User, isAdminPath?: boolean): Promise<Product[]> {
    const where: any = { productType: ProductType.COMBO };
    if (isAdminPath && user?.role === UserRole.STORE_MANAGER && user.branchId) {
      where.branchId = user.branchId;
    }
    return this.products.find({
      where,
      relations: {
        category: true,
        variants: true,
        items: { childProduct: true, childVariant: true },
        branch: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findAvailableProducts(): Promise<Product[]> {
    return this.products.find({
      where: { productType: Not(ProductType.COMBO), isActive: true },
      relations: { category: true, variants: true },
      order: { name: 'ASC' },
    });
  }

  async create(dto: CreateComboDto, user: User): Promise<Product> {
    const branchId = user.role === UserRole.STORE_MANAGER ? user.branchId : dto.branchId;
    const comboId = await this.dataSource.transaction(async (manager) => {
      let categoryId = dto.categoryId;
      if (!categoryId) {
        let category = await manager.getRepository(Category).findOne({
          where: [
            { slug: 'combo' },
            { name: 'Combo' }
          ]
        });
        if (!category) {
          category = await manager.getRepository(Category).save({
            name: 'Combo',
            slug: 'combo',
          });
        }
        categoryId = category.id;
      }

      await this.validateReferences(
        manager.getRepository(Category),
        manager.getRepository(Product),
        manager.getRepository(ProductVariant),
        dto.items,
        undefined,
        categoryId,
      );
      const slug = createSlug(dto.name);
      await this.assertUnique(manager.getRepository(Product), manager.getRepository(ProductVariant), slug, dto.sku);

      const product = await manager.getRepository(Product).save({
        categoryId,
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() || null,
        imageUrl: dto.imageUrl?.trim() || null,
        productType: ProductType.COMBO,
        requiresNote: false,
        isActive: dto.isActive ?? true,
        branchId,
      });
      await manager.getRepository(ProductVariant).save({
        productId: product.id,
        sku: dto.sku.trim(),
        variantName: `${dto.name.trim()} - Combo`,
        size: 'Combo',
        price: dto.price,
        status: VariantStatus.ACTIVE,
        imageUrl: dto.imageUrl?.trim() || null,
      });
      await manager.getRepository(ComboItem).save(this.toComboItems(product.id, dto.items));
      return product.id;
    });
    return this.findOne(comboId);
  }

  async update(id: string, dto: UpdateComboDto, user: User): Promise<Product> {
    await this.dataSource.transaction(async (manager) => {
      const productRepository = manager.getRepository(Product);
      const variantRepository = manager.getRepository(ProductVariant);
      const combo = await productRepository.findOne({
        where: { id, productType: ProductType.COMBO },
        relations: { variants: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!combo) throw new NotFoundException('Không tìm thấy combo');

      if (user.role === UserRole.STORE_MANAGER && combo.branchId !== user.branchId) {
        throw new BadRequestException('Bạn không có quyền chỉnh sửa combo của chi nhánh khác');
      }

      let categoryId = dto.categoryId;
      if (!categoryId) {
        let category = await manager.getRepository(Category).findOne({
          where: [
            { slug: 'combo' },
            { name: 'Combo' }
          ]
        });
        if (!category) {
          category = await manager.getRepository(Category).save({
            name: 'Combo',
            slug: 'combo',
          });
        }
        categoryId = category.id;
      }

      await this.validateReferences(manager.getRepository(Category), productRepository, variantRepository, dto.items, id, categoryId);
      const slug = createSlug(dto.name);
      await this.assertUnique(productRepository, variantRepository, slug, dto.sku, id, combo.variants[0]?.id);

      const branchId = user.role === UserRole.ADMIN ? (dto.branchId !== undefined ? dto.branchId : combo.branchId) : combo.branchId;

      Object.assign(combo, {
        categoryId,
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() || null,
        imageUrl: dto.imageUrl?.trim() || null,
        isActive: dto.isActive ?? true,
        branchId,
      });
      await productRepository.save(combo);

      const variant = combo.variants[0];
      if (!variant) throw new BadRequestException('Combo chưa có biến thể giá bán');
      Object.assign(variant, {
        sku: dto.sku.trim(),
        variantName: `${dto.name.trim()} - Combo`,
        price: dto.price,
        status: dto.isActive === false ? VariantStatus.INACTIVE : VariantStatus.ACTIVE,
        imageUrl: dto.imageUrl?.trim() || null,
      });
      await variantRepository.save(variant);

      await manager.getRepository(ComboItem).delete({ comboProductId: id });
      await manager.getRepository(ComboItem).save(this.toComboItems(id, dto.items));
    });
    return this.findOne(id);
  }

  async remove(id: string, user: User): Promise<void> {
    const combo = await this.products.findOne({ where: { id, productType: ProductType.COMBO } });
    if (!combo) throw new NotFoundException('Không tìm thấy combo');
    if (user.role === UserRole.STORE_MANAGER && combo.branchId !== user.branchId) {
      throw new BadRequestException('Bạn không có quyền xóa combo của chi nhánh khác');
    }
    await this.products.remove(combo);
  }

  private async findOne(id: string): Promise<Product> {
    const combo = await this.products.findOne({
      where: { id, productType: ProductType.COMBO },
      relations: { category: true, variants: true, items: { childProduct: true, childVariant: true } },
    });
    if (!combo) throw new NotFoundException('Không tìm thấy combo');
    combo.items.sort((a, b) => a.sortOrder - b.sortOrder);
    return combo;
  }

  private toComboItems(comboProductId: string, items: ComboItemDto[]): Partial<ComboItem>[] {
    return items.map((item, index) => ({
      comboProductId,
      childProductId: item.childProductId,
      childVariantId: item.childVariantId || null,
      quantity: item.quantity,
      isOptional: item.isOptional ?? false,
      sortOrder: index,
    }));
  }

  private async validateReferences(
    categories: Repository<Category>,
    products: Repository<Product>,
    variants: Repository<ProductVariant>,
    items: ComboItemDto[],
    comboId?: string,
    categoryId?: string,
  ): Promise<void> {
    const targetCategoryId = categoryId;
    if (!targetCategoryId || !await categories.exists({ where: { id: targetCategoryId } })) {
      throw new BadRequestException('Danh mục combo không tồn tại');
    }
    if (!items.length) throw new BadRequestException('Combo cần ít nhất một sản phẩm thành phần');

    const keys = items.map(item => `${item.childProductId}:${item.childVariantId ?? ''}`);
    if (new Set(keys).size !== keys.length) throw new BadRequestException('Sản phẩm thành phần trong combo không được trùng nhau');

    for (const item of items) {
      if (item.childProductId === comboId) throw new BadRequestException('Combo không thể chứa chính nó');
      const product = await products.findOne({ where: { id: item.childProductId } });
      if (!product || product.productType === ProductType.COMBO || !product.isActive) {
        throw new BadRequestException('Sản phẩm thành phần không tồn tại hoặc không khả dụng');
      }
      if (item.childVariantId) {
        const variant = await variants.findOne({ where: { id: item.childVariantId, productId: item.childProductId } });
        if (!variant || variant.status !== VariantStatus.ACTIVE) {
          throw new BadRequestException('Biến thể thành phần không thuộc sản phẩm hoặc không khả dụng');
        }
      }
    }
  }

  private async assertUnique(
    products: Repository<Product>,
    variants: Repository<ProductVariant>,
    slug: string,
    sku: string,
    productId?: string,
    variantId?: string,
  ): Promise<void> {
    const sameSlug = await products.findOne({ where: { slug } });
    if (sameSlug && sameSlug.id !== productId) throw new BadRequestException('Tên combo đã tồn tại');
    const sameSku = await variants.findOne({ where: { sku: sku.trim() } });
    if (sameSku && sameSku.id !== variantId) throw new BadRequestException('SKU combo đã tồn tại');
  }
}
