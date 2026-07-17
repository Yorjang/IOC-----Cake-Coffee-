import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Not, Repository } from 'typeorm';
import { Category } from '../products/category.entity';
import { Product, ProductType } from '../products/product.entity';
import { ProductVariant, VariantStatus } from '../products/product-variant.entity';
import { ComboItem } from './combo-item.entity';
import { ComboItemDto, CreateComboDto, UpdateComboDto } from './dto/combo.dto';

function generateSlug(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

@Injectable()
export class CombosService {
    constructor(
        @InjectRepository(ComboItem)
        private readonly comboItems: Repository<ComboItem>,
        @InjectRepository(Product)
        private readonly products: Repository<Product>,
        @InjectRepository(ProductVariant)
        private readonly variants: Repository<ProductVariant>,
        private readonly dataSource: DataSource,
    ) {}

    async findAll(): Promise<any[]> {
        const combos = await this.products.find({
            where: { productType: ProductType.COMBO },
            relations: { category: true, variants: true, tags: true },
            order: { name: 'ASC' },
        });
        return Promise.all(combos.map(combo => this.withItems(combo)));
    }

    async findOne(id: string): Promise<any> {
        const combo = await this.products.findOne({
            where: { id, productType: ProductType.COMBO },
            relations: { category: true, variants: true, tags: true },
        });
        if (!combo) throw new NotFoundException('Không tìm thấy combo');
        return this.withItems(combo);
    }

    async findAvailableProducts(): Promise<Product[]> {
        return this.products.find({
            where: { productType: Not(ProductType.COMBO), isActive: true },
            relations: { category: true, variants: true },
            order: { name: 'ASC' },
        });
    }

    async create(dto: CreateComboDto): Promise<any> {
        const comboId = await this.dataSource.transaction(async manager => {
            await this.validateCategory(manager, dto.categoryId);
            const productRepository = manager.getRepository(Product);
            const variantRepository = manager.getRepository(ProductVariant);
            const name = dto.name.trim();
            const slug = dto.slug?.trim() || generateSlug(name);
            await this.ensureUnique(manager, slug, dto.sku.trim());

            const combo = await productRepository.save(productRepository.create({
                categoryId: dto.categoryId,
                name,
                slug,
                description: dto.description,
                imageUrl: dto.imageUrl,
                productType: ProductType.COMBO,
                isActive: dto.isActive ?? true,
                requiresNote: false,
            }));
            await variantRepository.save(variantRepository.create({
                productId: combo.id,
                sku: dto.sku.trim(),
                variantName: `${name} - Combo`,
                size: 'Combo',
                price: dto.price,
                status: VariantStatus.ACTIVE,
            }));
            await this.replaceItems(manager, combo.id, dto.items);
            return combo.id;
        });
        return this.findOne(comboId);
    }

    async update(id: string, dto: UpdateComboDto): Promise<any> {
        await this.findOne(id);
        await this.dataSource.transaction(async manager => {
            const productRepository = manager.getRepository(Product);
            const variantRepository = manager.getRepository(ProductVariant);
            const combo = await productRepository.findOneByOrFail({ id });
            const variant = await variantRepository.findOne({ where: { productId: id }, order: { createdAt: 'ASC' } });
            if (!variant) throw new BadRequestException('Combo chưa có biến thể giá bán');
            if (dto.categoryId) await this.validateCategory(manager, dto.categoryId);

            const name = dto.name?.trim();
            const slug = dto.slug?.trim() || (name ? generateSlug(name) : undefined);
            const sku = dto.sku?.trim();
            await this.ensureUnique(manager, slug, sku, id, variant.id);
            Object.assign(combo, {
                ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
                ...(name ? { name } : {}),
                ...(slug ? { slug } : {}),
                ...(dto.description !== undefined ? { description: dto.description } : {}),
                ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
                ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
                productType: ProductType.COMBO,
            });
            await productRepository.save(combo);
            Object.assign(variant, {
                ...(sku ? { sku } : {}),
                ...(name ? { variantName: `${name} - Combo` } : {}),
                ...(dto.price !== undefined ? { price: dto.price } : {}),
            });
            await variantRepository.save(variant);
            if (dto.items) await this.replaceItems(manager, id, dto.items);
        });
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        const combo = await this.products.findOne({ where: { id, productType: ProductType.COMBO } });
        if (!combo) throw new NotFoundException('Không tìm thấy combo');
        await this.products.remove(combo);
    }

    private async withItems(combo: Product): Promise<any> {
        const items = await this.comboItems.find({
            where: { comboProductId: combo.id },
            relations: { childProduct: true, childVariant: true },
            order: { sortOrder: 'ASC' },
        });
        return { ...combo, items };
    }

    private async validateCategory(manager: EntityManager, categoryId: string): Promise<void> {
        if (!await manager.getRepository(Category).exists({ where: { id: categoryId } })) {
            throw new BadRequestException('Danh mục không tồn tại');
        }
    }

    private async ensureUnique(manager: EntityManager, slug?: string, sku?: string, productId?: string, variantId?: string): Promise<void> {
        if (slug) {
            const product = await manager.getRepository(Product).findOne({ where: { slug } });
            if (product && product.id !== productId) throw new BadRequestException('Slug combo đã tồn tại');
        }
        if (sku) {
            const variant = await manager.getRepository(ProductVariant).findOne({ where: { sku } });
            if (variant && variant.id !== variantId) throw new BadRequestException('SKU combo đã tồn tại');
        }
    }

    private async replaceItems(manager: EntityManager, comboId: string, items: ComboItemDto[]): Promise<void> {
        const productRepository = manager.getRepository(Product);
        const variantRepository = manager.getRepository(ProductVariant);
        const itemRepository = manager.getRepository(ComboItem);
        const keys = new Set<string>();
        const rows: Partial<ComboItem>[] = [];

        for (const [index, item] of items.entries()) {
            if (item.childProductId === comboId) throw new BadRequestException('Combo không thể chứa chính nó');
            const childProduct = await productRepository.findOne({ where: { id: item.childProductId } });
            if (!childProduct) throw new BadRequestException(`Sản phẩm thành phần thứ ${index + 1} không tồn tại`);
            if (childProduct.productType === ProductType.COMBO) throw new BadRequestException('Không hỗ trợ lồng combo bên trong combo');
            if (item.childVariantId) {
                const childVariant = await variantRepository.findOne({ where: { id: item.childVariantId } });
                if (!childVariant || childVariant.productId !== item.childProductId) {
                    throw new BadRequestException(`Biến thể của thành phần thứ ${index + 1} không thuộc sản phẩm đã chọn`);
                }
            }
            const key = `${item.childProductId}:${item.childVariantId || ''}`;
            if (keys.has(key)) throw new BadRequestException('Sản phẩm và biến thể thành phần không được trùng nhau');
            keys.add(key);
            rows.push({
                comboProductId: comboId,
                childProductId: item.childProductId,
                childVariantId: item.childVariantId || null,
                quantity: item.quantity,
                isOptional: item.isOptional ?? false,
                sortOrder: index,
            });
        }
        await itemRepository.delete({ comboProductId: comboId });
        await itemRepository.save(itemRepository.create(rows));
    }
}
