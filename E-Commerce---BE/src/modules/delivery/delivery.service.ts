import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, MoreThanOrEqual } from 'typeorm';
import { Order, OrderStatus, DeliveryStatus, FulfillmentType, PaymentMethod, PaymentStatus } from '../orders/order.entity';
import { User, UserRole } from '../users/user.entity';
import { DeliveryLog } from './delivery-log.entity';
import { CodRemittance, CodRemittanceStatus } from '../cod/cod-remittance.entity';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(DeliveryLog)
    private readonly deliveryLogsRepository: Repository<DeliveryLog>,
    @InjectRepository(CodRemittance)
    private readonly codRepository: Repository<CodRemittance>,
  ) {}

  async getDashboard(shipper: User) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const myOrders = await this.ordersRepository.find({
      where: { shipperId: shipper.id }
    });

    // 1. Đơn hàng hôm nay
    const assigned = myOrders.filter(o => o.deliveryStatus === DeliveryStatus.ASSIGNED || o.deliveryStatus === DeliveryStatus.PICKING_UP || o.deliveryStatus === DeliveryStatus.PICKED_UP).length;
    const delivering = myOrders.filter(o => o.deliveryStatus === DeliveryStatus.DELIVERING).length;
    const completed = myOrders.filter(o => o.deliveryStatus === DeliveryStatus.DELIVERED && o.deliveryAt && new Date(o.deliveryAt) >= today).length;
    
    // Phase 5: Đếm chính xác số đơn thất bại trong hôm nay từ DeliveryLog
    const failedToday = await this.deliveryLogsRepository.count({
      where: {
        shipperId: shipper.id,
        status: DeliveryStatus.FAILED,
        createdAt: MoreThanOrEqual(today)
      }
    });

    const lastRemit = await this.codRepository.findOne({
      where: { shipperId: shipper.id, status: CodRemittanceStatus.COMPLETED },
      order: { createdAt: 'DESC' }
    });
    const currentDebt = lastRemit ? Number(lastRemit.discrepancy) : 0;

    // Các đơn đã giao thành công, thanh toán bằng COD nhưng chưa được lock vào remit request nào
    // Phase 5: Trừ thẳng phí ship (shippingFee) vào số tiền COD phải nộp. Shipper giữ tiền ship.
    const codHolding = myOrders
      .filter(o => o.deliveryStatus === DeliveryStatus.DELIVERED && 
                  (o.paymentMethod === PaymentMethod.COD || o.paymentMethod === PaymentMethod.CASH) &&
                  o.codRemittanceId === null)
      .reduce((sum, o) => sum + (Number(o.totalAmount || 0) - Number(o.shippingFee || 0)), 0) + currentDebt;

    // 3. Tổng phí ship
    const totalShippingFee = myOrders
      .filter(o => o.deliveryStatus === DeliveryStatus.DELIVERED)
      .reduce((sum, o) => sum + Number(o.shippingFee || 0), 0);
      
    // 4. Thu nhập hôm nay (Tổng phí ship các đơn giao thành công hôm nay)
    const todayIncome = myOrders
      .filter(o => o.deliveryStatus === DeliveryStatus.DELIVERED && o.deliveryAt && new Date(o.deliveryAt) >= today)
      .reduce((sum, o) => sum + Number(o.shippingFee || 0), 0);

    // 5. Tỷ lệ thành công
    const totalFinished = completed + failedToday;
    const successRate = totalFinished > 0 ? Math.round((completed / totalFinished) * 100) : 100;

    return {
      orders: {
        assigned,
        delivering,
        completed,
        failed: failedToday,
      },
      wallet: {
        codHolding,
        totalShippingFee
      },
      codHolding,
      successRate: `${successRate}%`,
    };
  }

  async getPendingDeliveries(shipper: User) {
    const query = this.ordersRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'customer')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('order.branch', 'branch')
      .where('order.fulfillmentType = :fulfillmentType', { fulfillmentType: FulfillmentType.DELIVERY })
      .andWhere('order.orderStatus IN (:...statuses)', { statuses: [OrderStatus.CONFIRMED, OrderStatus.PREPARING] })
      .andWhere('order.shipperId IS NULL');

    if (shipper.branchId) {
      query.andWhere('order.branchId = :branchId', { branchId: shipper.branchId });
    }

    return query.orderBy('order.createdAt', 'ASC').getMany();
  }

  async getMyDeliveries(shipper: User) {
    return this.ordersRepository.find({
      where: [
        { shipperId: shipper.id, deliveryStatus: DeliveryStatus.ASSIGNED },
        { shipperId: shipper.id, deliveryStatus: DeliveryStatus.PICKING_UP },
        { shipperId: shipper.id, deliveryStatus: DeliveryStatus.PICKED_UP },
        { shipperId: shipper.id, deliveryStatus: DeliveryStatus.DELIVERING }
      ],
      relations: {
        user: true,
        items: true,
        branch: true,
      },
      order: { createdAt: 'DESC' }
    });
  }

  async getDeliveryHistory(shipper: User) {
    return this.ordersRepository.find({
      where: [
        { shipperId: shipper.id, deliveryStatus: DeliveryStatus.DELIVERED },
        { shipperId: shipper.id, deliveryStatus: DeliveryStatus.FAILED },
        { shipperId: shipper.id, deliveryStatus: DeliveryStatus.CANCELLED }
      ],
      relations: {
        user: true,
        items: true,
        branch: true,
      },
      order: { deliveryAt: 'DESC' }
    });
  }

  async assignDelivery(orderId: string, shipper: User) {
    const order = await this.ordersRepository.findOne({ where: { id: orderId } });
    
    if (!order) throw new NotFoundException('Order not found');
    if (order.fulfillmentType !== FulfillmentType.DELIVERY) throw new BadRequestException('This order is not for delivery');
    if (order.shipperId) throw new BadRequestException('Order is already assigned to a shipper');
    if (![OrderStatus.CONFIRMED, OrderStatus.PREPARING].includes(order.orderStatus)) throw new BadRequestException(`Cannot assign order in status: ${order.orderStatus}`);
    if (shipper.branchId && order.branchId !== shipper.branchId) throw new ForbiddenException('Cannot assign orders from another branch');

    // Phase 5: Chiêu Tự đặt tự giao (Self-Booking Farming)
    if (order.userId === shipper.id) {
      throw new BadRequestException('Hệ thống phát hiện gian lận: Không thể tự giao đơn do chính mình đặt!');
    }

    // Phase 4: Giới hạn ôm đơn (Max 3)
    const activeOrdersCount = await this.ordersRepository.count({
      where: [
        { shipperId: shipper.id, deliveryStatus: DeliveryStatus.ASSIGNED },
        { shipperId: shipper.id, deliveryStatus: DeliveryStatus.PICKING_UP },
        { shipperId: shipper.id, deliveryStatus: DeliveryStatus.PICKED_UP },
        { shipperId: shipper.id, deliveryStatus: DeliveryStatus.DELIVERING }
      ]
    });

    if (activeOrdersCount >= 3) {
      throw new BadRequestException('Bạn đang giữ quá 3 đơn hàng. Vui lòng giao xong trước khi nhận thêm.');
    }

    // Phase 5: Khóa tài khoản tự động (Auto-Ban do bom hàng >= 3)
    const dashboard = await this.getDashboard(shipper);
    if (dashboard.orders.failed >= 3) {
      throw new BadRequestException('Tài khoản của bạn tạm thời bị khóa nhận đơn vì có quá nhiều đơn giao thất bại trong hôm nay (>= 3 đơn).');
    }

    // Phase 4: Giới hạn nợ COD (Max 2,000,000)
    if (order.paymentMethod === PaymentMethod.COD || order.paymentMethod === PaymentMethod.CASH) {
      if (dashboard.wallet.codHolding >= 2000000) {
        throw new BadRequestException('Vượt quá hạn mức tín dụng COD (2.000.000đ). Vui lòng nộp tiền về quán trước khi nhận thêm đơn COD.');
      }
    }

    const result = await this.ordersRepository.update(
      { id: orderId, shipperId: IsNull() },
      { shipperId: shipper.id, orderStatus: OrderStatus.SHIPPING, deliveryStatus: DeliveryStatus.ASSIGNED }
    );

    if (result.affected === 0) {
      throw new BadRequestException('Order was just assigned to another shipper');
    }

    order.shipperId = shipper.id;
    order.orderStatus = OrderStatus.SHIPPING;
    order.deliveryStatus = DeliveryStatus.ASSIGNED;

    await this.logDeliveryAction(order.id, shipper.id, DeliveryStatus.ASSIGNED, 'Shipper accepted the delivery');
    return order;
  }

  async pickupDelivery(orderId: string, shipper: User) {
    const order = await this.ordersRepository.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.shipperId !== shipper.id) throw new ForbiddenException('You are not assigned to this order');
    if (order.deliveryStatus !== DeliveryStatus.ASSIGNED && order.deliveryStatus !== DeliveryStatus.PICKING_UP) {
      throw new BadRequestException(`Cannot pickup order in status: ${order.deliveryStatus}`);
    }

    order.deliveryStatus = DeliveryStatus.PICKED_UP;
    order.pickupAt = new Date(); // Phase 5: Ghi nhận thời gian lấy hàng để chống Speed Fraud
    const savedOrder = await this.ordersRepository.save(order);
    
    await this.logDeliveryAction(savedOrder.id, shipper.id, DeliveryStatus.PICKED_UP, 'Shipper picked up the order from store');
    return savedOrder;
  }

  async startDelivery(orderId: string, shipper: User) {
    const order = await this.ordersRepository.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.shipperId !== shipper.id) throw new ForbiddenException('You are not assigned to this order');
    if (order.deliveryStatus !== DeliveryStatus.PICKED_UP) {
      throw new BadRequestException(`Cannot start delivery in status: ${order.deliveryStatus}`);
    }

    order.deliveryStatus = DeliveryStatus.DELIVERING;
    const savedOrder = await this.ordersRepository.save(order);
    
    await this.logDeliveryAction(savedOrder.id, shipper.id, DeliveryStatus.DELIVERING, 'Shipper started delivering to customer');
    return savedOrder;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in metres
  }

  async completeDelivery(orderId: string, shipper: User, imageUrl?: string, lat?: number, lng?: number) {
    const order = await this.ordersRepository.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.shipperId !== shipper.id) throw new ForbiddenException('You are not assigned to this order');
    if (order.deliveryStatus !== DeliveryStatus.DELIVERING) {
      throw new BadRequestException(`Cannot complete order in status: ${order.deliveryStatus}`);
    }

    // Phase 4: Proof of Delivery (Bắt buộc có hình ảnh chụp tại nhà khách)
    if (!imageUrl) {
      throw new BadRequestException('Bắt buộc phải có hình ảnh bằng chứng giao hàng (Proof of Delivery).');
    }

    // Phase 5: Tốc độ ánh sáng (Chống gian lận hoàn thành quá nhanh)
    if (order.pickupAt) {
      const timeDiffMinutes = (new Date().getTime() - new Date(order.pickupAt).getTime()) / 60000;
      if (timeDiffMinutes < 3) {
        throw new BadRequestException('Thời gian giao hàng quá ngắn (< 3 phút). Giao dịch đáng ngờ, vui lòng kiểm tra lại!');
      }
    }

    // Phase 4: GPS Geo-fencing (Kiểm tra khoảng cách <= 300m)
    if (lat !== undefined && lng !== undefined && order.shippingLatitude && order.shippingLongitude) {
      const distance = this.calculateDistance(lat, lng, Number(order.shippingLatitude), Number(order.shippingLongitude));
      if (distance > 300) {
        throw new BadRequestException(`Vị trí của bạn cách xa địa điểm giao hàng ${Math.round(distance)} mét (Vượt quá giới hạn 300 mét).`);
      }
    } else if (order.shippingLatitude && order.shippingLongitude) {
      throw new BadRequestException('Yêu cầu cung cấp tọa độ GPS hiện tại để xác thực giao hàng.');
    }

    order.orderStatus = OrderStatus.COMPLETED;
    order.deliveryStatus = DeliveryStatus.DELIVERED;
    order.deliveryAt = new Date();
    
    // Nếu là online payment, đánh dấu paid
    if (order.paymentMethod !== PaymentMethod.COD && order.paymentMethod !== PaymentMethod.CASH) {
      order.paymentStatus = PaymentStatus.PAID;
    }
    // Nếu là COD, tiền này đang được shipper giữ, chờ cashier đối soát.

    const savedOrder = await this.ordersRepository.save(order);
    
    // Save to DeliveryLog with image and GPS
    await this.deliveryLogsRepository.save({
      orderId: savedOrder.id,
      shipperId: shipper.id,
      status: DeliveryStatus.DELIVERED,
      reason: 'Delivery completed successfully',
      imageUrl: imageUrl,
      metadata: lat && lng ? { lat, lng } : null
    });
    return savedOrder;
  }

  async failDelivery(orderId: string, shipper: User, reason: string, lat?: number, lng?: number) {
    if (!reason) {
      throw new BadRequestException('Reason is required for failed deliveries');
    }
    
    const order = await this.ordersRepository.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.shipperId !== shipper.id) throw new ForbiddenException('You are not assigned to this order');
    if (order.deliveryStatus !== DeliveryStatus.DELIVERING) {
      throw new BadRequestException(`Cannot mark as failed in status: ${order.deliveryStatus}`);
    }

    // Phase 5: Chống bom hàng ảo (Yêu cầu phải tới gần khách hàng mới được báo fail)
    if (lat !== undefined && lng !== undefined && order.shippingLatitude && order.shippingLongitude) {
      const distance = this.calculateDistance(lat, lng, Number(order.shippingLatitude), Number(order.shippingLongitude));
      if (distance > 1000) {
        throw new BadRequestException(`Bạn phải tới gần khu vực giao hàng (cách < 1km) mới được phép báo khách không nhận. Khoảng cách hiện tại: ${Math.round(distance)}m.`);
      }
    } else if (order.shippingLatitude && order.shippingLongitude) {
      throw new BadRequestException('Yêu cầu cung cấp tọa độ GPS hiện tại để xác thực báo cáo thất bại.');
    }

    // Tạm thời đánh dấu failed, chờ cửa hàng xử lý tiếp (huỷ đơn hoặc giao lại)
    order.deliveryStatus = DeliveryStatus.FAILED;
    const savedOrder = await this.ordersRepository.save(order);
    
    // Save to DeliveryLog with GPS metadata
    await this.deliveryLogsRepository.save({
      orderId: savedOrder.id,
      shipperId: shipper.id,
      status: DeliveryStatus.FAILED,
      reason: reason,
      metadata: lat && lng ? { lat, lng } : null
    });
    return savedOrder;
  }

  private async logDeliveryAction(orderId: string, shipperId: string, status: DeliveryStatus | null, reason?: string) {
    const log = this.deliveryLogsRepository.create({
      orderId,
      shipperId,
      status,
      reason
    });
    return this.deliveryLogsRepository.save(log);
  }

  async getFailedDeliveries(branchId?: string) {
    const query = this.ordersRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.shipper', 'shipper')
      .leftJoinAndSelect('order.user', 'customer')
      .where('order.deliveryStatus = :status', { status: DeliveryStatus.FAILED });
      
    if (branchId) {
      query.andWhere('order.branchId = :branchId', { branchId });
    }

    return query.orderBy('order.updatedAt', 'DESC').getMany();
  }

  async resolveFailedDelivery(orderId: string, action: 'cancel' | 'reassign') {
    const order = await this.ordersRepository.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.deliveryStatus !== DeliveryStatus.FAILED) {
      throw new BadRequestException('Order is not in FAILED delivery status');
    }

    if (action === 'cancel') {
      order.orderStatus = OrderStatus.CANCELLED;
      order.deliveryStatus = DeliveryStatus.CANCELLED;
      await this.logDeliveryAction(order.id, order.shipperId, DeliveryStatus.CANCELLED, 'Store manager cancelled failed order');
    } else if (action === 'reassign') {
      const oldShipperId = order.shipperId;
      order.orderStatus = OrderStatus.PREPARING;
      order.deliveryStatus = null;
      order.shipperId = null;
      await this.logDeliveryAction(order.id, oldShipperId, null, 'Store manager reassigned failed order');
    } else {
      throw new BadRequestException('Invalid action');
    }

    return this.ordersRepository.save(order);
  }
}
