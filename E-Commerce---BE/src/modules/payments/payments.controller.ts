import { Controller, Get, Post, Param, Body, ParseUUIDPipe, UseGuards, Headers } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SepayWebhookDto } from './dto/sepay-webhook.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

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
