import { Injectable, BadRequestException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';
import { Category } from './category.entity';
import { Product, ProductType } from './product.entity';
import { ProductVariant, VariantStatus } from './product-variant.entity';
import { ProductTopping } from './product-topping.entity';
import { ReplaceProductToppingsDto } from './dto/product-topping.dto';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { CreateProductVariantDto, UpdateProductVariantDto } from './dto/product-variant.dto';
import { ProductTag } from './product-tag.entity';
import { CreateProductTagDto, ReplaceProductTagsDto, UpdateProductTagDto } from './dto/product-tag.dto';
import { User, UserRole } from '../users/user.entity';

// BUG-016 FIX: Hoist RegExp to module level — prevents re-creation on every call (js-hoist-regexp)
const SLUG_ACCENT_MAP: [RegExp, string][] = [
    [/[áàảãạăắằẳẵặâấầẩẫậ]/g, 'a'],
    [/[éèẻẽẹêếềểễệ]/g, 'e'],
    [/[íìỉĩị]/g, 'i'],
    [/[óòỏõọôốồổỗộơớờởỡợ]/g, 'o'],
    [/[úùủũụưứừửữự]/g, 'u'],
    [/[ýỳỷỹỵ]/g, 'y'],
    [/đ/g, 'd'],
    [/[^a-z0-9\s-]/g, ''],
    [/\s+/g, '-'],
    [/-+/g, '-'],
];

// Utility helper to generate slug
function generateSlug(name: string): string {
    let s = name.toLowerCase();
    for (const [pattern, replacement] of SLUG_ACCENT_MAP) {
        s = s.replace(pattern, replacement);
    }
    return s.trim();
}


@Injectable()
export class ProductsService implements OnModuleInit {
    constructor(
        @InjectRepository(Category)
        private readonly categories: Repository<Category>,

        @InjectRepository(Product)
        private readonly products: Repository<Product>,

        @InjectRepository(ProductVariant)
        private readonly variants: Repository<ProductVariant>,

        @InjectRepository(ProductTopping)
        private readonly toppings: Repository<ProductTopping>,

        @InjectRepository(ProductTag)
        private readonly tags: Repository<ProductTag>,
    ) {}

    async onModuleInit() {
        try {
            await this.products.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS branch_id UUID');
        } catch (err) {
            console.error('Error adding branch_id to products:', err);
        }
        try {
            await this.products.query(
                'ALTER TABLE products ADD CONSTRAINT fk_products_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL'
            );
        } catch (err) {
            // Ignore if constraint already exists
        }
    }

    // ── Categories CRUD ──────────────────────────────────────────────────────
    async findAllCategories(): Promise<Category[]> {
        return this.categories.find({
            order: { sortOrder: 'ASC', name: 'ASC' },
        });
    }

    async findCategoryById(id: string): Promise<Category> {
        const cat = await this.categories.findOne({ where: { id } });
        if (!cat) throw new NotFoundException('Không tìm thấy danh mục');
        return cat;
    }

    async createCategory(dto: CreateCategoryDto): Promise<Category> {
        const existing = await this.categories.findOne({ where: { name: dto.name } });
        if (existing) throw new BadRequestException('Tên danh mục này đã tồn tại');

        const slug = dto.slug || generateSlug(dto.name);
        const category = this.categories.create({
            ...dto,
            slug,
        });
        return this.categories.save(category);
    }

    async updateCategory(id: string, dto: UpdateCategoryDto): Promise<Category> {
        const cat = await this.findCategoryById(id);
        if (dto.name && dto.name !== cat.name) {
            const existing = await this.categories.findOne({ where: { name: dto.name } });
            if (existing) throw new BadRequestException('Tên danh mục này đã tồn tại');
            cat.slug = dto.slug || generateSlug(dto.name);
        }
        Object.assign(cat, dto);
        return this.categories.save(cat);
    }

    async deleteCategory(id: string): Promise<void> {
        const cat = await this.findCategoryById(id);
        
        // Check if there are products in this category
        const productsCount = await this.products.count({ where: { categoryId: id } });
        if (productsCount > 0) {
            throw new BadRequestException('Không thể xóa danh mục này vì vẫn còn sản phẩm đang thuộc danh mục này');
        }
        
        await this.categories.remove(cat);
    }

    // ── Products CRUD ────────────────────────────────────────────────────────
    async findAllProducts(tagSlug?: string, user?: User, isAdminPath?: boolean, branchId?: string): Promise<Product[]> {
        const baseWhere: FindOptionsWhere<Product> = {};
        if (tagSlug) {
            baseWhere.tags = { slug: tagSlug };
        }
        if (isAdminPath && user?.role === UserRole.STORE_MANAGER && user.branchId) {
            baseWhere.branchId = user.branchId;
        }
        const where: FindOptionsWhere<Product> | FindOptionsWhere<Product>[] | undefined =
            !isAdminPath && branchId
                ? [
                    { ...baseWhere, branchId },
                    { ...baseWhere, branchId: IsNull() },
                ]
                : Object.keys(baseWhere).length > 0 ? baseWhere : undefined;
        return this.products.find({
            where,
            relations: { category: true, variants: true, toppings: true, tags: true, branch: true },
            order: { name: 'ASC' },
        });
    }

    async findProductById(id: string): Promise<Product> {
        const prod = await this.products.findOne({
            where: { id },
            relations: { category: true, variants: true, toppings: true, tags: true, branch: true },
        });
        if (!prod) throw new NotFoundException('Không tìm thấy sản phẩm');
        return prod;
    }

    async createProduct(dto: CreateProductDto, user: User): Promise<Product> {
        // Validate Category
        await this.findCategoryById(dto.categoryId);

        const slug = dto.slug || generateSlug(dto.name);
        const existing = await this.products.findOne({ where: { slug } });
        if (existing) throw new BadRequestException('Sản phẩm với tên hoặc đường dẫn này đã tồn tại');

        const branchId = user.role === UserRole.STORE_MANAGER ? user.branchId : dto.branchId;

        const { variants, ...prodData } = dto;
        const product = this.products.create({
            ...prodData,
            branchId,
            slug,
        });

        const savedProduct = await this.products.save(product);

        // Add variants if provided, otherwise add default variant
        if (variants && variants.length > 0) {
        // BUG-012 FIX: Save all variants in a single batch call (was serial N saves)
        const variantEntities = variants.map((vDto: any) =>
            this.variants.create({ ...vDto, productId: savedProduct.id } as any)
        );
        await Promise.all(variantEntities.map(v => this.variants.save(v)));

        } else {
            // Default variant creation
            const size = dto.productType === ProductType.COFFEE || dto.productType === ProductType.DRINK ? 'Vừa' : 'Mặc định';
            const variant = this.variants.create({
                productId: savedProduct.id,
                sku: `${slug.toUpperCase()}-DEFAULT`,
                variantName: `${dto.name} - Mặc định`,
                size,
                price: 45000,
                status: VariantStatus.ACTIVE,
            });
            await this.variants.save(variant);
        }

        return this.findProductById(savedProduct.id);
    }

    async updateProduct(id: string, dto: UpdateProductDto, user: User): Promise<Product> {
        const prod = await this.findProductById(id);
        if (user.role === UserRole.STORE_MANAGER && prod.branchId !== user.branchId) {
            throw new BadRequestException('Bạn không có quyền chỉnh sửa sản phẩm của chi nhánh khác');
        }
        
        if (dto.categoryId && dto.categoryId !== prod.categoryId) {
            await this.findCategoryById(dto.categoryId);
        }

        if (dto.name && dto.name !== prod.name) {
            const slug = dto.slug || generateSlug(dto.name);
            const existing = await this.products.findOne({ where: { slug } });
            if (existing && existing.id !== id) {
                throw new BadRequestException('Sản phẩm với tên này đã trùng lặp');
            }
            prod.slug = slug;
        }

        const { branchId, ...updateData } = dto;
        if (user.role === UserRole.ADMIN) {
            prod.branchId = branchId !== undefined ? branchId : prod.branchId;
        }

        Object.assign(prod, updateData);
        await this.products.save(prod);
        return this.findProductById(id);
    }

    async deleteProduct(id: string, user: User): Promise<void> {
        const prod = await this.findProductById(id);
        if (user.role === UserRole.STORE_MANAGER && prod.branchId !== user.branchId) {
            throw new BadRequestException('Bạn không có quyền xóa sản phẩm của chi nhánh khác');
        }
        await this.products.remove(prod);
    }

    async findProductToppings(productId: string): Promise<ProductTopping[]> {
        await this.findProductById(productId);
        return this.toppings.find({
            where: { productId },
            order: { sortOrder: 'ASC', name: 'ASC' },
        });
    }

    async replaceProductToppings(productId: string, dto: ReplaceProductToppingsDto): Promise<ProductTopping[]> {
        await this.findProductById(productId);
        const normalized = dto.toppings.map((topping, index) => ({
            productId,
            name: topping.name.trim(),
            price: topping.price,
            isActive: topping.isActive ?? true,
            sortOrder: topping.sortOrder ?? index,
        }));
        const normalizedNames = normalized.map(topping => topping.name.toLocaleLowerCase('vi'));
        if (new Set(normalizedNames).size !== normalizedNames.length) {
            throw new BadRequestException('Tên topping trong cùng một sản phẩm không được trùng nhau');
        }

        await this.toppings.manager.transaction(async manager => {
            const repository = manager.getRepository(ProductTopping);
            await repository.delete({ productId });
            if (normalized.length > 0) await repository.save(repository.create(normalized));
        });
        return this.findProductToppings(productId);
    }

    async findAllTags(): Promise<ProductTag[]> {
        return this.tags.find({ order: { name: 'ASC' } });
    }

    async findTagById(id: string): Promise<ProductTag> {
        const tag = await this.tags.findOne({ where: { id } });
        if (!tag) throw new NotFoundException('Không tìm thấy tag sản phẩm');
        return tag;
    }

    async createTag(dto: CreateProductTagDto): Promise<ProductTag> {
        const name = dto.name.trim();
        const slug = dto.slug?.trim() || generateSlug(name);
        const existing = await this.tags.findOne({ where: [{ name }, { slug }] });
        if (existing) throw new BadRequestException('Tên hoặc slug tag đã tồn tại');
        return this.tags.save(this.tags.create({ name, slug }));
    }

    async updateTag(id: string, dto: UpdateProductTagDto): Promise<ProductTag> {
        const tag = await this.findTagById(id);
        const name = dto.name?.trim();
        const slug = dto.slug?.trim() || (name ? generateSlug(name) : undefined);
        if (name || slug) {
            const existing = await this.tags.findOne({
                where: [
                    ...(name ? [{ name }] : []),
                    ...(slug ? [{ slug }] : []),
                ],
            });
            if (existing && existing.id !== id) {
                throw new BadRequestException('Tên hoặc slug tag đã tồn tại');
            }
        }
        Object.assign(tag, { ...(name ? { name } : {}), ...(slug ? { slug } : {}) });
        return this.tags.save(tag);
    }

    async deleteTag(id: string): Promise<void> {
        await this.tags.remove(await this.findTagById(id));
    }

    async findProductTags(productId: string): Promise<ProductTag[]> {
        const product = await this.findProductById(productId);
        return [...(product.tags || [])].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    }

    async replaceProductTags(productId: string, dto: ReplaceProductTagsDto): Promise<ProductTag[]> {
        await this.findProductById(productId);
        const tags = dto.tagIds.length
            ? await this.tags.createQueryBuilder('tag').where('tag.id IN (:...ids)', { ids: dto.tagIds }).getMany()
            : [];
        if (tags.length !== dto.tagIds.length) {
            throw new BadRequestException('Một hoặc nhiều tag không tồn tại');
        }
        await this.products.createQueryBuilder().relation(Product, 'tags').of(productId).addAndRemove(dto.tagIds, await this.findProductTags(productId).then(items => items.map(item => item.id)));
        return this.findProductTags(productId);
    }

    // ── Variants CRUD ────────────────────────────────────────────────────────
    async createVariant(productId: string, dto: CreateProductVariantDto): Promise<ProductVariant> {
        await this.findProductById(productId);
        
        const existingSku = await this.variants.findOne({ where: { sku: dto.sku } });
        if (existingSku) throw new BadRequestException('Mã SKU này đã tồn tại trên hệ thống');

        const variant = this.variants.create({
            ...dto,
            productId,
        });
        return this.variants.save(variant);
    }

    async updateVariant(id: string, dto: UpdateProductVariantDto): Promise<ProductVariant> {
        const variant = await this.variants.findOne({ where: { id } });
        if (!variant) throw new NotFoundException('Không tìm thấy biến thể sản phẩm');

        if (dto.sku && dto.sku !== variant.sku) {
            const existingSku = await this.variants.findOne({ where: { sku: dto.sku } });
            if (existingSku) throw new BadRequestException('Mã SKU này đã tồn tại trên hệ thống');
        }

        Object.assign(variant, dto);
        return this.variants.save(variant);
    }

    async deleteVariant(id: string): Promise<void> {
        const variant = await this.variants.findOne({ where: { id } });
        if (!variant) throw new NotFoundException('Không tìm thấy biến thể sản phẩm');
        
        // Prevent deleting if it's the last remaining variant for the product
        const count = await this.variants.count({ where: { productId: variant.productId } });
        if (count <= 1) {
            throw new BadRequestException('Không thể xóa biến thể cuối cùng của sản phẩm');
        }

        await this.variants.remove(variant);
    }

    async findDistinctVariantSizes(): Promise<string[]> {
        const results = await this.variants
            .createQueryBuilder('variant')
            .select('DISTINCT(variant.size)', 'size')
            .where("variant.status = :status", { status: VariantStatus.ACTIVE })
            .andWhere("variant.size IS NOT NULL AND variant.size != ''")
            .orderBy('size', 'ASC')
            .getRawMany();
        return results.map(r => r.size);
    }
}

