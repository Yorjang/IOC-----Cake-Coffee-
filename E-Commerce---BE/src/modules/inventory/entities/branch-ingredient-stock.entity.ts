import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Branch } from '../../branches/branch.entity';
import { Ingredient } from './ingredient.entity';

@Entity('branch_ingredient_stocks')
@Index(['branchId', 'ingredientId'], { unique: true })
export class BranchIngredientStock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'branch_id', type: 'uuid' })
  branchId: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'ingredient_id', type: 'uuid' })
  ingredientId: string;

  @ManyToOne(() => Ingredient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: Ingredient;

  @Column({ type: 'numeric', precision: 12, scale: 3, default: 0 })
  quantity: number;

  @Column({ name: 'min_stock_level', type: 'numeric', precision: 12, scale: 3, default: 0 })
  minStockLevel: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
