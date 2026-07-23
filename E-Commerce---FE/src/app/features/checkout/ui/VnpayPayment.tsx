import { CheckCircle2, CircleX, Clock3, Loader2, ShieldCheck } from 'lucide-react';
import { Btn } from '../../../components/shared';
import { VIEW_KEYS } from '../../../../config/appConfig';
import { useVnpayPayment } from '../hooks/useVnpayPayment';

interface VnpayPaymentProps {
  orderId: string;
  orderCode: string;
  setView: (view: string, data?: string) => void;
}

export function VnpayPayment({ orderId, orderCode, setView }: VnpayPaymentProps) {
  const { status, responseCode } = useVnpayPayment(orderId);
  const content = {
    redirecting: { icon: <Loader2 className="animate-spin" size={42} />, title: 'Đang chuyển đến VNPay', description: 'Vui lòng không đóng hoặc tải lại trang này.', tone: 'text-blue-600 bg-blue-50' },
    pending: { icon: <Clock3 size={42} />, title: 'VNPay đang xác nhận giao dịch', description: 'Hệ thống đang chờ thông báo IPN an toàn từ VNPay.', tone: 'text-amber-600 bg-amber-50' },
    paid: { icon: <CheckCircle2 size={42} />, title: 'Thanh toán VNPay thành công', description: 'Đơn hàng đã được xác nhận và chuyển sang xử lý.', tone: 'text-green-600 bg-green-50' },
    failed: { icon: <CircleX size={42} />, title: 'Thanh toán chưa thành công', description: `Giao dịch bị hủy hoặc thất bại${responseCode ? ` (mã ${responseCode})` : ''}.`, tone: 'text-red-600 bg-red-50' },
  }[status];

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="rounded-3xl border bg-card p-7 shadow-xl">
        <div className={`mx-auto mb-5 grid size-20 place-items-center rounded-full ${content.tone}`}>{content.icon}</div>
        <div className="mb-3 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700"><ShieldCheck size={16} /> VNPay Sandbox</div>
        <h2 className="text-2xl font-bold font-serif">{content.title}</h2>
        <p className="mt-3 text-sm text-muted-foreground">{content.description}</p>
        <p className="mt-4 text-sm">Mã đơn hàng: <strong className="text-primary">#{orderCode}</strong></p>
        {(status === 'paid' || status === 'failed') && (
          <div className="mt-7 flex justify-center gap-3">
            <Btn variant="outline" onClick={() => setView(VIEW_KEYS.TRACKING, orderId)}>Theo dõi đơn</Btn>
            <Btn onClick={() => setView(VIEW_KEYS.HOME)}>Về trang chủ</Btn>
          </div>
        )}
      </div>
    </div>
  );
}
