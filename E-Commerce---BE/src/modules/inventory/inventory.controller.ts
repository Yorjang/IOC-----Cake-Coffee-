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
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '../../common/constants/permissions';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/user.entity';
import { InventoryService } from './inventory.service';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { CreateIngredientDto, UpdateIngredientDto } from './dto/create-ingredient.dto';
import { CreateBranchIngredientStockDto, UpdateBranchIngredientStockDto } from './dto/branch-ingredient-stock.dto';
import { CreateVariantIngredientDto, BulkSetVariantIngredientsDto } from './dto/variant-ingredient.dto';
import { CreateStockBatchDto, UpdateStockBatchDto } from './dto/stock-batch.dto';
import { CreateInventoryTransactionDto } from './dto/create-inventory-transaction.dto';
import { CreatePurchaseOrderDto, QueryPurchaseOrderDto } from './dto/create-purchase-order.dto';
import { CreatePurchaseRequestDto, QueryPurchaseRequestDto } from './dto/create-purchase-request.dto';
import { CancelReasonDto } from './dto/cancel-dto';
import { ConfirmInboundDto } from './dto/confirm-inbound.dto';
import { QueryAdjustmentDto } from './dto/query-adjustment.dto';
import {
  QueryVariantStockDto,
  QueryIngredientStockDto,
  QueryStockBatchDto,
  QueryInventoryTransactionDto,
  QueryExpiryWarningDto,
  QueryLowStockDto,
} from './dto/query-inventory.dto';

@Controller(['admin/inventory', 'inventory'])
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ───────────────────────────────────────────────────────────────────────────
  // SP2-09: Tồn kho variant theo chi nhánh
  // ───────────────────────────────────────────────────────────────────────────
  @Get()
  @Permissions(Permission.VIEW_INVENTORY)
  findAllStocks(@Query() query: QueryVariantStockDto, @CurrentUser() user: any) {
    if (user?.role === UserRole.STORE_MANAGER && user?.branchId) {
      query.branchId = user.branchId;
    }
    return this.inventoryService.findVariantStocks(query);
  }

  @Get('variants')
  @Permissions(Permission.VIEW_INVENTORY)
  findVariantStocks(@Query() query: QueryVariantStockDto, @CurrentUser() user: any) {
    if (user?.role === UserRole.STORE_MANAGER && user?.branchId) {
      query.branchId = user.branchId;
    }
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
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.updateVariantStock(id, dto, user);
  }

  @Patch('variants/:id')
  @Permissions(Permission.MANAGE_INVENTORY)
  updateVariantStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.updateVariantStock(id, dto, user);
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
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.updateBranchIngredientStock(id, dto, user);
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

  // ───────────────────────────────────────────────────────────────────────────
  // Purchase Request (PR) Workflow Endpoints
  // ───────────────────────────────────────────────────────────────────────────
  @Post('purchase-requests')
  @Permissions(Permission.MANAGE_INVENTORY)
  createPurchaseRequest(
    @Body() dto: CreatePurchaseRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.createPurchaseRequest(dto, user?.id);
  }

  @Get('purchase-requests')
  @Permissions(Permission.VIEW_INVENTORY)
  findPurchaseRequests(
    @Query() query: QueryPurchaseRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.findPurchaseRequests(query, user);
  }

  @Post('purchase-requests/:id/approve-to-pos')
  @Permissions(Permission.MANAGE_INVENTORY)
  approvePrToPos(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.approvePrToPos(id, user?.id);
  }

  @Post('purchase-requests/:id/cancel')
  @Permissions(Permission.MANAGE_INVENTORY)
  cancelPurchaseRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelReasonDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.cancelPurchaseRequest(id, dto, user);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Inbound Workflow & Purchase Orders (Scan Barcode & FEFO Confirmation)
  // ───────────────────────────────────────────────────────────────────────────
  @Post('purchase-orders')
  @Permissions(Permission.MANAGE_INVENTORY)
  createPurchaseOrder(
    @Body() dto: CreatePurchaseOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.createPurchaseOrder(dto, user?.id);
  }

  @Get('purchase-orders')
  @Permissions(Permission.VIEW_INVENTORY)
  findPurchaseOrders(@Query() query: QueryPurchaseOrderDto) {
    return this.inventoryService.findPurchaseOrders(query);
  }

  @Get('purchase-orders/:id')
  @Permissions(Permission.VIEW_INVENTORY)
  findPurchaseOrderById(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findPurchaseOrderById(id);
  }

  @Post('purchase-orders/:id/ship')
  @Permissions(Permission.MANAGE_INVENTORY)
  markPoAsShipped(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.markPoAsShipped(id, user);
  }

  @Post('purchase-orders/:id/cancel')
  @Permissions(Permission.MANAGE_INVENTORY)
  cancelPurchaseOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelReasonDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.cancelPurchaseOrder(id, dto, user);
  }

  @Get('inbound/scan')
  @Permissions(Permission.MANAGE_INVENTORY)
  scanInboundBarcode(
    @Query('po_code') poCode: string,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.scanInboundBarcode(poCode, user);
  }

  @Post('inbound/confirm')
  @Permissions(Permission.MANAGE_INVENTORY)
  confirmInbound(
    @Body() dto: ConfirmInboundDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.confirmInbound(dto, user);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Stock Adjustment Requests Approval Workflow
  // ───────────────────────────────────────────────────────────────────────────
  @Get('adjustments')
  @Permissions(Permission.VIEW_INVENTORY)
  findAllAdjustments(
    @Query() query: QueryAdjustmentDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.findAllAdjustments(query, user);
  }

  @Post('adjustments/:id/approve')
  @Permissions(Permission.MANAGE_INVENTORY)
  approveAdjustment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    if (user?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Chỉ có Admin mới được phê duyệt yêu cầu điều chỉnh tồn kho.');
    }
    return this.inventoryService.approveAdjustment(id, user.id);
  }

  @Post('adjustments/:id/reject')
  @Permissions(Permission.MANAGE_INVENTORY)
  rejectAdjustment(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    if (user?.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Chỉ có Admin mới được từ chối yêu cầu điều chỉnh tồn kho.');
    }
    return this.inventoryService.rejectAdjustment(id, user.id);
  }
}
