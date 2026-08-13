import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CartService } from '../cart/cart.service';
import { BranchesService } from '../branches/branches.service';
import { PaymentsService } from '../payments/payments.service';
import { User, UserRole } from '../users/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatusHistory } from './order-status-history.entity';
import { FulfillmentType, Order, OrderStatus, PaymentStatus, DeliveryStatus } from './order.entity';
import { DeliveryLog } from '../delivery/delivery-log.entity';

const PICKUP_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
};

const DELIVERY_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.SHIPPING, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPING]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
};

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    private readonly paymentsService: PaymentsService,
    private readonly cartService: CartService,
    private readonly branchesService: BranchesService,
    private readonly dataSource: DataSource,
  ) {}


  async findAll(): Promise<Order[]> {
    return this.orders.find({
      relations: { user: true, branch: true, items: { product: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(id: string, status: OrderStatus, user: User): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const orderRepository = manager.getRepository(Order);
      const order = await orderRepository.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) {
        throw new BadRequestException('Order not found');
      }

      this.assertCanUpdateOrder(user, order);
      this.assertValidTransition(order, status);

      const previousStatus = order.orderStatus;
      order.orderStatus = status;
      if (status === OrderStatus.COMPLETED) {
        order.paymentStatus = PaymentStatus.PAID;
        order.paidAt = new Date();
      }

      if (status === OrderStatus.CANCELLED && order.shipperId) {
        order.deliveryStatus = DeliveryStatus.CANCELLED as any;
        await manager.getRepository(DeliveryLog).save({
          orderId: order.id,
          shipperId: order.shipperId,
          status: DeliveryStatus.CANCELLED as any,
          note: 'Đơn hàng đã bị hủy bởi quản lý khi đang giao',
        });
      }

      if (status === OrderStatus.CANCELLED && previousStatus !== OrderStatus.CANCELLED) {
        await this.restoreStocks(order.id, order.branchId, manager);
      }

      const savedOrder = await orderRepository.save(order);
      await manager.getRepository(OrderStatusHistory).save({
        orderId: order.id,
        fromStatus: previousStatus,
        toStatus: status,
        changedBy: user.id,
        note: null,
      });
      return savedOrder;
    });
  }

  private assertCanUpdateOrder(user: User, order: Order): void {
    if (user.role === UserRole.ADMIN) return;

    if (!user.branchId || user.branchId !== order.branchId) {
      throw new ForbiddenException('You can only update orders in your assigned branch');
    }

    if (user.role === UserRole.STORE_MANAGER || user.role === UserRole.CASHIER) return;

    if (
      user.role === UserRole.STAFF &&
      [OrderStatus.CONFIRMED, OrderStatus.PREPARING].includes(order.orderStatus)
    ) {
      return;
    }

    throw new ForbiddenException('Staff can only update orders that are being processed');
  }

  private assertValidTransition(order: Order, nextStatus: OrderStatus): void {
    const transitions = order.fulfillmentType === FulfillmentType.PICKUP
      ? PICKUP_TRANSITIONS
      : DELIVERY_TRANSITIONS;
    const allowedStatuses = transitions[order.orderStatus] ?? [];

    if (!allowedStatuses.includes(nextStatus)) {
      throw new BadRequestException(
        `Invalid ${order.fulfillmentType} order status transition: ${order.orderStatus} -> ${nextStatus}`,
      );
    }
  }

  async getDashboardStats(): Promise<any> {
    const formatMoney = (val: number) => new Intl.NumberFormat('vi-VN').format(val) + 'đ';

    // BUG-007 FIX: Run all independent queries in parallel (was serial — 6 round trips)
    const [
      todayOrdersRev,
      todayPosRev,
      todayOrdersCountRes,
      todayPosCountRes,
      productCountRes,
      newCustomersRes,
      weeklyChart,
      recentOrdersDb,
    ] = await Promise.all([
      this.orders.query(`
        SELECT COALESCE(SUM(total_amount), 0) as total FROM orders 
        WHERE order_status = 'completed' AND created_at >= CURRENT_DATE
      `),
      this.orders.query(`
        SELECT COALESCE(SUM(total_amount), 0) as total FROM sales_invoices 
        WHERE invoice_status = 'completed' AND created_at >= CURRENT_DATE
      `),
      this.orders.query(`
        SELECT COUNT(*) as count FROM orders WHERE created_at >= CURRENT_DATE
      `),
      this.orders.query(`
        SELECT COUNT(*) as count FROM sales_invoices WHERE created_at >= CURRENT_DATE
      `),
      this.orders.query(`
        SELECT COUNT(*) as count FROM products WHERE is_active = true
      `),
      this.orders.query(`
        SELECT COUNT(*) as count FROM users 
        WHERE role = 'customer' AND created_at >= CURRENT_DATE
      `),
      this.orders.query(`
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
      `),
      this.orders.find({
        relations: { user: true, items: { product: true } },
        order: { createdAt: 'DESC' },
        take: 5,
      }),
    ]);

    const todayRevenueVal = Number(todayOrdersRev[0]?.total || 0) + Number(todayPosRev[0]?.total || 0);
    const todayOrdersCount = Number(todayOrdersCountRes[0]?.count || 0) + Number(todayPosCountRes[0]?.count || 0);
    const totalProducts = Number(productCountRes[0]?.count || 0);
    const newCustomers = Number(newCustomersRes[0]?.count || 0);

    const stats = [
      { label: "Doanh thu hôm nay", value: formatMoney(todayRevenueVal), delta: "+12%", icon: "DollarSign" },
      { label: "Tổng đơn hàng", value: String(todayOrdersCount), delta: `+${todayOrdersCount} hôm nay`, icon: "ShoppingBag" },
      { label: "Sản phẩm hoạt động", value: String(totalProducts), delta: "3 sắp hết", icon: "Package" },
      { label: "Khách hàng mới", value: String(newCustomers), delta: `+${newCustomers} so hôm qua`, icon: "Users" },
    ];

    const dayLabels: Record<string, string> = {
      '1': 'T2', '2': 'T3', '3': 'T4', '4': 'T5', '5': 'T6', '6': 'T7', '7': 'CN'
    };

    const weekly = weeklyChart.map((row: any) => ({
      day: dayLabels[row.day_num.trim()] || row.day_num,
      revenue: Number(row.revenue),
      orders: Number(row.orders),
    }));

    const recentOrders = recentOrdersDb.map((o: any) => ({
      id: o.orderCode,
      customer: o.user?.fullName || 'Khách hàng',
      items: o.items.map((i: any) => `${i.productName} (${i.variantName})`).join(', '),
      total: formatMoney(Number(o.totalAmount)),
      status: o.orderStatus === OrderStatus.PENDING ? 'Xác nhận' :
              o.orderStatus === OrderStatus.PREPARING ? 'Đang chuẩn bị' :
              o.orderStatus === OrderStatus.SHIPPING ? 'Đang giao' :
              o.orderStatus === OrderStatus.COMPLETED ? 'Hoàn thành' : 'Huỷ',
      time: o.createdAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    }));

    return { stats, weekly, recentOrders };
  }

  async createOrder(userId: string | null, sessionId: string | null, dto: CreateOrderDto): Promise<Order> {

    const {
      branchId: requestedBranchId,
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
      shippingLatitude,
      shippingLongitude,
      shippingAddressPhone,
      shippingRecipientName,
      note,
      couponCode,
      items
    } = dto;
    let branchId = requestedBranchId;
    let calculatedShippingFee = 0;

    try {
      if (!items || items.length === 0) {
        throw new BadRequestException('Đơn hàng phải có ít nhất một sản phẩm');
      }

      if (fulfillmentType === FulfillmentType.DELIVERY) {
        if (shippingLatitude === undefined || shippingLongitude === undefined) {
          throw new BadRequestException('Đơn giao hàng phải có tọa độ nhận hàng');
        }
        const deliveryQuote = await this.branchesService.getDeliveryQuote(
          shippingLatitude,
          shippingLongitude,
          items.map((item: any) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        );
        branchId = deliveryQuote.branch.id;
        calculatedShippingFee = deliveryQuote.shippingFee;
      }

    if (!userId && Number(discountAmount) > 0) {
      throw new BadRequestException('Khách vãng lai không được phép sử dụng mã giảm giá. Vui lòng đăng nhập.');
    }

    // Validate coupon if provided
    let couponId: string | null = null;
    if (couponCode && userId) {
      const couponRes = await this.orders.query(
        `SELECT id, status, expires_at, usage_limit, used_count, per_customer_limit, product_id, categories_id, branch_id, is_approved, is_pending_delete FROM coupons WHERE code = $1`,
        [couponCode.toUpperCase().trim()]
      );
      if (couponRes.length === 0) {
        throw new BadRequestException(`Mã giảm giá "${couponCode}" không hợp lệ.`);
      }
      const coupon = couponRes[0];
      if (coupon.is_pending_delete === true) {
        throw new BadRequestException(`Mã giảm giá "${couponCode}" đã bị yêu cầu xóa và đang chờ duyệt.`);
      }
      if (coupon.is_approved === false) {
        throw new BadRequestException(`Mã giảm giá "${couponCode}" đang chờ quản trị viên phê duyệt.`);
      }
      if (coupon.status !== 'active') {
        throw new BadRequestException(`Mã giảm giá "${couponCode}" không còn hoạt động.`);
      }
      if (new Date(coupon.expires_at) < new Date()) {
        throw new BadRequestException(`Mã giảm giá "${couponCode}" đã hết hạn.`);
      }
      if (coupon.branch_id && coupon.branch_id !== branchId) {
        throw new BadRequestException(`Mã giảm giá "${couponCode}" không áp dụng cho chi nhánh này.`);
      }
      if (coupon.usage_limit !== null && Number(coupon.used_count) >= Number(coupon.usage_limit)) {
        throw new BadRequestException(`Mã giảm giá "${couponCode}" đã đạt giới hạn sử dụng.`);
      }
      // Check product match if coupon restricts to product
      if (coupon.product_id) {
        const matchesProduct = items.some((item: any) => item.productId === coupon.product_id);
        if (!matchesProduct) {
          throw new BadRequestException(`Mã giảm giá "${couponCode}" chỉ áp dụng cho sản phẩm cụ thể.`);
        }
      }
      // Check category match if coupon restricts to category
      if (coupon.categories_id) {
        const itemProductIds = items.map((item: any) => item.productId);
        const productsWithCategory = await this.orders.query(
          `SELECT id, category_id FROM products WHERE id = ANY($1)`,
          [itemProductIds]
        );
        const matchesCategory = productsWithCategory.some((p: any) => p.category_id === coupon.categories_id);
        if (!matchesCategory) {
          throw new BadRequestException(`Mã giảm giá "${couponCode}" chỉ áp dụng cho danh mục sản phẩm cụ thể.`);
        }
      }
      // Check per-customer usage limit
      const perLimit = Number(coupon.per_customer_limit ?? 1);
      if (perLimit > 0) {
        const usageRes = await this.orders.query(
          `SELECT COUNT(*) as count FROM orders WHERE user_id = $1 AND coupon_code = $2 AND order_status != 'cancelled'`,
          [userId, couponCode.toUpperCase().trim()]
        );
        const usedByCustomer = Number(usageRes[0]?.count ?? 0);
        if (usedByCustomer >= perLimit) {
          throw new BadRequestException(`Bạn đã sử dụng mã giảm giá "${couponCode}" rồi. Mỗi tài khoản chỉ được dùng ${perLimit} lần.`);
        }
      }
      couponId = coupon.id;
    }

    // Backend calculation for safety and robustness
    const calculatedSubtotal = items.reduce((sum: number, item: any) => sum + (Number(item.unitPrice) * item.quantity), 0);

    let calculatedDiscount = 0;
    if (couponCode && userId && couponId) {
      const couponRes = await this.orders.query(
        `SELECT discount_type, discount_value, max_discount, min_order_value, product_id, categories_id FROM coupons WHERE id = $1`,
        [couponId]
      );
      if (couponRes.length > 0) {
        const couponDetail = couponRes[0];
        const minOrderVal = Number(couponDetail.min_order_value || 0);
        
        if (calculatedSubtotal >= minOrderVal) {
          // Fetch base variant prices to exclude toppings from discount calculations
          const variantIds = items.map((item: any) => item.variantId);
          const variants = await this.orders.query(
            `SELECT id, price FROM product_variants WHERE id = ANY($1)`,
            [variantIds]
          );
          const basePriceMap = new Map<string, number>();
          for (const v of variants) {
            basePriceMap.set(v.id, Number(v.price || 0));
          }

          let matchingSubtotal = calculatedSubtotal;
          
          if (couponDetail.product_id) {
            const matchingItems = items.filter((item: any) => item.productId === couponDetail.product_id);
            matchingSubtotal = matchingItems.reduce((sum: number, item: any) => sum + ((basePriceMap.get(item.variantId) || Number(item.unitPrice)) * item.quantity), 0);
          } else if (couponDetail.categories_id) {
            const itemProductIds = items.map((item: any) => item.productId);
            const productsWithCategory = await this.orders.query(
              `SELECT id, category_id FROM products WHERE id = ANY($1)`,
              [itemProductIds]
            );
            const matchingProductIds = productsWithCategory
              .filter((p: any) => p.category_id === couponDetail.categories_id)
              .map((p: any) => p.id);
            
            const matchingItems = items.filter((item: any) => matchingProductIds.includes(item.productId));
            matchingSubtotal = matchingItems.reduce((sum: number, item: any) => sum + ((basePriceMap.get(item.variantId) || Number(item.unitPrice)) * item.quantity), 0);
          } else {
            // General or Order-wide coupon - discount is still calculated against product base prices
            matchingSubtotal = items.reduce((sum: number, item: any) => sum + ((basePriceMap.get(item.variantId) || Number(item.unitPrice)) * item.quantity), 0);
          }
          
          if (couponDetail.discount_type === 'percent') {
            calculatedDiscount = Math.round(matchingSubtotal * (Number(couponDetail.discount_value) / 100));
            if (couponDetail.max_discount && Number(couponDetail.max_discount) > 0) {
              calculatedDiscount = Math.min(calculatedDiscount, Number(couponDetail.max_discount));
            }
          } else if (couponDetail.discount_type === 'fixed') {
            calculatedDiscount = Math.min(matchingSubtotal, Number(couponDetail.discount_value));
          }
        }
      }
    }

    const finalSubtotal = subtotal !== undefined ? Number(subtotal) : calculatedSubtotal;
    const finalDiscount = calculatedDiscount > 0 ? calculatedDiscount : Number(discountAmount || 0);
    const finalShippingFee =
      fulfillmentType === FulfillmentType.DELIVERY ? calculatedShippingFee : 0;
    const finalTotalAmount = finalSubtotal - finalDiscount + finalShippingFee;

    // 1. Validate stocks (physical + ingredients)
    const stockUpdates: Array<{
      variantId: string;
      usedPhysical: number;
      usedIngredients: Array<{ ingredientId: string; qty: number }>;
    }> = [];

    for (const item of items) {
      const stockRes = await this.orders.query(
        'SELECT quantity FROM branch_variant_stocks WHERE branch_id = $1 AND variant_id = $2',
        [branchId, item.variantId]
      );
      if (stockRes.length === 0) {
        throw new BadRequestException(`Sản phẩm ${item.productName} hiện không khả dụng tại chi nhánh này (Chưa có dữ liệu kho).`);
      }
      const physicalQty = Number(stockRes[0].quantity || 0);

      // Get recipe ingredients
      const recipe = await this.orders.query(
        'SELECT ingredient_id, quantity_required FROM variant_ingredients WHERE variant_id = $1',
        [item.variantId]
      );

      if (recipe.length === 0) {
        // No recipe: regular physical check
        if (physicalQty < item.quantity) {
          throw new BadRequestException(`Sản phẩm ${item.productName} (${item.variantName}) không đủ số lượng tồn kho (Còn lại: ${physicalQty}).`);
        }
        stockUpdates.push({
          variantId: item.variantId,
          usedPhysical: item.quantity,
          usedIngredients: [],
        });
      } else {
        // Has recipe: calculate max possible from ingredients
        const ingredientIds = recipe.map((ri: any) => ri.ingredient_id);
        const ingStocks = await this.orders.query(
          'SELECT ingredient_id, current_stock FROM branch_ingredient_stocks WHERE branch_id = $1 AND ingredient_id = ANY($2)',
          [branchId, ingredientIds]
        );
        const ingStockMap = new Map<string, number>(
          ingStocks.map((s: any) => [s.ingredient_id, Number(s.current_stock || 0)])
        );

        let maxSellable = Infinity;
        for (const ri of recipe) {
          const availableIngQty = ingStockMap.get(ri.ingredient_id) || 0;
          const reqQty = Number(ri.quantity_required || 0);
          if (reqQty > 0) {
            const possible = Math.floor(availableIngQty / reqQty);
            if (possible < maxSellable) {
              maxSellable = possible;
            }
          }
        }
        if (maxSellable === Infinity) maxSellable = 0;

        const totalAvailable = physicalQty + maxSellable;
        if (totalAvailable < item.quantity) {
          throw new BadRequestException(`Sản phẩm ${item.productName} (${item.variantName}) không đủ số lượng tồn kho (Còn lại: ${totalAvailable}).`);
        }

        const usedPhysical = Math.min(physicalQty, item.quantity);
        const remainingToDeduct = item.quantity - usedPhysical;
        const usedIngredients = [];

        if (remainingToDeduct > 0) {
          for (const ri of recipe) {
            const neededIngQty = Number(ri.quantity_required) * remainingToDeduct;
            usedIngredients.push({
              ingredientId: ri.ingredient_id,
              qty: neededIngQty,
            });
          }
        }

        stockUpdates.push({
          variantId: item.variantId,
          usedPhysical,
          usedIngredients,
        });
      }
    }

    // 2. Perform updates
    for (const update of stockUpdates) {
      if (update.usedPhysical > 0) {
        await this.orders.query(
          'UPDATE branch_variant_stocks SET quantity = quantity - $1 WHERE branch_id = $2 AND variant_id = $3',
          [update.usedPhysical, branchId, update.variantId]
        );
      }
      for (const ingUse of update.usedIngredients) {
        await this.orders.query(
          'UPDATE branch_ingredient_stocks SET current_stock = current_stock - $1 WHERE branch_id = $2 AND ingredient_id = $3',
          [ingUse.qty, branchId, ingUse.ingredientId]
        );
      }
    }

    // BUG-006 FIX: Ensure unique constraint exists (safe migration)
    try {
      await this.orders.query(`ALTER TABLE orders ADD CONSTRAINT orders_order_code_key UNIQUE (order_code)`);
    } catch { /* ignore if exists */ }

    // 2 & 3. Atomic Order Insert with retry loop to prevent race condition on order_code
    let orderId: string;
    let orderCode = '';
    let orderInsert: any[];
    let retries = 0;
    const maxRetries = 5;

    while (retries < maxRetries) {
      const randDigits = Math.floor(100000 + Math.random() * 900000);
      orderCode = `SB${randDigits}`;
      
      try {
        orderInsert = await this.orders.query(`
          INSERT INTO orders (
            order_code, user_id, branch_id, subtotal, discount_amount, shipping_fee, total_amount, 
            payment_method, payment_status, order_status, order_type, fulfillment_type, 
            shipping_address_street, shipping_address_ward, shipping_address_district, shipping_address_province,
            shipping_latitude, shipping_longitude, shipping_address_phone, shipping_recipient_name, note, coupon_code, session_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
          RETURNING id
        `, [
          orderCode, userId || null, branchId, finalSubtotal, finalDiscount, finalShippingFee, finalTotalAmount,
          paymentMethod, 'pending', 'pending', 'online', fulfillmentType,
          shippingAddressStreet, shippingAddressWard, shippingAddressDistrict, shippingAddressProvince,
          shippingLatitude, shippingLongitude, shippingAddressPhone, shippingRecipientName, note,
          couponCode ? couponCode.toUpperCase().trim() : null, sessionId || null
        ]);
        
        orderId = orderInsert[0].id;
        break; // Success!
      } catch (err: any) {
        // Postgres unique constraint violation code is 23505
        if (err.code === '23505' && err.constraint === 'orders_order_code_key') {
          retries++;
          if (retries >= maxRetries) {
            throw new InternalServerErrorException('Không thể tạo mã đơn hàng duy nhất, vui lòng thử lại.');
          }
        } else {
          throw err;
        }
      }
    }

    // 4. BUG-008 FIX: Bulk INSERT order items (was N serial queries)
    if (items.length > 0) {
      const valuePlaceholders = items.map((_: any, i: number) =>
        `($${i * 9 + 1}, $${i * 9 + 2}, $${i * 9 + 3}, $${i * 9 + 4}, $${i * 9 + 5}, $${i * 9 + 6}, $${i * 9 + 7}, $${i * 9 + 8}, $${i * 9 + 9})`
      ).join(', ');
      const flatParams = items.flatMap((item: any) => [
        orderId, item.productId, item.variantId, item.productName, item.variantName,
        item.quantity, item.unitPrice, 0, item.totalPrice
      ]);
      await this.orders.query(
        `INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_name, quantity, unit_price, discount_amount, total_price) VALUES ${valuePlaceholders}`,
        flatParams
      );
    }

    // 5. Increment coupon usedCount
    if (couponId) {
      await this.orders.query(
        `UPDATE coupons SET used_count = used_count + 1 WHERE id = $1`,
        [couponId]
      );
    }

    // 6. Create payment log
    await this.paymentsService.createPayment(orderId, finalTotalAmount, paymentMethod);

    // BUG-003 FIX: Clear cart after order creation
    this.cartService.clearCart(userId || undefined, sessionId || undefined, branchId)
      .catch(err => console.error('Failed to clear cart after order:', err));

      return this.orders.findOne({
        where: { id: orderId },
        relations: { items: { product: true }, branch: true }
      });
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(error.message || error.toString());
    }
  }

  async findMyOrders(userId: string): Promise<Order[]> {
    const orders = await this.orders.find({
      where: { userId },
      relations: { items: { product: true }, branch: true },
      order: { createdAt: 'DESC' }
    });

    if (orders.length > 0) {
      const orderIds = orders.map((o) => o.id);
      const reviews = await this.dataSource.query(
        `SELECT order_id, product_id, comment, rating, image_url, created_at FROM reviews WHERE order_id = ANY($1)`,
        [orderIds]
      );
      const reviewMap = new Map();
      for (const r of reviews) {
        reviewMap.set(`${r.order_id}_${r.product_id}`, r);
      }
      
      for (const order of orders) {
        for (const item of order.items) {
          const review = reviewMap.get(`${order.id}_${item.productId}`);
          if (review) {
            (item as any).isReviewed = true;
            (item as any).review = review;
          } else {
            (item as any).isReviewed = false;
          }
        }
      }
    }

    return orders;
  }

  async findPublicOrder(id: string): Promise<Order> {
    const order = await this.orders.findOne({
      where: { id },
      relations: { items: true, branch: true }
    });
    if (!order) {
      throw new BadRequestException('Order not found');
    }

    const reviews = await this.dataSource.query(
      `SELECT product_id, comment, rating, image_url, created_at FROM reviews WHERE order_id = $1`,
      [id]
    );
    const reviewMap = new Map();
    for (const r of reviews) {
      reviewMap.set(r.product_id, r);
    }
    
    for (const item of order.items) {
      const review = reviewMap.get(item.productId);
      if (review) {
        (item as any).isReviewed = true;
        (item as any).review = review;
      } else {
        (item as any).isReviewed = false;
      }
    }

    return order;
  }

  async cancelMyOrder(id: string, userId: string | null, sessionId: string | null, refundInfo?: any): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const orderRepository = manager.getRepository(Order);
      const order = await orderRepository.findOne({ where: { id } });
      if (!order) {
        throw new BadRequestException('Order not found');
      }

      if (userId) {
        if (order.userId !== userId) {
          throw new BadRequestException('Không có quyền hủy đơn hàng này');
        }
      } else if (sessionId) {
        if (order.sessionId !== sessionId) {
          throw new BadRequestException('Không có quyền hủy đơn hàng này (sai session)');
        }
      } else {
        throw new BadRequestException('Không có quyền hủy đơn hàng này');
      }

      if (order.orderStatus !== OrderStatus.PENDING) {
        throw new BadRequestException('Chỉ có thể hủy đơn hàng đang ở trạng thái chờ xác nhận');
      }

      if (order.paymentStatus === 'paid' as any) {
        if (!refundInfo || !refundInfo.bankName || !refundInfo.accountNumber || !refundInfo.accountName) {
          throw new BadRequestException('Vui lòng cung cấp đầy đủ thông tin ngân hàng để nhận hoàn tiền.');
        }
        order.paymentStatus = 'refund_pending' as any;
        order.refundInfo = refundInfo;
      }

      order.orderStatus = OrderStatus.CANCELLED;
      await this.restoreStocks(order.id, order.branchId, manager);
      await orderRepository.save(order);
      return orderRepository.findOneOrFail({
        where: { id },
        relations: { items: true, branch: true },
      });
    });
  }

  async processRefund(id: string): Promise<Order> {
    const order = await this.orders.findOne({ where: { id } });
    if (!order) {
      throw new BadRequestException('Order not found');
    }
    if (order.paymentStatus !== 'refund_pending' as any) {
      throw new BadRequestException('Đơn hàng không ở trạng thái chờ hoàn tiền');
    }
    
    order.paymentStatus = 'refunded' as any;
    return this.orders.save(order);
  }

  private async restoreStocks(orderId: string, branchId: string, manager: any) {
    const items = await manager.query(
      'SELECT variant_id, quantity FROM order_items WHERE order_id = $1',
      [orderId]
    );
    for (const item of items) {
      const recipe = await manager.query(
        'SELECT ingredient_id, quantity_required FROM variant_ingredients WHERE variant_id = $1',
        [item.variant_id]
      );
      if (recipe.length > 0) {
        for (const ri of recipe) {
          const returnQty = Number(ri.quantity_required) * Number(item.quantity);
          await manager.query(
            'UPDATE branch_ingredient_stocks SET current_stock = current_stock + $1 WHERE branch_id = $2 AND ingredient_id = $3',
            [returnQty, branchId, ri.ingredient_id]
          );
        }
      } else {
        await manager.query(
          'UPDATE branch_variant_stocks SET quantity = quantity + $1 WHERE branch_id = $2 AND variant_id = $3',
          [item.quantity, branchId, item.variant_id]
        );
      }
    }
  }

  async hasPurchasedProduct(userId: string, productId: string): Promise<boolean> {
    const result = await this.orders.query(
      `SELECT 1 FROM orders o 
       INNER JOIN order_items oi ON o.id = oi.order_id 
       WHERE o.user_id = $1 AND oi.product_id = $2 AND o.order_status = 'completed' LIMIT 1`,
      [userId, productId]
    );
    return result.length > 0;
  }
}
