import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { PaymentsService } from '../payments/payments.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService implements OnModuleInit {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    private readonly paymentsService: PaymentsService,
  ) {}

  async onModuleInit() {
    try {
      await this.seedAll();
    } catch (err) {
      console.error('Lỗi khi chạy database seeder:', err);
    }
  }

  async seedAll() {
    // Make user_id nullable if database schema doesn't allow it yet
    try {
      await this.orders.query('ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL');
    } catch (err) {
      console.warn('Could not alter user_id column to nullable in orders table:', (err as any).message);
    }

    // 1. Check/Create customer user
    let userId = '';
    const existingUsers = await this.orders.query('SELECT id FROM users LIMIT 1');
    if (existingUsers.length > 0) {
      userId = existingUsers[0].id;
    } else {
      const userRes = await this.orders.query(`
        INSERT INTO users (id, full_name, email, role, password_hash, is_active)
        VALUES ('3a8b417c-2b61-46ab-a021-39fa1860c23a', 'Nguyễn Văn Khách', 'khach@gmail.com', 'customer', 'pbkdf2_sha256$260000$dummy', true)
        RETURNING id
      `);
      userId = userRes[0].id;
    }

    // 2. Seed Banners
    const bannersCount = await this.orders.query('SELECT COUNT(*) as count FROM banners');
    if (Number(bannersCount[0].count) === 0) {
      await this.orders.query(`
        INSERT INTO banners (title, image_url, link_url, sort_order, is_active) VALUES
        ('Mùa hè rực rỡ - Giảm 20% các dòng trà quả', 'https://images.unsplash.com/photo-1513530534585-c7b1394c6d51?w=800&fit=crop', '', 1, true),
        ('Combo ngọt ngào - Bánh & Cà phê chỉ từ 49k', 'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?w=800&fit=crop', '', 2, true)
      `);
    }

    // 3. Seed Coupons
    const couponsCount = await this.orders.query('SELECT COUNT(*) as count FROM coupons');
    if (Number(couponsCount[0].count) === 0) {
      await this.orders.query(`
        INSERT INTO coupons (code, name, description, discount_type, discount_value, min_order_value, usage_limit, starts_at, expires_at, status) VALUES
        ('SWEET10', 'Giảm giá ngọt ngào 10%', 'Giảm 10% cho đơn hàng từ 100k', 'percent', 10, 100000, 200, NOW(), NOW() + INTERVAL '30 days', 'active'),
        ('COFFEEFREE', 'Tặng cà phê miễn phí', 'Giảm ngay 30k cho đơn từ 150k', 'fixed', 30000, 150000, 100, NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day', 'expired'),
        ('NEWBIE', 'Chào mừng bạn mới', 'Giảm 15% cho khách hàng mới', 'percent', 15, 0, 500, NOW(), NOW() + INTERVAL '90 days', 'active')
      `);
    }

    // Load branches & product variants for references
    const branches = await this.orders.query('SELECT id FROM branches');
    const variants = await this.orders.query('SELECT id, product_id, variant_name FROM product_variants');

    // 4. Seed Reviews
    const reviewsCount = await this.orders.query('SELECT COUNT(*) as count FROM reviews');
    if (Number(reviewsCount[0].count) === 0 && variants.length > 0) {
      const pId = variants[0].product_id;
      await this.orders.query(`
        INSERT INTO reviews (product_id, user_id, rating, comment, is_verified, is_visible) VALUES
        ('${pId}', '${userId}', 5, 'Cà phê rất ngon và thơm béo, giao hàng cực nhanh.', true, true),
        ('${pId}', '${userId}', 4, 'Bánh tiramisu béo ngậy đắng nhẹ, rất vừa vị.', true, true)
      `);
    }

    // 5. Seed Inventory (Stocks)
    const stocksCount = await this.orders.query('SELECT COUNT(*) as count FROM branch_variant_stocks');
    if (Number(stocksCount[0].count) === 0 && branches.length > 0 && variants.length > 0) {
      for (const branch of branches) {
        for (const variant of variants) {
          await this.orders.query(`
            INSERT INTO branch_variant_stocks (branch_id, variant_id, quantity, reserved_quantity, min_quantity)
            VALUES ('${branch.id}', '${variant.id}', 50, 0, 10)
          `);
        }
      }
    }

    // 6. Seed Orders & OrderItems
    const ordersCount = await this.orders.query('SELECT COUNT(*) as count FROM orders');
    if (Number(ordersCount[0].count) === 0 && branches.length > 0 && variants.length > 0) {
      const order1Id = 'f02b9e6e-34e8-466d-9b51-0987f6e3cda1';
      const order2Id = 'f02b9e6e-34e8-466d-9b51-0987f6e3cda2';
      const order3Id = 'f02b9e6e-34e8-466d-9b51-0987f6e3cda3';

      await this.orders.query(`
        INSERT INTO orders (id, order_code, user_id, branch_id, subtotal, total_amount, payment_method, payment_status, order_status, order_type, fulfillment_type)
        VALUES 
        ('${order1Id}', 'SB001', '${userId}', '${branches[0].id}', 80000, 80000, 'cod', 'pending', 'completed', 'online', 'delivery'),
        ('${order2Id}', 'SB002', '${userId}', '${branches[0].id}', 90000, 90000, 'momo', 'paid', 'shipping', 'online', 'delivery'),
        ('${order3Id}', 'SB003', '${userId}', '${branches[0].id}', 30000, 30000, 'cod', 'pending', 'preparing', 'online', 'pickup')
      `);

      await this.orders.query(`
        INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_name, quantity, unit_price, total_price)
        VALUES
        ('${order1Id}', '${variants[0].product_id}', '${variants[0].id}', 'Cafe Sữa Đá', '${variants[0].variant_name}', 1, 80000, 80000),
        ('${order2Id}', '${variants[0].product_id}', '${variants[0].id}', 'Trà đào cam sả', '${variants[0].variant_name}', 2, 45000, 90000),
        ('${order3Id}', '${variants[0].product_id}', '${variants[0].id}', 'Cafe Đen Đá', '${variants[0].variant_name}', 1, 30000, 30000)
      `);
    }
  }

  async findAll(): Promise<Order[]> {
    return this.orders.find({
      relations: { user: true, branch: true, items: true },
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.orders.findOne({ where: { id } });
    if (!order) {
      throw new BadRequestException('Order not found');
    }
    order.orderStatus = status;
    if (status === OrderStatus.COMPLETED) {
      order.paymentStatus = 'paid' as any;
      order.paidAt = new Date();
    }
    return this.orders.save(order);
  }

  async getDashboardStats(): Promise<any> {
    const todayOrdersRev = await this.orders.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total FROM orders 
      WHERE order_status = 'completed' AND created_at >= CURRENT_DATE
    `);
    const todayPosRev = await this.orders.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total FROM sales_invoices 
      WHERE invoice_status = 'completed' AND created_at >= CURRENT_DATE
    `);
    const todayRevenueVal = Number(todayOrdersRev[0]?.total || 0) + Number(todayPosRev[0]?.total || 0);

    const formatMoney = (val: number) => {
      return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
    };

    const todayRevenue = formatMoney(todayRevenueVal);

    const todayOrdersCountRes = await this.orders.query(`
      SELECT COUNT(*) as count FROM orders WHERE created_at >= CURRENT_DATE
    `);
    const todayPosCountRes = await this.orders.query(`
      SELECT COUNT(*) as count FROM sales_invoices WHERE created_at >= CURRENT_DATE
    `);
    const todayOrdersCount = Number(todayOrdersCountRes[0]?.count || 0) + Number(todayPosCountRes[0]?.count || 0);

    const productCountRes = await this.orders.query(`
      SELECT COUNT(*) as count FROM products WHERE is_active = true
    `);
    const totalProducts = Number(productCountRes[0]?.count || 0);

    const newCustomersRes = await this.orders.query(`
      SELECT COUNT(*) as count FROM users 
      WHERE role = 'customer' AND created_at >= CURRENT_DATE
    `);
    const newCustomers = Number(newCustomersRes[0]?.count || 0);

    const stats = [
      { label: "Doanh thu hôm nay", value: todayRevenue, delta: "+12%", icon: "DollarSign" },
      { label: "Tổng đơn hàng", value: String(todayOrdersCount), delta: `+${todayOrdersCount} hôm nay`, icon: "ShoppingBag" },
      { label: "Sản phẩm hoạt động", value: String(totalProducts), delta: "3 sắp hết", icon: "Package" },
      { label: "Khách hàng mới", value: String(newCustomers), delta: `+${newCustomers} so hôm qua`, icon: "Users" },
    ];

    const weeklyChart = await this.orders.query(`
      WITH days AS (
        SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day')::date as day_date
      )
      SELECT 
        TO_CHAR(d.day_date, 'ID') as day_num,
        COALESCE(SUM(o.total_amount), 0) + COALESCE(SUM(s.total_amount), 0) as revenue,
        COUNT(o.id) + COUNT(s.id) as orders
      FROM days d
      LEFT JOIN orders o ON DATE(o.created_at) = d.day_date AND o.order_status = 'completed'
      LEFT JOIN sales_invoices s ON DATE(s.created_at) = d.day_date AND s.invoice_status = 'completed'
      GROUP BY d.day_date
      ORDER BY d.day_date
    `);

    const dayLabels: Record<string, string> = {
      '1': 'T2', '2': 'T3', '3': 'T4', '4': 'T5', '5': 'T6', '6': 'T7', '7': 'CN'
    };

    const weekly = weeklyChart.map((row: any) => {
      const label = dayLabels[row.day_num.trim()] || row.day_num;
      return {
        day: label,
        revenue: Number(row.revenue),
        orders: Number(row.orders)
      };
    });

    const recentOrdersDb = await this.orders.find({
      relations: { user: true, items: true },
      order: { createdAt: 'DESC' },
      take: 5
    });

    const recentOrders = recentOrdersDb.map(o => ({
      id: o.orderCode,
      customer: o.user?.fullName || 'Khách hàng',
      items: o.items.map(i => `${i.productName} (${i.variantName})`).join(', '),
      total: formatMoney(Number(o.totalAmount)),
      status: o.orderStatus === OrderStatus.PENDING ? 'Xác nhận' :
              o.orderStatus === OrderStatus.PREPARING ? 'Đang chuẩn bị' :
              o.orderStatus === OrderStatus.SHIPPING ? 'Đang giao' :
              o.orderStatus === OrderStatus.COMPLETED ? 'Hoàn thành' : 'Huỷ',
      time: o.createdAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }));

    return { stats, weekly, recentOrders };
  }

  async createOrder(userId: string | null, dto: CreateOrderDto): Promise<Order> {
    const {
      branchId,
      subtotal,
      discountAmount = 0,
      shippingFee = 0,
      totalAmount,
      paymentMethod,
      fulfillmentType,
      shippingAddressStreet,
      shippingAddressWard,
      shippingAddressDistrict,
      shippingAddressProvince,
      shippingAddressPhone,
      shippingRecipientName,
      note,
      items
    } = dto;

    if (!items || items.length === 0) {
      throw new BadRequestException('Đơn hàng phải có ít nhất một sản phẩm');
    }

    if (!userId && Number(discountAmount) > 0) {
      throw new BadRequestException('Khách vãng lai không được phép sử dụng mã giảm giá. Vui lòng đăng nhập.');
    }

    // Backend calculation for safety and robustness
    const calculatedSubtotal = items.reduce((sum: number, item: any) => sum + (Number(item.unitPrice) * item.quantity), 0);

    const finalSubtotal = subtotal !== undefined ? Number(subtotal) : calculatedSubtotal;
    const finalTotalAmount = totalAmount !== undefined ? Number(totalAmount) : (finalSubtotal - Number(discountAmount) + Number(shippingFee));

    // 1. Validate stocks
    for (const item of items) {
      const stockRes = await this.orders.query(
        'SELECT quantity FROM branch_variant_stocks WHERE branch_id = $1 AND variant_id = $2',
        [branchId, item.variantId]
      );
      if (stockRes.length === 0) {
        throw new BadRequestException(`Sản phẩm ${item.productName} không có sẵn tại chi nhánh này.`);
      }
      const availableQty = Number(stockRes[0].quantity);
      if (availableQty < item.quantity) {
        throw new BadRequestException(`Sản phẩm ${item.productName} (${item.variantName}) không đủ số lượng tồn kho (Còn lại: ${availableQty}).`);
      }
    }

    // Update stocks
    for (const item of items) {
      await this.orders.query(
        'UPDATE branch_variant_stocks SET quantity = quantity - $1 WHERE branch_id = $2 AND variant_id = $3',
        [item.quantity, branchId, item.variantId]
      );
    }

    // 2. Generate unique order code
    let orderCode = '';
    let isUnique = false;
    while (!isUnique) {
      const randDigits = Math.floor(100000 + Math.random() * 900000);
      orderCode = `SB${randDigits}`;
      const codeCheck = await this.orders.query('SELECT id FROM orders WHERE order_code = $1', [orderCode]);
      if (codeCheck.length === 0) {
        isUnique = true;
      }
    }

    // 3. Save order
    const orderInsert = await this.orders.query(`
      INSERT INTO orders (
        order_code, user_id, branch_id, subtotal, discount_amount, shipping_fee, total_amount, 
        payment_method, payment_status, order_status, order_type, fulfillment_type, 
        shipping_address_street, shipping_address_ward, shipping_address_district, shipping_address_province,
        shipping_address_phone, shipping_recipient_name, note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING id
    `, [
      orderCode, userId || null, branchId, finalSubtotal, discountAmount, shippingFee, finalTotalAmount,
      paymentMethod, 'pending', 'pending', 'online', fulfillmentType,
      shippingAddressStreet, shippingAddressWard, shippingAddressDistrict, shippingAddressProvince,
      shippingAddressPhone, shippingRecipientName, note
    ]);

    const orderId = orderInsert[0].id;

    // 4. Save order items
    for (const item of items) {
      await this.orders.query(`
        INSERT INTO order_items (
          order_id, product_id, variant_id, product_name, variant_name, quantity, unit_price, discount_amount, total_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        orderId, item.productId, item.variantId, item.productName, item.variantName, item.quantity, item.unitPrice, 0, item.totalPrice
      ]);
    }

    // 5. Create payment log
    await this.paymentsService.createPayment(orderId, finalTotalAmount, paymentMethod);

    return this.orders.findOne({
      where: { id: orderId },
      relations: { items: true, branch: true }
    });
  }

  async findMyOrders(userId: string): Promise<Order[]> {
    return this.orders.find({
      where: { userId },
      relations: { items: true, branch: true },
      order: { createdAt: 'DESC' }
    });
  }

  async findPublicOrder(id: string): Promise<Order> {
    const order = await this.orders.findOne({
      where: { id },
      relations: { items: true, branch: true }
    });
    if (!order) {
      throw new BadRequestException('Order not found');
    }
    return order;
  }
}
