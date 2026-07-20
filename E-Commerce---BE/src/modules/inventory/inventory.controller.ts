import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { InventoryService } from './inventory.service';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { CreateIngredientDto, UpdateIngredientDto } from './dto/create-ingredient.dto';
import { CreateBranchIngredientStockDto, UpdateBranchIngredientStockDto } from './dto/branch-ingredient-stock.dto';
import { CreateVariantIngredientDto, BulkSetVariantIngredientsDto } from './dto/variant-ingredient.dto';
import { CreateStockBatchDto, UpdateStockBatchDto } from './dto/stock-batch.dto';
import { CreateInventoryTransactionDto } from './dto/create-inventory-transaction.dto';
import {
  QueryVariantStockDto,
  QueryIngredientStockDto,
  QueryStockBatchDto,
  QueryInventoryTransactionDto,
  QueryExpiryWarningDto,
  QueryLowStockDto,
} from './dto/query-inventory.dto';

@Controller('inventory')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // SP2-09: Tồn kho variant theo chi nhánh
  // ───────────────────────────────────────────────────────────────────────────
  @Get()
  @Permissions(Permission.VIEW_INVENTORY)
  findAllStocks(@Query() query: QueryVariantStockDto) {
    return this.inventoryService.findVariantStocks(query);
  }

  @Get('variants')
  @Permissions(Permission.VIEW_INVENTORY)
  findVariantStocks(@Query() query: QueryVariantStockDto) {
    return this.inventoryService.findVariantStocks(query);
  }

  @Get('variants/:id')
  @Permissions(Permission.VIEW_INVENTORY)
  findVariantStockById(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findVariantStockById(id);
  }

  @Patch(':id')
  @Permissions(Permission.MANAGE_INVENTORY)
  updateStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryDto,
  ) {
    return this.inventoryService.updateVariantStock(id, dto);
  }

  @Patch('variants/:id')
  @Permissions(Permission.MANAGE_INVENTORY)
  updateVariantStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryDto,
  ) {
    return this.inventoryService.updateVariantStock(id, dto);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SP2-10: API quản lý nguyên liệu (Master Data)
  // ───────────────────────────────────────────────────────────────────────────
  @Post('ingredients')
  @Permissions(Permission.MANAGE_INVENTORY)
  createIngredient(@Body() dto: CreateIngredientDto) {
    return this.inventoryService.createIngredient(dto);
  }

  @Get('ingredients')
  @Permissions(Permission.VIEW_INVENTORY)
  findAllIngredients(
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    const activeBool = isActive !== undefined ? isActive === 'true' : undefined;
    return this.inventoryService.findAllIngredients(search, activeBool);
  }

  @Get('ingredients/:id')
  @Permissions(Permission.VIEW_INVENTORY)
  findIngredientById(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findIngredientById(id);
  }

  @Patch('ingredients/:id')
  @Permissions(Permission.MANAGE_INVENTORY)
  updateIngredient(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIngredientDto,
  ) {
    return this.inventoryService.updateIngredient(id, dto);
  }

  @Delete('ingredients/:id')
  @Permissions(Permission.MANAGE_INVENTORY)
  deleteIngredient(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.deleteIngredient(id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SP2-11: API tồn kho nguyên liệu theo chi nhánh
  // ───────────────────────────────────────────────────────────────────────────
  @Get('branch-ingredients')
  @Permissions(Permission.VIEW_INVENTORY)
  findBranchIngredientStocks(@Query() query: QueryIngredientStockDto) {
    return this.inventoryService.findBranchIngredientStocks(query);
  }

  @Post('branch-ingredients')
  @Permissions(Permission.MANAGE_INVENTORY)
  upsertBranchIngredientStock(@Body() dto: CreateBranchIngredientStockDto) {
    return this.inventoryService.upsertBranchIngredientStock(dto);
  }

  @Patch('branch-ingredients/:id')
  @Permissions(Permission.MANAGE_INVENTORY)
  updateBranchIngredientStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBranchIngredientStockDto,
  ) {
    return this.inventoryService.updateBranchIngredientStock(id, dto);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SP2-12: API công thức nguyên liệu theo variant (BOM)
  // ───────────────────────────────────────────────────────────────────────────
  @Get('variants/:variantId/ingredients')
  @Permissions(Permission.VIEW_INVENTORY)
  findVariantIngredients(@Param('variantId', ParseUUIDPipe) variantId: string) {
    return this.inventoryService.findVariantIngredients(variantId);
  }

  @Post('variants/:variantId/ingredients')
  @Permissions(Permission.MANAGE_INVENTORY)
  addVariantIngredient(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: CreateVariantIngredientDto,
  ) {
    return this.inventoryService.addVariantIngredient(variantId, dto);
  }

  @Put('variants/:variantId/ingredients')
  @Permissions(Permission.MANAGE_INVENTORY)
  bulkSetVariantIngredients(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: BulkSetVariantIngredientsDto,
  ) {
    return this.inventoryService.bulkSetVariantIngredients(variantId, dto);
  }

  @Delete('variant-ingredients/:id')
  @Permissions(Permission.MANAGE_INVENTORY)
  deleteVariantIngredient(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.deleteVariantIngredient(id);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SP2-13: API quản lý lô hàng (Stock Batches FEFO)
  // ───────────────────────────────────────────────────────────────────────────
  @Post('batches')
  @Permissions(Permission.MANAGE_INVENTORY)
  createStockBatch(
    @Body() dto: CreateStockBatchDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.createStockBatch(dto, user?.id);
  }

  @Get('batches')
  @Permissions(Permission.VIEW_INVENTORY)
  findStockBatches(@Query() query: QueryStockBatchDto) {
    return this.inventoryService.findStockBatches(query);
  }

  @Get('batches/:id')
  @Permissions(Permission.VIEW_INVENTORY)
  findStockBatchById(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findStockBatchById(id);
  }

  @Patch('batches/:id')
  @Permissions(Permission.MANAGE_INVENTORY)
  updateStockBatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStockBatchDto,
  ) {
    return this.inventoryService.updateStockBatch(id, dto);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SP2-14: API lịch sử giao dịch kho (Audit Trail)
  // ───────────────────────────────────────────────────────────────────────────
  @Post('transactions')
  @Permissions(Permission.MANAGE_INVENTORY)
  recordTransaction(
    @Body() dto: CreateInventoryTransactionDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.recordTransaction(dto, user?.id);
  }

  @Get('transactions')
  @Permissions(Permission.VIEW_INVENTORY)
  findTransactions(@Query() query: QueryInventoryTransactionDto) {
    return this.inventoryService.findTransactions(query);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SP2-15: API cảnh báo tồn kho thấp (Low Stock Alert)
  // ───────────────────────────────────────────────────────────────────────────
  @Get('alerts/low-stock')
  @Permissions(Permission.VIEW_INVENTORY)
  getLowStockAlerts(@Query() query: QueryLowStockDto) {
    return this.inventoryService.getLowStockAlerts(query);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SP2-16: API cảnh báo sắp hết hạn (Expiry Warning)
  // ───────────────────────────────────────────────────────────────────────────
  @Get('alerts/expiring-batches')
  @Permissions(Permission.VIEW_INVENTORY)
  getExpiringBatches(@Query() query: QueryExpiryWarningDto) {
    return this.inventoryService.getExpiringBatches(query);
  }
}
