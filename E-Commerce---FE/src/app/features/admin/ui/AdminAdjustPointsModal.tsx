import React, { useState } from 'react';
import { Coins, X, Loader2, Award } from 'lucide-react';
import { toast } from 'sonner';
import { env } from '../../../../config/env';
import { getAccessToken } from '../../../components/authSession';

interface AdminAdjustPointsModalProps {
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminAdjustPointsModal({ user, onClose, onSuccess }: AdminAdjustPointsModalProps) {
  const [points, setPoints] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (points === 0) {
      toast.error('Vui lòng nhập số điểm khác 0!');
      return;
    }
    if (!reason.trim()) {
      toast.error('Vui lòng nhập lý do điều chỉnh điểm!');
      return;
    }

    const token = getAccessToken();
    if (!token) {
      toast.error('Vui lòng đăng nhập lại');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${env.API_URL}/points/admin/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          points: Number(points),
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Không thể điều chỉnh điểm');
      }

      toast.success(data.message || 'Điều chỉnh điểm thành công!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Đã xảy ra lỗi khi điều chỉnh điểm.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl border border-sidebar-accent bg-background p-6 shadow-2xl space-y-5 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Coins className="size-5 text-amber-500" />
            <h3 className="text-lg font-bold text-foreground">Điều chỉnh Điểm Thưởng</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-sidebar transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Card */}
        <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-foreground">{user.fullName || 'Người dùng'}</p>
            <p className="text-muted-foreground">{user.email || user.phone || 'Chưa thiết lập'}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">Điểm hiện tại</p>
            <p className="font-bold font-mono text-amber-600 dark:text-amber-400 text-sm flex items-center gap-1 justify-end">
              <Award size={14} /> {(user.points || 0).toLocaleString('vi-VN')} điểm
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-foreground mb-1.5">
              Số điểm thay đổi (Dương + để cộng, Âm - để trừ):
            </label>
            <input
              type="number"
              placeholder="Ví dụ: 100 hoặc -50"
              value={points || ''}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-full rounded-xl bg-sidebar border border-border px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1.5">
              Lý do điều chỉnh (Bắt buộc):
            </label>
            <textarea
              rows={3}
              placeholder="Ví dụ: Tặng điểm sự kiện sinh nhật, Bù điểm do sự cố đơn hàng..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl bg-sidebar border border-border p-3 text-xs outline-none focus:ring-2 focus:ring-primary/30 text-foreground resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2.5 font-semibold text-muted-foreground hover:bg-sidebar transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-primary px-5 py-2.5 font-bold text-primary-foreground hover:bg-primary/90 transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading && <Loader2 className="animate-spin" size={14} />}
              <span>{loading ? 'Đang lưu...' : 'Xác nhận thay đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
