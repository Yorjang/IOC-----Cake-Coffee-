import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CodRemittance, CodRemittanceStatus } from './cod-remittance.entity';
import { User, UserRole } from '../users/user.entity';
import { Order, OrderStatus, DeliveryStatus, PaymentMethod } from '../orders/order.entity';

@Injectable()
export class CodService {
  constructor(
    @InjectRepository(CodRemittance)
    private readonly codRepository: Repository<CodRemittance>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
  ) {}

  async createRemitRequest(shipper: User) {
    if (shipper.role !== UserRole.SHIPPER) {
      throw new ForbiddenException('Only shippers can create remit requests');
    }

    // Lấy các đơn hàng đã giao thành công, thanh toán COD mà chưa được đối soát (chưa thuộc về remit request nào đã hoàn thành)
    // Để đơn giản, ta sẽ tính tổng COD của tất cả các đơn COD đã giao, trừ đi tổng các lần remit đã completed.
    // Hoặc cách tốt hơn: thêm cột codRemittanceId vào Order để đánh dấu đơn này đã được nộp tiền.
    // Tạm thời tính tổng tiền đang giữ bằng tổng COD - tổng tiền đã nộp.
    
    const deliveredOrders = await this.ordersRepository.find({
      where: {
        shipperId: shipper.id,
        deliveryStatus: DeliveryStatus.DELIVERED,
      }
    });

    const totalCodReceived = deliveredOrders
      .filter(o => o.paymentMethod === PaymentMethod.COD || o.paymentMethod === PaymentMethod.CASH)
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    const completedRemits = await this.codRepository.find({
      where: {
        shipperId: shipper.id,
        status: CodRemittanceStatus.COMPLETED
      }
    });

    const totalRemitted = completedRemits.reduce((sum, r) => sum + Number(r.totalActual || 0), 0);
    const currentHolding = totalCodReceived - totalRemitted;

    if (currentHolding <= 0) {
      throw new BadRequestException('You do not have any COD amount to remit');
    }

    // Check if there is already a pending request
    const pendingRequest = await this.codRepository.findOne({
      where: { shipperId: shipper.id, status: CodRemittanceStatus.PENDING }
    });

    if (pendingRequest) {
      throw new BadRequestException('You already have a pending remit request');
    }

    const remit = this.codRepository.create({
      shipperId: shipper.id,
      totalExpected: currentHolding,
      status: CodRemittanceStatus.PENDING,
    });

    return this.codRepository.save(remit);
  }

  async getMyRequests(shipper: User) {
    return this.codRepository.find({
      where: { shipperId: shipper.id },
      relations: { cashier: true },
      order: { createdAt: 'DESC' }
    });
  }

  async getPendingRequests(cashier: User) {
    // Nếu có phân quyền chi nhánh
    const query = this.codRepository.createQueryBuilder('remit')
      .leftJoinAndSelect('remit.shipper', 'shipper')
      .where('remit.status = :status', { status: CodRemittanceStatus.PENDING });
      
    if (cashier.branchId) {
      query.andWhere('shipper.branchId = :branchId', { branchId: cashier.branchId });
    }

    return query.orderBy('remit.createdAt', 'ASC').getMany();
  }

  async confirmRemitRequest(id: string, cashier: User, actualAmount: number, note?: string) {
    const remit = await this.codRepository.findOne({ where: { id }, relations: { shipper: true } });
    if (!remit) {
      throw new NotFoundException('Remittance request not found');
    }

    if (remit.status !== CodRemittanceStatus.PENDING) {
      throw new BadRequestException('Request is already processed');
    }

    remit.cashierId = cashier.id;
    remit.totalActual = actualAmount;
    remit.discrepancy = Number(remit.totalExpected) - actualAmount;
    remit.status = CodRemittanceStatus.COMPLETED;
    if (note) remit.note = note;

    return this.codRepository.save(remit);
  }
}
