import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentGateway, PaymentStatus } from './payment.entity';
import { Order, OrderStatus } from '../orders/order.entity';
import { SepayWebhookDto } from './dto/sepay-webhook.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
  ) {}

  async createPayment(orderId: string, amount: number, gateway: string): Promise<Payment> {
    // Map string gateway to PaymentGateway enum
    let paymentGateway: PaymentGateway;
    if (gateway === 'momo') paymentGateway = PaymentGateway.MOMO;
    else if (gateway === 'vnpay') paymentGateway = PaymentGateway.VNPAY;
    else if (gateway === 'zalopay') paymentGateway = PaymentGateway.ZALOPAY;
    else if (gateway === 'bank_transfer') paymentGateway = PaymentGateway.BANK_TRANSFER;
    else if (gateway === 'cash' || gateway === 'cod') paymentGateway = PaymentGateway.CASH;
    else {
      throw new BadRequestException(`Cổng thanh toán không hợp lệ: ${gateway}`);
    }

    const payment = this.payments.create({
      orderId,
      amount,
      gateway: paymentGateway,
      status: PaymentStatus.PENDING,
    });

    return this.payments.save(payment);
  }

  async processCallback(
    orderId: string,
    gateway: string,
    transactionId: string,
    status: 'paid' | 'failed',
    payload: any,
  ): Promise<Payment> {
    // Find the latest pending payment for this order
    const payment = await this.payments.findOne({
      where: { orderId, status: PaymentStatus.PENDING },
      order: { createdAt: 'DESC' },
    });

    if (!payment) {
      throw new BadRequestException('Không tìm thấy giao dịch thanh toán chờ xử lý cho đơn hàng này.');
    }

    payment.transactionId = transactionId;
    payment.status = status === 'paid' ? PaymentStatus.PAID : PaymentStatus.FAILED;
    payment.gatewayResponse = payload;
    payment.paidAt = status === 'paid' ? new Date() : null;

    const savedPayment = await this.payments.save(payment);

    // Update associated order status
    const order = await this.orders.findOne({ where: { id: orderId } });
    if (order) {
      order.paymentStatus = status === 'paid' ? ('paid' as any) : ('failed' as any);
      if (status === 'paid') {
        order.orderStatus = OrderStatus.CONFIRMED; // Move to confirmed once paid
      }
      await this.orders.save(order);
    }

    return savedPayment;
  }

  async processSepayWebhook(authHeader: string, body: SepayWebhookDto) {
    const expectedKey = process.env.SEPAY_API_KEY || 'sepay_secret_key_123';
    
    // 1. Verify API Key
    if (!authHeader || !authHeader.startsWith('Apikey ') || authHeader.slice(7) !== expectedKey) {
      throw new UnauthorizedException('Chữ ký/API Key của SePay không hợp lệ.');
    }

    const { id, gateway, code, content, transferAmount, transferType } = body;

    // We only process incoming money transfers ('in')
    if (transferType !== 'in') {
      return { success: true, message: 'Chỉ xử lý giao dịch nhận tiền.' };
    }

    // 2. Prevent duplicate processing (Idempotency)
    const existingPayment = await this.payments.findOne({
      where: { transactionId: String(id) }
    });
    if (existingPayment) {
      return { success: true, message: 'Giao dịch đã được xử lý từ trước.' };
    }

    // 3. Extract order code (cakeandcoffeeSBxxxxxx)
    // Remove spaces from the content to handle cases where banks might add extra spaces
    const textToMatch = `${code || ''} ${content || ''}`.replace(/\s+/g, '');
    const match = textToMatch.match(/cakeandcoffeesb\d{6}/i);
    if (!match) {
      return { success: false, message: 'Không tìm thấy cú pháp cakeandcoffeeSBxxxxxx trong nội dung chuyển khoản.' };
    }
    // Extract the SBxxxxxx part
    const orderCode = match[0].match(/sb\d{6}/i)![0].toUpperCase();

    // 4. Find order
    const order = await this.orders.findOne({ where: { orderCode } });
    if (!order) {
      throw new BadRequestException(`Không tìm thấy đơn hàng tương ứng với mã ${orderCode}.`);
    }

    // 5. Verify amount
    if (Number(transferAmount) < Number(order.totalAmount)) {
      throw new BadRequestException(
        `Số tiền thanh toán (${transferAmount}) nhỏ hơn số tiền cần thanh toán của đơn hàng (${order.totalAmount}).`
      );
    }

    // 6. Find or create payment log
    let payment = await this.payments.findOne({
      where: { orderId: order.id, status: PaymentStatus.PENDING },
      order: { createdAt: 'DESC' }
    });

    if (!payment) {
      payment = this.payments.create({
        orderId: order.id,
        amount: Number(transferAmount),
        gateway: PaymentGateway.BANK_TRANSFER,
        status: PaymentStatus.PENDING
      });
    }

    // 7. Update payment log
    payment.transactionId = String(id);
    payment.status = PaymentStatus.PAID;
    payment.gatewayResponse = body;
    payment.paidAt = new Date();
    await this.payments.save(payment);

    // 8. Update order status
    order.paymentStatus = 'paid' as any;
    order.orderStatus = OrderStatus.CONFIRMED;
    await this.orders.save(order);

    return { success: true, message: 'Thanh toán đơn hàng thành công qua SePay.' };
  }

  async generateQrCode(orderId: string) {
    const order = await this.orders.findOne({ where: { id: orderId } });
    if (!order) {
      throw new BadRequestException('Đơn hàng không tồn tại.');
    }

    const bankId = process.env.BANK_ID || 'MB';
    const bankAccount = process.env.BANK_ACCOUNT || '999988889999';
    const bankAccountName = process.env.BANK_ACCOUNT_NAME || 'TIEM BANH CAKE COFFEE';
    const transferContent = `cakeandcoffee${order.orderCode}`;

    const qrUrl = `https://qr.sepay.vn/img?acc=${bankAccount}&bank=${bankId}&amount=${order.totalAmount}&des=${transferContent}`;

    return {
      orderId: order.id,
      orderCode: order.orderCode,
      totalAmount: order.totalAmount,
      bankId,
      bankAccount,
      bankAccountName,
      qrUrl,
      paymentContent: order.orderCode,
      transferContent: transferContent,
    };
  }
}
