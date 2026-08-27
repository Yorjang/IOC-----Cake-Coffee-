import { parseRes } from '../../../utils/api';

import {
  CircleCheck,
  Loader2,
  Star,
  Trash2,
  XCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { env } from "../../../config/env";
import { getAccessToken } from "../authSession";
import { StatusBadge } from "./AdminShared";

export function AdminReviews() {
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = async () => {
    const token = getAccessToken();
    try {
      const res = await fetch(`${env.API_URL}/admin/reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseRes(res);
      if (res.ok) {
        setReviewsList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const updateVisibility = async (id: string, isVisible: boolean) => {
    const token = getAccessToken();
    try {
      const res = await fetch(`${env.API_URL}/admin/reviews/${id}/visibility`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isVisible }),
      });
      if (res.ok) {
        toast.success(isVisible ? "Đã hiển thị đánh giá." : "Đã ẩn đánh giá.");
        loadReviews();
      } else {
        const errData = await parseRes(res);
        toast.error(errData.message || "Lỗi khi cập nhật.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    }
  };

  const deleteReview = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đánh giá này không?")) return;
    const token = getAccessToken();
    try {
      const res = await fetch(`${env.API_URL}/admin/reviews/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Xóa đánh giá thành công.");
        loadReviews();
      } else {
        const errData = await parseRes(res);
        toast.error(errData.message || "Lỗi khi xóa.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi kết nối.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-sidebar rounded-2xl">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  const pendingCount = reviewsList.filter(r => !r.isVisible).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-foreground">Quản lý đánh giá</h2>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <span className="rounded-full bg-yellow-900/50 px-3 py-1.5 text-xs text-yellow-300">
              {pendingCount} đánh giá ẩn
            </span>
          )}
        </div>
      </div>
      <div className="grid gap-4">
        {reviewsList.map(r => (
          <div key={r.id} className="rounded-2xl bg-sidebar p-5 transition hover:bg-sidebar-accent">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-full bg-primary/20 grid place-items-center text-primary text-xs font-bold">
                    {(r.user?.fullName || "K")[0]}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{r.user?.fullName || "Khách hàng"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString("vi-VN")} · {r.product?.name || "Sản phẩm"}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-sidebar-accent"}
                    />
                  ))}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{r.comment}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={r.isVisible ? "Đã duyệt" : "Ẩn"} />
                <div className="flex gap-2 mt-1">
                  {r.isVisible ? (
                    <button
                      title="Ẩn đánh giá"
                      onClick={() => updateVisibility(r.id, false)}
                      className="inline-flex size-8 items-center justify-center rounded-lg bg-yellow-950/40 text-yellow-400 hover:bg-yellow-900/40 transition"
                    >
                      <XCircle size={14} />
                    </button>
                  ) : (
                    <button
                      title="Duyệt / Hiện đánh giá"
                      onClick={() => updateVisibility(r.id, true)}
                      className="inline-flex size-8 items-center justify-center rounded-lg bg-green-950/40 text-green-400 hover:bg-green-900/40 transition"
                    >
                      <CircleCheck size={14} />
                    </button>
                  )}
                  <button
                    title="Xóa đánh giá"
                    onClick={() => deleteReview(r.id)}
                    className="inline-flex size-8 items-center justify-center rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/40 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {reviewsList.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-12 bg-sidebar rounded-2xl">
            Không tìm thấy đánh giá nào.
          </p>
        )}
      </div>
    </div>
  );
}


