import { Injectable, BadRequestException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentGateway, PaymentStatus } from './payment.entity';
import { Order, OrderStatus } from '../orders/order.entity';
import { SepayWebhookDto } from './dto/sepay-webhook.dto';
import { ConfigService } from '@nestjs/config';
import { CreateVnpayPaymentDto } from './dto/create-vnpay-payment.dto';
import { buildVnpayQuery, signVnpay, verifyVnpaySignature, VnpayParameters } from './vnpay-signature';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly payments: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    private readonly configService: ConfigService,
  ) { }

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

  async createVnpayPaymentUrl(orderId: string, ipAddress: string, dto: CreateVnpayPaymentDto) {
    const order = await this.orders.findOne({ where: { id: orderId } });
    if (!order || order.paymentMethod !== ('vnpay' as typeof order.paymentMethod)) {
      throw new BadRequestException('Đơn hàng không sử dụng phương thức thanh toán VNPay.');
    }
    if (order.paymentStatus === ('paid' as typeof order.paymentStatus)) {
      throw new BadRequestException('Đơn hàng đã được thanh toán.');
    }

    const payment = await this.payments.findOne({
      where: { orderId, gateway: PaymentGateway.VNPAY },
      order: { createdAt: 'DESC' },
    });
    if (!payment) throw new BadRequestException('Không tìm thấy giao dịch VNPay của đơn hàng.');

    const previousAttempt = payment.gatewayResponse as { paymentUrl?: string; expiresAt?: string } | null;
    if (
      payment.status === PaymentStatus.PENDING
      && previousAttempt?.paymentUrl
      && previousAttempt.expiresAt
      && new Date(previousAttempt.expiresAt).getTime() > Date.now()
    ) {
      return previousAttempt;
    }

    const { tmnCode, hashSecret, paymentUrl, returnUrl } = this.getVnpayConfig();
    const now = new Date();
    const transactionReference = `${orderId.replace(/-/g, '')}${Date.now()}`;
    const parameters: VnpayParameters = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Amount: String(Math.round(Number(order.totalAmount) * 100)),
      vnp_CreateDate: this.formatVnpayDate(now),
      vnp_CurrCode: 'VND',
      vnp_IpAddr: this.normalizeIpAddress(ipAddress),
      vnp_Locale: dto.locale ?? 'vn',
      vnp_OrderInfo: `Thanh toan don hang ${order.orderCode}`,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: returnUrl,
      vnp_TxnRef: transactionReference,
      vnp_ExpireDate: this.formatVnpayDate(new Date(now.getTime() + 15 * 60 * 1000)),
    };
    if (dto.bankCode) parameters.vnp_BankCode = dto.bankCode;

    payment.transactionId = transactionReference;
    payment.status = PaymentStatus.PENDING;
    const secureHash = signVnpay(parameters, hashSecret);
    const result = {
      paymentUrl: `${paymentUrl}?${buildVnpayQuery(parameters)}&vnp_SecureHash=${secureHash}`,
      expiresAt: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
    };
    payment.gatewayResponse = { ...result, initiatedAt: now.toISOString() };
    await this.payments.save(payment);
    return result;
  }

  async processVnpayIpn(rawQuery: Record<string, string | string[]>) {
    try {
      const query = this.normalizeVnpayQuery(rawQuery);
      const { hashSecret } = this.getVnpayConfig();
      if (!verifyVnpaySignature(query, hashSecret)) return { RspCode: '97', Message: 'Invalid signature' };

      const orderId = this.orderIdFromVnpayReference(query.vnp_TxnRef);
      if (!orderId) return { RspCode: '01', Message: 'Order not found' };

      return this.payments.manager.transaction(async (manager) => {
        const orderRepository = manager.getRepository(Order);
        const paymentRepository = manager.getRepository(Payment);
        const order = await orderRepository.findOne({ where: { id: orderId } });
        const payment = await paymentRepository.findOne({
          where: { orderId, gateway: PaymentGateway.VNPAY },
          order: { createdAt: 'DESC' },
        });

        if (!order || !payment) {
          return { RspCode: '01', Message: 'Order not found' };
        }
        if (Number(query.vnp_Amount) !== Math.round(Number(order.totalAmount) * 100)) {
          return { RspCode: '04', Message: 'Invalid amount' };
        }
        if (payment.status === PaymentStatus.PAID) {
          return { RspCode: '02', Message: 'Order already confirmed' };
        }
        if (payment.transactionId !== query.vnp_TxnRef) {
          return { RspCode: '01', Message: 'Order not found' };
        }

        const successful = query.vnp_ResponseCode === '00' && query.vnp_TransactionStatus === '00';
        payment.status = successful ? PaymentStatus.PAID : PaymentStatus.FAILED;
        payment.paidAt = successful ? new Date() : null;
        payment.gatewayResponse = query;
        if (successful) payment.transactionId = `VNPAY-${query.vnp_TransactionNo}`;

        order.paymentStatus = successful ? ('paid' as typeof order.paymentStatus) : ('failed' as typeof order.paymentStatus);
        if (successful) order.orderStatus = OrderStatus.CONFIRMED;
        await paymentRepository.save(payment);
        await orderRepository.save(order);
        return { RspCode: '00', Message: 'Confirm success' };
      });
    } catch {
      return { RspCode: '99', Message: 'Unknown error' };
    }
  }

  createVnpayReturnRedirect(rawQuery: Record<string, string | string[]>): string {
    const query = this.normalizeVnpayQuery(rawQuery);
    const { hashSecret, frontendReturnUrl } = this.getVnpayConfig();
    const orderId = this.orderIdFromVnpayReference(query.vnp_TxnRef);
    const valid = verifyVnpaySignature(query, hashSecret);
    const successful = valid && query.vnp_ResponseCode === '00' && query.vnp_TransactionStatus === '00';
    const redirectUrl = new URL(frontendReturnUrl);
    redirectUrl.searchParams.set('vnpayReturn', '1');
    if (orderId) redirectUrl.searchParams.set('orderId', orderId);
    redirectUrl.searchParams.set('status', successful ? 'success' : 'failed');
    redirectUrl.searchParams.set('responseCode', query.vnp_ResponseCode ?? 'invalid');
    return redirectUrl.toString();
  }

  private getVnpayConfig() {
    const tmnCode = this.configService.get<string>('VNPAY_TMN_CODE');
    const hashSecret = this.configService.get<string>('VNPAY_HASH_SECRET');
    const paymentUrl = this.configService.get<string>('VNPAY_PAYMENT_URL')
      ?? 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const returnUrl = this.configService.get<string>('VNPAY_RETURN_URL');
    const frontendReturnUrl = this.configService.get<string>('VNPAY_FRONTEND_RETURN_URL')
      ?? 'http://localhost:5173/thanh-toan-vnpay';
    if (!tmnCode || !hashSecret || !returnUrl) {
      throw new InternalServerErrorException('Thiếu cấu hình VNPAY_TMN_CODE, VNPAY_HASH_SECRET hoặc VNPAY_RETURN_URL.');
    }
    return { tmnCode, hashSecret, paymentUrl, returnUrl, frontendReturnUrl };
  }

  private normalizeVnpayQuery(query: Record<string, string | string[]>): VnpayParameters {
    return Object.fromEntries(
      Object.entries(query)
        .filter(([key]) => key.startsWith('vnp_'))
        .map(([key, value]) => [key, Array.isArray(value) ? value[0] : String(value)]),
    );
  }

  private orderIdFromVnpayReference(reference = ''): string | null {
    const compactUuid = reference.slice(0, 32);
    if (!/^[a-fA-F0-9]{32}$/.test(compactUuid)) return null;
    return `${compactUuid.slice(0, 8)}-${compactUuid.slice(8, 12)}-${compactUuid.slice(12, 16)}-${compactUuid.slice(16, 20)}-${compactUuid.slice(20)}`;
  }

  private normalizeIpAddress(ipAddress: string): string {
    if (!ipAddress || ipAddress === '::1') return '127.0.0.1';
    return ipAddress.replace(/^::ffff:/, '');
  }

  private formatVnpayDate(date: Date): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(date);
    const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
    return `${value('year')}${value('month')}${value('day')}${value('hour')}${value('minute')}${value('second')}`;
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
    const expectedKey = this.configService.get<string>('SEPAY_WEBHOOK_API_KEY') || this.configService.get<string>('SEPAY_API_KEY');
    if (!expectedKey) throw new InternalServerErrorException('SEPAY_WEBHOOK_API_KEY is not configured!');

    // 1. Verify API Key (Case-insensitive for 'apikey')
    const authHeaderLower = authHeader?.toLowerCase() || '';
    if (!authHeaderLower.startsWith('apikey ')) {
      throw new UnauthorizedException('Chữ ký/API Key của SePay không hợp lệ (Thiếu tiền tố Apikey).');
    }
    const token = authHeader.substring(7).trim();
    if (token !== expectedKey) {
      throw new UnauthorizedException('Chữ ký/API Key của SePay không hợp lệ (Sai mật khẩu).');
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

    // 3. Extract order code (SBxxxxxx)
    const textToMatch = `${code || ''} ${content || ''}`.replace(/\s+/g, '');
    const match = textToMatch.match(/sb\d{6}/i);
    if (!match) {
      return { success: false, message: 'Không tìm thấy mã đơn hàng SBxxxxxx trong nội dung chuyển khoản.' };
    }
    // Extract the SBxxxxxx part
    const orderCode = match[0].toUpperCase();

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

    const bankId = this.configService.get<string>('BANK_ID');
    const bankAccount = this.configService.get<string>('BANK_ACCOUNT');
    const bankAccountName = this.configService.get<string>('BANK_ACCOUNT_NAME');
    if (!bankId || !bankAccount || !bankAccountName) {
      throw new InternalServerErrorException('Bank configuration (BANK_ID, BANK_ACCOUNT, BANK_ACCOUNT_NAME) is not set in .env!');
    }
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
