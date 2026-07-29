import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from '../branches/branch.entity';
import { OrderItem } from '../orders/order-item.entity';
import { Order, OrderStatus } from '../orders/order.entity';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}

  async getRevenueStats(startDate?: string, endDate?: string) {
    try {
      const query = this.orderRepository
        .createQueryBuilder('order')
        .select("TO_CHAR(order.createdAt, 'YYYY-MM-DD')", 'date')
        .addSelect('SUM(order.totalAmount)', 'revenue')
        .addSelect('COUNT(order.id)', 'orderCount')
        .where('order.orderStatus = :status', { status: OrderStatus.COMPLETED });

      if (startDate) {
        query.andWhere('order.createdAt >= :startDate', { startDate: new Date(startDate) });
      }
      if (endDate) {
        query.andWhere('order.createdAt <= :endDate', { endDate: new Date(endDate) });
      }

      const rawResults = await query
        .groupBy("TO_CHAR(order.createdAt, 'YYYY-MM-DD')")
        .orderBy('date', 'ASC')
        .getRawMany();

      return rawResults.map((r) => ({
        date: r.date,
        revenue: Number(r.revenue || 0),
        orderCount: Number(r.orderCount || 0),
      }));
    } catch {
      return [];
    }
  }

  async getTopSellingProducts(limit: number = 10) {
    try {
      const rawResults = await this.orderItemRepository
        .createQueryBuilder('item')
        .select('item.productName', 'productName')
        .addSelect('SUM(item.quantity)', 'totalSold')
        .addSelect('SUM(item.totalPrice)', 'totalRevenue')
        .groupBy('item.productName')
        .orderBy('"totalSold"', 'DESC')
        .limit(limit)
        .getRawMany();

      return rawResults.map((r) => ({
        productName: r.productName,
        totalSold: Number(r.totalSold || 0),
        totalRevenue: Number(r.totalRevenue || 0),
      }));
    } catch {
      return [];
    }
  }

  async getOrderStatusStats() {
    try {
      const rawResults = await this.orderRepository
        .createQueryBuilder('order')
        .select('order.orderStatus', 'status')
        .addSelect('COUNT(order.id)', 'count')
        .groupBy('order.orderStatus')
        .getRawMany();

      return rawResults.map((r) => ({
        status: r.status,
        count: Number(r.count || 0),
      }));
    } catch {
      return [];
    }
  }

  async getBranchPerformance() {
    try {
      const rawResults = await this.orderRepository
        .createQueryBuilder('order')
        .innerJoinAndSelect('order.branch', 'branch')
        .select('branch.id', 'branchId')
        .addSelect('branch.name', 'branchName')
        .addSelect('COUNT(order.id)', 'totalOrders')
        .addSelect('SUM(CASE WHEN order.orderStatus = :completed THEN order.totalAmount ELSE 0 END)', 'totalRevenue')
        .setParameter('completed', OrderStatus.COMPLETED)
        .groupBy('branch.id')
        .addGroupBy('branch.name')
        .getRawMany();

      return rawResults.map((r) => ({
        branchId: r.branchId,
        branchName: r.branchName,
        totalOrders: Number(r.totalOrders || 0),
        totalRevenue: Number(r.totalRevenue || 0),
      }));
    } catch {
      return [];
    }
  }
}
