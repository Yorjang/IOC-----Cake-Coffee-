import React, { useState } from "react";
import { AlertTriangle, CheckCircle, Loader2, X } from "lucide-react";
import { ImageUploader } from "../admin/AdminShared";
import { type ShipperOrder, QUICK_FAIL_REASONS, formatMoney } from "./ShipperShared";

export function OrderDetailModal({ order, onClose }: { order: ShipperOrder; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border bg-card shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b p-4">
          <div>
            <p className="font-mono text-xs text-primary">{order.id}</p>
            <h2 className="mt-1 font-sans text-lg">Chi tiết đơn hàng</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border p-2 transition hover:bg-secondary">
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Khách hàng</p>
            <p className="mt-1 text-sm">{order.customer} · {order.phone}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Địa chỉ giao hàng</p>
            <p className="mt-1 text-sm">{order.address}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Lấy hàng từ</p>
            <p className="mt-1 text-sm">{order.originName} · {order.originAddress}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Đặt lúc</p>
            <p className="mt-1 text-sm">{order.orderedAt.toLocaleString("vi-VN")}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Sản phẩm</p>
            <div className="mt-1 space-y-1">
              {order.itemsDetailed.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.name} x{item.qty}</span>
                  <span className="text-muted-foreground">{formatMoney(item.unitPrice * item.qty)}</span>
                </div>
              ))}
            </div>
          </div>
          {order.note && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Ghi chú khách hàng</p>
              <p className="mt-1 text-sm">{order.note}</p>
            </div>
          )}
          <div className="flex items-center justify-between border-t pt-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Thanh toán</p>
              <p className="mt-1 text-sm">{order.payment === "COD" ? `COD · ${formatMoney(order.codAmount)}` : order.payment}</p>
            </div>
            <p className="text-lg font-bold text-primary">{order.total}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ConfirmDeliveryModal({
  order,
  submitting,
  onClose,
  onSubmit,
}: {
  order: ShipperOrder;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (photoUrl: string) => void;
}) {
  const [photoUrl, setPhotoUrl] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-primary">{order.id}</p>
            <h2 className="mt-1 font-sans text-lg">Xác nhận đã giao</h2>
            <p className="mt-1 text-sm text-muted-foreground">{order.customer} · {order.address}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border p-2 transition hover:bg-secondary">
            <X size={16} />
          </button>
        </div>

        <div className="mt-4">
          <ImageUploader label="Ảnh xác nhận giao hàng (bắt buộc)" value={photoUrl} onChange={setPhotoUrl} />
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Ứng dụng sẽ xin quyền định vị để xác thực bạn đang ở gần địa điểm giao hàng.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border px-4 py-2 text-sm transition hover:bg-secondary">
            Huỷ
          </button>
          <button
            type="button"
            disabled={!photoUrl || submitting}
            onClick={() => onSubmit(photoUrl)}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

export function FailDeliveryModal({
  order,
  submitting,
  onClose,
  onSubmit,
}: {
  order: ShipperOrder;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border bg-card p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-primary">{order.id}</p>
            <h2 className="mt-1 flex items-center gap-2 font-sans text-lg text-destructive">
              <AlertTriangle size={18} />
              Không thể giao đơn hàng này
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{order.customer} · {order.address}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border p-2 transition hover:bg-secondary">
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
          Đơn này sẽ được đánh dấu giao thất bại, chờ cửa hàng huỷ hoặc phân công lại. Bạn cần đứng gần khu vực giao hàng (trong vòng 1km) để báo cáo sự cố.
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">Lý do</label>
          <div className="flex flex-wrap gap-2">
            {QUICK_FAIL_REASONS.map((quickReason) => (
              <button
                key={quickReason}
                type="button"
                onClick={() => setReason(quickReason)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${reason === quickReason ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent"}`}
              >
                {quickReason}
              </button>
            ))}
          </div>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-xl border bg-input-background p-3 text-sm outline-none focus:border-primary"
            placeholder="Mô tả chi tiết lý do không thể giao đơn hàng..."
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border px-4 py-2 text-sm transition hover:bg-secondary">
            Đóng
          </button>
          <button
            type="button"
            disabled={!reason.trim() || submitting}
            onClick={() => onSubmit(reason.trim())}
            className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition hover:bg-destructive/80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
            Xác nhận không thể giao
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConfirmRemittanceModal({
  amount,
  submitting,
  onClose,
  onSubmit,
}: {
  amount: number;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border bg-card p-5 text-center shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="font-sans text-xl font-bold">Xác nhận nộp tiền</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Bạn xác nhận đã nộp số tiền <strong className="text-primary">{formatMoney(amount)}</strong> cho quản lý hoặc kế toán tại cửa hàng?
        </p>

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-full border py-2.5 text-sm font-semibold transition hover:bg-secondary">
            Huỷ
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={onSubmit}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/80 disabled:opacity-60"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
