import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('loyalty_tiers')
export class LoyaltyTier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tier_level', type: 'int', unique: true })
  tierLevel: number; // 1, 2, 3, 4, 5

  @Column({ length: 100 })
  name: string; // e.g. Đồng, Bạc, Vàng, Bạch Kim, Kim Cương

  @Column({ name: 'min_spent', type: 'numeric', precision: 14, scale: 0, default: 0 })
  minSpent: number; // Điều kiện tối thiểu về tổng tiền đã đặt/thanh toán

  @Column({ name: 'min_products', type: 'int', default: 0 })
  minProducts: number; // Điều kiện tối thiểu về tổng số lượng sản phẩm đã mua

  @Column({ name: 'discount_percent', type: 'numeric', precision: 5, scale: 2, default: 0 })
  discountPercent: number; // % Giảm giá cho thành viên

  @Column({ name: 'bonus_point_rate', type: 'numeric', precision: 4, scale: 2, default: 1.0 })
  bonusPointRate: number; // Hệ số tích điểm thưởng

  @Column({ length: 50, nullable: true, default: '#8B5CF6' })
  color: string; // Màu sắc đại diện cho Bậc hạng (hex/tailwind)

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
