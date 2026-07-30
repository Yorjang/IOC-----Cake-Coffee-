import { Body, Controller, Get, Headers, Ip, Param, ParseUUIDPipe, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateVnpayPaymentDto } from './dto/create-vnpay-payment.dto';
import { SepayWebhookDto } from './dto/sepay-webhook.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('vnpay/:orderId/create')
  @Public()
  createVnpayPayment(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: CreateVnpayPaymentDto,
    @Ip() ipAddress: string,
  ) {
    return this.paymentsService.createVnpayPaymentUrl(orderId, ipAddress, dto);
  }

  @Get('vnpay/ipn')
  @Public()
  async handleVnpayIpn(
    @Query() query: Record<string, string | string[]>,
    @Res() response: Response,
  ): Promise<void> {
    response.json(await this.paymentsService.processVnpayIpn(query));
  }

  @Get('vnpay/return')
  @Public()
  async handleVnpayReturn(
    @Query() query: Record<string, string | string[]>,
    @Res() response: Response,
  ): Promise<void> {
    // ReturnUrl is also reconciled for local development where VNPay cannot reach
    // a localhost IPN. Signature, amount and transaction reference are still verified.
    await this.paymentsService.processVnpayIpn(query);
    response.redirect(this.paymentsService.createVnpayReturnRedirect(query));
  }

  // Public/mock callback webhook for payment gateways (e.g. Momo, VNPay, ZaloPay, Bank Transfer)
  @Post('callback/:gateway')
  handleCallback(
    @Param('gateway') gateway: string,
    @Body('orderId', ParseUUIDPipe) orderId: string,
    @Body('transactionId') transactionId: string,
    @Body('status') status: 'paid' | 'failed',
    @Body('payload') payload: any,
  ) {
    return this.paymentsService.processCallback(orderId, gateway, transactionId, status, payload);
  }

  // Sepay Bank Transfer Webhook integration
  @Post('webhook/sepay')
  @Public()
  handleSepayWebhook(
    @Headers('authorization') authHeader: string,
    @Body() body: SepayWebhookDto,
  ) {
    return this.paymentsService.processSepayWebhook(authHeader, body);
  }

  // Generate VietQR code for Bank Transfer payments
  @Get('qr/:orderId')
  @UseGuards(JwtAuthGuard)
  @Public()
  generateQr(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.paymentsService.generateQrCode(orderId);
  }
}
