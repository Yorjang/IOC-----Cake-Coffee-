import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { Product, ProductType } from './product.entity';
import { ProductVariant, VariantStatus } from './product-variant.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { CreateProductVariantDto, UpdateProductVariantDto } from './dto/product-variant.dto';

// Utility helper to generate slug
function generateSlug(name: string): string {
    let s = name.toLowerCase();
    s = s.replace(/[áàảãạăắằẳẵặâấầẩẫậ]/g, 'a');
    s = s.replace(/[éèẻẽẹêếềểễệ]/g, 'e');
    s = s.replace(/[íìỉĩị]/g, 'i');
    s = s.replace(/[óòỏõọôốồổỗộơớờởỡợ]/g, 'o');
    s = s.replace(/[úùủũụưứừửữự]/g, 'u');
    s = s.replace(/[ýỳỷỹỵ]/g, 'y');
    s = s.replace(/đ/g, 'd');
    s = s.replace(/[^a-z0-9\s-]/g, '');
    s = s.replace(/\s+/g, '-');
    return s.trim().replace(/-+/g, '-');
}

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Category)
        private readonly categories: Repository<Category>,

        @InjectRepository(Product)
        private readonly products: Repository<Product>,

        @InjectRepository(ProductVariant)
        private readonly variants: Repository<ProductVariant>,
    ) {}

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
    async findAllProducts(): Promise<Product[]> {
        return this.products.find({
            relations: { category: true, variants: true },
            order: { name: 'ASC' },
        });
    }

    async findProductById(id: string): Promise<Product> {
        const prod = await this.products.findOne({
            where: { id },
            relations: { category: true, variants: true },
        });
        if (!prod) throw new NotFoundException('Không tìm thấy sản phẩm');
        return prod;
    }

    async createProduct(dto: CreateProductDto): Promise<Product> {
        // Validate Category
        await this.findCategoryById(dto.categoryId);

        const slug = dto.slug || generateSlug(dto.name);
        const existing = await this.products.findOne({ where: { slug } });
        if (existing) throw new BadRequestException('Sản phẩm với tên hoặc đường dẫn này đã tồn tại');

        const { variants, ...prodData } = dto;
        const product = this.products.create({
            ...prodData,
            slug,
        });

        const savedProduct = await this.products.save(product);

        // Add variants if provided, otherwise add default variant
        if (variants && variants.length > 0) {
            for (const vDto of variants) {
                const variant = this.variants.create({
                    ...vDto,
                    productId: savedProduct.id,
                });
                await this.variants.save(variant);
            }
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

    async updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
        const prod = await this.findProductById(id);
        
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

        Object.assign(prod, dto);
        await this.products.save(prod);
        return this.findProductById(id);
    }

    async deleteProduct(id: string): Promise<void> {
        const prod = await this.findProductById(id);
        await this.products.remove(prod);
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

