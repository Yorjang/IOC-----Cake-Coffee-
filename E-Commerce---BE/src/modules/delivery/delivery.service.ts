import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, DeliveryStatus, FulfillmentType, PaymentMethod, PaymentStatus } from '../orders/order.entity';
import { User, UserRole } from '../users/user.entity';
import { DeliveryLog } from './delivery-log.entity';

@Injectable()
export class DeliveryService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    @InjectRepository(DeliveryLog)
    private readonly deliveryLogsRepository: Repository<DeliveryLog>,
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
    const failed = myOrders.filter(o => o.deliveryStatus === DeliveryStatus.FAILED).length; // Thất bại hôm nay (tạm thời đếm tổng hoặc tuỳ business)

    // 2. Tiền COD đang giữ
    // Các đơn đã giao thành công, thanh toán bằng COD nhưng paymentStatus vẫn là PENDING đối với shipper 
    // (Lưu ý: Nghiệp vụ nộp COD sẽ tách riêng, tạm thời cộng dồn các đơn COD đã giao thành công)
    const codHolding = myOrders
      .filter(o => o.deliveryStatus === DeliveryStatus.DELIVERED && (o.paymentMethod === PaymentMethod.COD || o.paymentMethod === PaymentMethod.CASH))
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0); // Có thể cần trừ đi các yêu cầu nộp COD đã duyệt, ta sẽ query thêm sau.

    // 3. Tổng phí ship
    const totalShippingFee = myOrders
      .filter(o => o.deliveryStatus === DeliveryStatus.DELIVERED)
      .reduce((sum, o) => sum + Number(o.shippingFee || 0), 0);
      
    // 4. Thu nhập hôm nay (Tổng phí ship các đơn giao thành công hôm nay)
    const todayIncome = myOrders
      .filter(o => o.deliveryStatus === DeliveryStatus.DELIVERED && o.deliveryAt && new Date(o.deliveryAt) >= today)
      .reduce((sum, o) => sum + Number(o.shippingFee || 0), 0);

    // 5. Tỷ lệ thành công
    const totalFinished = completed + failed;
    const successRate = totalFinished > 0 ? Math.round((completed / totalFinished) * 100) : 100;

    return {
      orders: {
        assigned,
        delivering,
        completed,
        failed,
      },
      income: {
        today: todayIncome,
        totalShippingFee,
      },
      codHolding,
      successRate: `${successRate}%`,
    };
  }

  async getPendingDeliveries(shipper: User) {
    const query = this.ordersRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'customer')
      .leftJoinAndSelect('order.items', 'item')
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

    order.shipperId = shipper.id;
    order.orderStatus = OrderStatus.SHIPPING;
    order.deliveryStatus = DeliveryStatus.ASSIGNED;
    const savedOrder = await this.ordersRepository.save(order);

    await this.logDeliveryAction(savedOrder.id, shipper.id, DeliveryStatus.ASSIGNED, 'Shipper accepted the delivery');
    return savedOrder;
  }

  async pickupDelivery(orderId: string, shipper: User) {
    const order = await this.ordersRepository.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.shipperId !== shipper.id) throw new ForbiddenException('You are not assigned to this order');
    if (order.deliveryStatus !== DeliveryStatus.ASSIGNED && order.deliveryStatus !== DeliveryStatus.PICKING_UP) {
      throw new BadRequestException(`Cannot pickup order in status: ${order.deliveryStatus}`);
    }

    order.deliveryStatus = DeliveryStatus.PICKED_UP;
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

  async completeDelivery(orderId: string, shipper: User) {
    const order = await this.ordersRepository.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.shipperId !== shipper.id) throw new ForbiddenException('You are not assigned to this order');
    if (order.deliveryStatus !== DeliveryStatus.DELIVERING) {
      throw new BadRequestException(`Cannot complete order in status: ${order.deliveryStatus}`);
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
    
    await this.logDeliveryAction(savedOrder.id, shipper.id, DeliveryStatus.DELIVERED, 'Delivery completed successfully');
    return savedOrder;
  }

  async failDelivery(orderId: string, shipper: User, reason: string) {
    if (!reason) {
      throw new BadRequestException('Reason is required for failed deliveries');
    }
    
    const order = await this.ordersRepository.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.shipperId !== shipper.id) throw new ForbiddenException('You are not assigned to this order');
    if (order.deliveryStatus !== DeliveryStatus.DELIVERING) {
      throw new BadRequestException(`Cannot mark as failed in status: ${order.deliveryStatus}`);
    }

    // Tạm thời đánh dấu failed, chờ cửa hàng xử lý tiếp (huỷ đơn hoặc giao lại)
    order.deliveryStatus = DeliveryStatus.FAILED;
    const savedOrder = await this.ordersRepository.save(order);
    
    await this.logDeliveryAction(savedOrder.id, shipper.id, DeliveryStatus.FAILED, reason);
    return savedOrder;
  }

  private async logDeliveryAction(orderId: string, shipperId: string, status: DeliveryStatus, reason?: string) {
    const log = this.deliveryLogsRepository.create({
      orderId,
      shipperId,
      status,
      reason
    });
    return this.deliveryLogsRepository.save(log);
  }
}
