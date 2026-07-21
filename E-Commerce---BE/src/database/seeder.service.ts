import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SeederService implements OnModuleInit {
  private readonly logger = new Logger(SeederService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      await this.seedAll();
    } catch (err) {
      this.logger.error('Lỗi khi chạy database seeder:', err);
    }
  }

  async seedAll() {
    // Make user_id nullable if database schema doesn't allow it yet
    try {
      await this.dataSource.query('ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL');
    } catch (err) {
      this.logger.warn('Could not alter user_id column to nullable in orders table: ' + (err as any).message);
    }

    // 1. Check/Create customer user
    let userId = '';
    const existingUsers = await this.dataSource.query('SELECT id FROM users LIMIT 1');
    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
    } else {
      const userRes = await this.dataSource.query(`
        INSERT INTO users (id, full_name, email, role, password_hash, is_active)
        VALUES ('3a8b417c-2b61-46ab-a021-39fa1860c23a', 'Nguyễn Văn Khách', 'khach@gmail.com', 'customer', 'pbkdf2_sha256$260000$dummy', true)
        RETURNING id
      `);
      userId = userRes[0].id;
    }

    // 2. Seed Banners
    const bannersCount = await this.dataSource.query('SELECT COUNT(*) as count FROM banners');
    if (Number(bannersCount[0].count) === 0) {
      await this.dataSource.query(`
        INSERT INTO banners (title, image_url, link_url, sort_order, is_active) VALUES
        ('Mùa hè rực rỡ - Giảm 20% các dòng trà quả', 'https://images.unsplash.com/photo-1513530534585-c7b1394c6d51?w=800&fit=crop', '', 1, true),
        ('Combo ngọt ngào - Bánh & Cà phê chỉ từ 49k', 'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?w=800&fit=crop', '', 2, true)
      `);
    }

    // 3. Seed Coupons
    const couponsCount = await this.dataSource.query('SELECT COUNT(*) as count FROM coupons');
    if (Number(couponsCount[0].count) === 0) {
      await this.dataSource.query(`
        INSERT INTO coupons (code, name, description, discount_type, discount_value, min_order_value, usage_limit, starts_at, expires_at, status) VALUES
        ('SWEET10', 'Giảm giá ngọt ngào 10%', 'Giảm 10% cho đơn hàng từ 100k', 'percent', 10, 100000, 200, NOW(), NOW() + INTERVAL '30 days', 'active'),
        ('COFFEEFREE', 'Tặng cà phê miễn phí', 'Giảm ngay 30k cho đơn từ 150k', 'fixed', 30000, 150000, 100, NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day', 'expired'),
        ('NEWBIE', 'Chào mừng bạn mới', 'Giảm 15% cho khách hàng mới', 'percent', 15, 0, 500, NOW(), NOW() + INTERVAL '90 days', 'active')
      `);
    }

    // Load branches & product variants for references
    const branches = await this.dataSource.query('SELECT id FROM branches');
    const variants = await this.dataSource.query('SELECT id, product_id, variant_name FROM product_variants');

    // 4. Seed Reviews
    const reviewsCount = await this.dataSource.query('SELECT COUNT(*) as count FROM reviews');
    if (Number(reviewsCount[0].count) === 0 && variants.length > 0) {
      const pId = variants[0].product_id;
      await this.dataSource.query(`
        INSERT INTO reviews (product_id, user_id, rating, comment, is_verified, is_visible) VALUES
        ('${pId}', '${userId}', 5, 'Cà phê rất ngon và thơm béo, giao hàng cực nhanh.', true, true),
        ('${pId}', '${userId}', 4, 'Bánh tiramisu béo ngậy đắng nhẹ, rất vừa vị.', true, true)
      `);
    }

    // 5. Seed Inventory (Stocks)
    const stocksCount = await this.dataSource.query('SELECT COUNT(*) as count FROM branch_variant_stocks');
    if (Number(stocksCount[0].count) === 0 && branches.length > 0 && variants.length > 0) {
      for (const branch of branches) {
        for (const variant of variants) {
          await this.dataSource.query(`
            INSERT INTO branch_variant_stocks (branch_id, variant_id, quantity, reserved_quantity, min_quantity)
            VALUES ('${branch.id}', '${variant.id}', 50, 0, 10)
          `);
        }
      }
    }

    // 6. Seed Orders & OrderItems
    const ordersCount = await this.dataSource.query('SELECT COUNT(*) as count FROM orders');
    if (Number(ordersCount[0].count) === 0 && branches.length > 0 && variants.length > 0) {
      const order1Id = 'f02b9e6e-34e8-466d-9b51-0987f6e3cda1';
      const order2Id = 'f02b9e6e-34e8-466d-9b51-0987f6e3cda2';
      const order3Id = 'f02b9e6e-34e8-466d-9b51-0987f6e3cda3';

      await this.dataSource.query(`
        INSERT INTO orders (id, order_code, user_id, branch_id, subtotal, total_amount, payment_method, payment_status, order_status, order_type, fulfillment_type)
        VALUES 
        ('${order1Id}', 'SB001', '${userId}', '${branches[0].id}', 80000, 80000, 'cod', 'pending', 'completed', 'online', 'delivery'),
        ('${order2Id}', 'SB002', '${userId}', '${branches[0].id}', 90000, 90000, 'momo', 'paid', 'shipping', 'online', 'delivery'),
        ('${order3Id}', 'SB003', '${userId}', '${branches[0].id}', 30000, 30000, 'cod', 'pending', 'preparing', 'online', 'pickup')
      `);

      await this.dataSource.query(`
        INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_name, quantity, unit_price, total_price)
        VALUES
        ('${order1Id}', '${variants[0].product_id}', '${variants[0].id}', 'Cafe Sữa Đá', '${variants[0].variant_name}', 1, 80000, 80000),
        ('${order2Id}', '${variants[0].product_id}', '${variants[0].id}', 'Trà đào cam sả', '${variants[0].variant_name}', 2, 45000, 90000),
        ('${order3Id}', '${variants[0].product_id}', '${variants[0].id}', 'Cafe Đen Đá', '${variants[0].variant_name}', 1, 30000, 30000)
      `);
    }
  }
}
