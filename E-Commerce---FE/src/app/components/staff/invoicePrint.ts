export interface InvoicePrintItem {
  name: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InvoicePrintData {
  orderCode?: string;
  items: InvoicePrintItem[];
  subtotal: number;
  vat: number;
  total: number;
  paymentMethod: string;
  customerPhone?: string;
  fulfillmentType: string;
  paid: boolean;
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const money = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

export function printInvoice(invoice: InvoicePrintData): boolean {
  if (typeof window === 'undefined') return false;

  const printWindow = window.open('', '_blank', 'width=420,height=720');
  if (!printWindow) return false;

  const rows = invoice.items.map(item => `
    <tr>
      <td>${escapeHtml(item.name)}<small>${escapeHtml(item.variantName)}</small></td>
      <td class="center">${item.quantity}</td>
      <td class="right">${money(item.totalPrice)}</td>
    </tr>
  `).join('');
  const orderLabel = invoice.orderCode ? `Mã đơn: ${escapeHtml(invoice.orderCode)}` : 'Hóa đơn tạm tính';
  const statusLabel = invoice.paid ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN';

  printWindow.document.open();
  printWindow.document.write(`<!doctype html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(orderLabel)}</title>
        <style>
          * { box-sizing: border-box; }
          body { width: 80mm; margin: 0 auto; padding: 16px 8px; color: #2d1a13; font: 13px/1.45 Arial, sans-serif; }
          h1 { margin: 0; text-align: center; font-size: 20px; }
          p { margin: 3px 0; text-align: center; }
          .status { margin: 12px 0; text-align: center; font-weight: 700; letter-spacing: .08em; }
          .meta { border-top: 1px dashed #999; border-bottom: 1px dashed #999; margin: 10px 0; padding: 7px 0; }
          table { width: 100%; border-collapse: collapse; }
          th { border-bottom: 1px solid #333; padding: 5px 0; text-align: left; }
          td { padding: 6px 0; vertical-align: top; }
          td small { display: block; color: #666; }
          .center { text-align: center; width: 12%; }
          .right { text-align: right; white-space: nowrap; }
          .total { border-top: 1px solid #333; font-size: 16px; font-weight: 700; }
          .thanks { margin-top: 16px; font-weight: 700; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>Sweet Bean Coffee &amp; Cake</h1>
        <p>Hóa đơn tại quầy</p>
        <p>${escapeHtml(invoice.fulfillmentType)}</p>
        <div class="status">${statusLabel}</div>
        <div class="meta">
          <div>${orderLabel}</div>
          <div>Thanh toán: ${escapeHtml(invoice.paymentMethod)}</div>
          ${invoice.customerPhone ? `<div>SĐT: ${escapeHtml(invoice.customerPhone)}</div>` : ''}
        </div>
        <table>
          <thead><tr><th>Món</th><th class="center">SL</th><th class="right">Thành tiền</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <table>
          <tbody>
            <tr><td>Tạm tính</td><td class="right">${money(invoice.subtotal)}</td></tr>
            <tr><td>VAT (3%)</td><td class="right">${money(invoice.vat)}</td></tr>
            <tr class="total"><td>Tổng cộng</td><td class="right">${money(invoice.total)}</td></tr>
          </tbody>
        </table>
        <p class="thanks">Cảm ơn quý khách!</p>
        <script>window.onload = function () { window.focus(); window.print(); };</script>
      </body>
    </html>`);
  printWindow.document.close();
  return true;
}
