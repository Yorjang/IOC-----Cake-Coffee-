import { Controller, Get, Post, Put, Patch, Delete, Param, Body, UseGuards, ParseUUIDPipe, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { CreateProductVariantDto, UpdateProductVariantDto } from './dto/product-variant.dto';
import { ReplaceProductToppingsDto } from './dto/product-topping.dto';
import { CreateProductTagDto, ReplaceProductTagsDto, UpdateProductTagDto } from './dto/product-tag.dto';

@Controller(['admin/products', 'products'])
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

    @Get('tags')
    findAllTags() {
        return this.productsService.findAllTags();
    }

    @Get('tags/:id')
    findTagById(@Param('id', ParseUUIDPipe) id: string) {
        return this.productsService.findTagById(id);
    }

    @Post('tags')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions(Permission.CREATE_PRODUCT)
    createTag(@Body() dto: CreateProductTagDto) {
        return this.productsService.createTag(dto);
    }

    @Patch('tags/:id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions(Permission.UPDATE_PRODUCT)
    updateTag(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductTagDto) {
        return this.productsService.updateTag(id, dto);
    }

    @Delete('tags/:id')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions(Permission.DELETE_PRODUCT)
    deleteTag(@Param('id', ParseUUIDPipe) id: string) {
        return this.productsService.deleteTag(id);
    }

    // ── Products Routes ──────────────────────────────────────────────────────
    @Get()
    findAllProducts(@Query('tag') tag?: string) {
        return this.productsService.findAllProducts(tag);
    }

    @Get('sizes/distinct')
    findDistinctSizes() {
        return this.productsService.findDistinctVariantSizes();
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

    @Get(':productId/toppings')
    findProductToppings(@Param('productId', ParseUUIDPipe) productId: string) {
        return this.productsService.findProductToppings(productId);
    }

    @Put(':productId/toppings')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions(Permission.UPDATE_PRODUCT)
    replaceProductToppings(
        @Param('productId', ParseUUIDPipe) productId: string,
        @Body() dto: ReplaceProductToppingsDto,
    ) {
        return this.productsService.replaceProductToppings(productId, dto);
    }

    @Get(':productId/tags')
    findProductTags(@Param('productId', ParseUUIDPipe) productId: string) {
        return this.productsService.findProductTags(productId);
    }

    @Put(':productId/tags')
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @Permissions(Permission.UPDATE_PRODUCT)
    replaceProductTags(
        @Param('productId', ParseUUIDPipe) productId: string,
        @Body() dto: ReplaceProductTagsDto,
    ) {
        return this.productsService.replaceProductTags(productId, dto);
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
