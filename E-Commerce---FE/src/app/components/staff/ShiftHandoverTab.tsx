import { ClipboardCheck } from "lucide-react";
import { StaffButton, formatMoney } from "./StaffShared";

export function ShiftHandoverTab({ invoices, active }: any) {
  if (!active) return null;

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="rounded-2xl border bg-card p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold">Bàn giao ca</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tổng hợp tiền mặt, hoá đơn, tồn kho và việc cần xử lý.
            </p>
          </div>
          <StaffButton>
            <ClipboardCheck size={14} /> Chốt ca
          </StaffButton>
        </div>
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b bg-secondary">
                <th className="p-3">Mã</th>
                <th className="p-3">Sản phẩm</th>
                <th className="p-3">Tổng</th>
                <th className="p-3">Thanh toán</th>
                <th className="p-3">Giờ</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-5 text-center text-muted-foreground">
                    Chưa có hoá đơn nào trong ngày.
                  </td>
                </tr>
              )}
              {invoices.map((invoice: any) => {
                const itemsStr =
                  invoice.items
                    ?.map((i: any) => `${i.quantity}x ${i.productName}`)
                    .join(", ") || "N/A";
                return (
                  <tr key={invoice.id} className="border-b last:border-0 hover:bg-muted/50 transition">
                    <td className="p-3 font-mono text-primary">#{invoice.orderCode}</td>
                    <td className="p-3 text-muted-foreground max-w-[200px] truncate">
                      {itemsStr}
                    </td>
                    <td className="p-3 font-semibold">
                      {formatMoney(Number(invoice.totalAmount))}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {invoice.paymentMethod?.toUpperCase()}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(invoice.createdAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="h-fit rounded-2xl border bg-card p-5">
        <h2 className="font-sans text-xl font-semibold">Checklist cuối ca</h2>
        <div className="mt-4 space-y-3">
          {[
            "Đối soát tiền mặt và ví điện tử",
            "Cập nhật món hết hàng",
            "Ghi chú bánh đặt trước",
            "Vệ sinh quầy cafe và tủ bánh",
          ].map((task, index) => (
            <label
              key={task}
              className="flex cursor-pointer items-start gap-3 rounded-xl bg-secondary p-3 text-sm transition hover:bg-accent"
            >
              <input type="checkbox" defaultChecked={index < 2} className="mt-1" />
              <span>{task}</span>
            </label>
          ))}
        </div>
      </aside>
    </section>
  );
}
