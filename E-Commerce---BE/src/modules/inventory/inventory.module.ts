import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchVariantStock } from './branch-variant-stock.entity';
import { Ingredient } from './entities/ingredient.entity';
import { BranchIngredientStock } from './entities/branch-ingredient-stock.entity';
import { VariantIngredient } from './entities/variant-ingredient.entity';
import { StockBatch } from './entities/stock-batch.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { UsersModule } from '../users/users.module';

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
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
