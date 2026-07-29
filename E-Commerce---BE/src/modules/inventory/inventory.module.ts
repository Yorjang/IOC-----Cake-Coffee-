import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { BranchVariantStock } from './branch-variant-stock.entity';
import { BranchIngredientStock } from './entities/branch-ingredient-stock.entity';
import { Ingredient } from './entities/ingredient.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { StockBatch } from './entities/stock-batch.entity';
import { VariantIngredient } from './entities/variant-ingredient.entity';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { PurchaseOrderService } from './purchase-order.service';
import { IngredientService } from './ingredient.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BranchVariantStock,
      Ingredient,
      BranchIngredientStock,
      VariantIngredient,
      StockBatch,
      InventoryTransaction,
      PurchaseOrder,
      PurchaseOrderItem,
    ]),
    UsersModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService, PurchaseOrderService, IngredientService],
  exports: [InventoryService, PurchaseOrderService, IngredientService],
})
export class InventoryModule {}
