import { Loader2, Wallet } from "lucide-react";
import { type RemitRequest, REMIT_STATUS_LABEL, ShipperBadge, formatMoney } from "./ShipperShared";

export function SettlementTab({
  active,
  codHolding,
  remitRequests,
  remitting,
  handleRemitRequest,
}: {
  active: boolean;
  codHolding: number;
  remitRequests: RemitRequest[];
  remitting: boolean;
  handleRemitRequest: () => void;
}) {
  if (!active) return null;

  const hasPendingRemit = remitRequests.some((r) => r.status === "pending");

  return (
    <>
      <div className="mb-5">
        <h1 className="text-3xl">Đối soát tiền COD</h1>
        <p className="mt-1 text-sm text-muted-foreground">Số tiền COD bạn đang giữ và lịch sử các lần đối soát với cửa hàng.</p>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5 shadow-sm">
        <div>
          <p className="text-sm text-muted-foreground">Tổng tiền đang giữ, chưa đối soát</p>
          <p className="mt-2 text-3xl font-bold text-primary">{formatMoney(codHolding)}</p>
        </div>
        <button
          type="button"
          disabled={remitting || hasPendingRemit || codHolding <= 0}
          onClick={handleRemitRequest}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {remitting ? <Loader2 size={14} className="animate-spin" /> : <Wallet size={14} />}
          {hasPendingRemit ? "Đang chờ cửa hàng xác nhận" : "Gửi yêu cầu đối soát"}
        </button>
      </div>

      {remitRequests.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Chưa có lần đối soát nào.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary text-left">
                <th className="p-3">Ngày gửi</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3 text-right">Dự kiến</th>
                <th className="p-3 text-right">Thực nhận</th>
                <th className="p-3 text-right">Chênh lệch</th>
              </tr>
            </thead>
            <tbody>
              {remitRequests.map((remit) => (
                <tr key={remit.id} className="border-b last:border-0 hover:bg-muted/50 transition">
                  <td className="p-3 text-muted-foreground">
                    {new Date(remit.createdAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="p-3">
                    <ShipperBadge status={REMIT_STATUS_LABEL[remit.status] || remit.status} />
                  </td>
                  <td className="p-3 text-right font-semibold text-primary">{formatMoney(Number(remit.totalExpected))}</td>
                  <td className="p-3 text-right">
                    {remit.totalActual != null ? formatMoney(Number(remit.totalActual)) : "—"}
                  </td>
                  <td className="p-3 text-right">
                    {remit.totalActual != null ? formatMoney(Number(remit.discrepancy)) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
