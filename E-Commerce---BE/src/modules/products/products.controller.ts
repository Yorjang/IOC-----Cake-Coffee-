import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { CreateProductVariantDto, UpdateProductVariantDto } from './dto/product-variant.dto';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    // ── Categories Routes ────────────────────────────────────────────────────
    @Get('categories')
    findAllCategories() {
        return this.productsService.findAllCategories();
    }

    @Get('categories/:id')
    findCategoryById(@Param('id', ParseUUIDPipe) id: string) {
        return this.productsService.findCategoryById(id);
    }

    @Post('categories')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions(Permission.CREATE_PRODUCT)
    createCategory(@Body() dto: CreateCategoryDto) {
        return this.productsService.createCategory(dto);
    }

    @Patch('categories/:id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions(Permission.UPDATE_PRODUCT)
    updateCategory(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateCategoryDto,
    ) {
        return this.productsService.updateCategory(id, dto);
    }

    @Delete('categories/:id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions(Permission.DELETE_PRODUCT)
    deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
        return this.productsService.deleteCategory(id);
    }

    // ── Products Routes ──────────────────────────────────────────────────────
    @Get()
    findAllProducts() {
        return this.productsService.findAllProducts();
    }

    @Get(':id')
    findProductById(@Param('id', ParseUUIDPipe) id: string) {
        return this.productsService.findProductById(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions(Permission.CREATE_PRODUCT)
    createProduct(@Body() dto: CreateProductDto) {
        return this.productsService.createProduct(dto);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions(Permission.UPDATE_PRODUCT)
    updateProduct(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateProductDto,
    ) {
        return this.productsService.updateProduct(id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions(Permission.DELETE_PRODUCT)
    deleteProduct(@Param('id', ParseUUIDPipe) id: string) {
        return this.productsService.deleteProduct(id);
    }

    // ── Product Variants Routes ──────────────────────────────────────────────
    @Post(':productId/variants')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions(Permission.CREATE_PRODUCT)
    createVariant(
        @Param('productId', ParseUUIDPipe) productId: string,
        @Body() dto: CreateProductVariantDto,
    ) {
        return this.productsService.createVariant(productId, dto);
    }

    @Patch('variants/:id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions(Permission.UPDATE_PRODUCT)
    updateVariant(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateProductVariantDto,
    ) {
        return this.productsService.updateVariant(id, dto);
    }

    @Delete('variants/:id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions(Permission.DELETE_PRODUCT)
    deleteVariant(@Param('id', ParseUUIDPipe) id: string) {
        return this.productsService.deleteVariant(id);
    }
}
