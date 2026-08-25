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
    if (![UserRole.SHIPPER, UserRole.ADMIN, UserRole.STORE_MANAGER].includes(shipper.role)) {
      throw new ForbiddenException('Only shippers can create remit requests');
    }

    // Check if there is already a pending request
    const pendingRequest = await this.codRepository.findOne({
      where: { shipperId: shipper.id, status: CodRemittanceStatus.PENDING }
    });

    if (pendingRequest) {
      throw new BadRequestException('You already have a pending remit request');
    }
    
    // Find all DELIVERED COD orders that haven't been remitted
    const query = this.ordersRepository.createQueryBuilder('order')
      .where('order.shipperId = :shipperId', { shipperId: shipper.id })
      .andWhere('order.deliveryStatus = :deliveryStatus', { deliveryStatus: DeliveryStatus.DELIVERED })
      .andWhere('order.paymentMethod IN (:...methods)', { methods: [PaymentMethod.COD, PaymentMethod.CASH] })
      .andWhere('order.codRemittanceId IS NULL');

    const unremittedOrders = await query.getMany();

    const unremittedHolding = unremittedOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

    const lastRemit = await this.codRepository.findOne({
      where: { shipperId: shipper.id, status: CodRemittanceStatus.COMPLETED },
      order: { createdAt: 'DESC' }
    });
    const currentDebt = lastRemit ? Number(lastRemit.discrepancy) : 0;

    const currentHolding = unremittedHolding + currentDebt;

    if (currentHolding <= 0) {
      throw new BadRequestException('You do not have any COD amount to remit');
    }

    const remit = this.codRepository.create({
      shipperId: shipper.id,
      totalExpected: currentHolding,
      status: CodRemittanceStatus.PENDING,
    });

    const savedRemit = await this.codRepository.save(remit);

    // Lock the orders to this remittance request
    if (unremittedOrders.length > 0) {
      await this.ordersRepository.update(
        unremittedOrders.map(o => o.id),
        { codRemittanceId: savedRemit.id }
      );
    }

    return savedRemit;
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
