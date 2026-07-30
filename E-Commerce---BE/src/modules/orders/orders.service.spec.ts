import { describe, expect, it, jest } from '@jest/globals';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { FulfillmentType, Order, OrderStatus, PaymentStatus } from './order.entity';
import { OrdersService } from './orders.service';

describe('OrdersService.updateStatus', () => {
  const orderId = '7e18ddc1-856f-4410-9e98-f41687d479d8';
  const branchId = 'c98709e7-7737-4c48-b017-454b703dcf7a';
  const userId = 'af8fe9f1-5e2f-4140-a15a-8af1a15557df';
  const user = (role: UserRole, assignedBranch: string | null = branchId) =>
    ({ id: userId, role, branchId: assignedBranch } as User);
  const order = (values: Partial<Order> = {}) => ({
    id: orderId,
    branchId,
    fulfillmentType: FulfillmentType.PICKUP,
    orderStatus: OrderStatus.PENDING,
    paymentStatus: PaymentStatus.PENDING,
    ...values,
  } as Order);

  const setup = (currentOrder: Order) => {
    const orderRepository = {
      findOne: jest.fn<() => Promise<Order>>().mockResolvedValue(currentOrder),
      save: jest.fn<(value: Order) => Promise<Order>>().mockImplementation(async (value) => value),
    };
    const historyRepository = {
      save: jest.fn<(value: object) => Promise<void>>().mockResolvedValue(undefined),
    };
    const manager = {
      getRepository: jest.fn((entity: unknown) =>
        entity === Order ? orderRepository : historyRepository),
    };
    const dataSource = {
      transaction: jest.fn((callback: (value: typeof manager) => Promise<Order>) => callback(manager)),
    };
    const service = new OrdersService(
      {} as Repository<Order>, {} as never, {} as never, dataSource as unknown as DataSource,
    );
    return { service, orderRepository, historyRepository };
  };

  it('should save the pickup transition and history in one transaction', async () => {
    const { service, orderRepository, historyRepository } = setup(order());
    const result = await service.updateStatus(
      orderId, OrderStatus.CONFIRMED, user(UserRole.ADMIN, null),
    );

    expect(result.orderStatus).toBe(OrderStatus.CONFIRMED);
    expect(orderRepository.save).toHaveBeenCalledTimes(1);
    expect(historyRepository.save).toHaveBeenCalledWith({
      orderId,
      fromStatus: OrderStatus.PENDING,
      toStatus: OrderStatus.CONFIRMED,
      changedBy: userId,
      note: null,
    });
  });

  it('should reject shipping for a pickup order', async () => {
    const { service, historyRepository } = setup(order({ orderStatus: OrderStatus.PREPARING }));
    await expect(service.updateStatus(
      orderId, OrderStatus.SHIPPING, user(UserRole.ADMIN, null),
    )).rejects.toBeInstanceOf(BadRequestException);
    expect(historyRepository.save).not.toHaveBeenCalled();
  });

  it('should allow staff to update a processing order in their branch', async () => {
    const { service } = setup(order({ orderStatus: OrderStatus.CONFIRMED }));
    await expect(service.updateStatus(
      orderId, OrderStatus.PREPARING, user(UserRole.STAFF),
    )).resolves.toMatchObject({ orderStatus: OrderStatus.PREPARING });
  });

  it('should reject branch staff updating a pending order', async () => {
    const { service } = setup(order());
    await expect(service.updateStatus(
      orderId, OrderStatus.CONFIRMED, user(UserRole.STAFF),
    )).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should reject a manager from another branch', async () => {
    const { service } = setup(order());
    await expect(service.updateStatus(
      orderId,
      OrderStatus.CONFIRMED,
      user(UserRole.STORE_MANAGER, 'b0b83484-4be8-4081-a9ca-c437afac036e'),
    )).rejects.toBeInstanceOf(ForbiddenException);
  });
});
