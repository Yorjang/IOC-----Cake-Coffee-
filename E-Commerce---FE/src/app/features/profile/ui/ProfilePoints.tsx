import { useEffect, useState } from 'react';
import { Award, Coins, ShoppingBag, Star, Sparkles, Clock, ChevronLeft, ChevronRight, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { env } from '../../../../config/env';
import { parseRes } from '../../../../utils/api';
import { getAccessToken } from '../../../components/authSession';

interface PointHistoryItem {
  id: string;
  userId: string;
  points: number;
  balance: number;
  type: string;
  referenceId?: string;
  description?: string;
  createdAt: string;
}

export function ProfilePoints() {
  const [points, setPoints] = useState<number>(0);
  const [history, setHistory] = useState<PointHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPointData = async (currentPage = 1) => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${env.API_URL}/points/history?page=${currentPage}&limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Không thể tải lịch sử tích điểm');
      }

      const data = await parseRes(res);
      const pts = Number(data?.points || 0);
      setPoints(pts);
      setHistory(data?.items || []);
      setTotalPages(data?.totalPages || 1);
      setPage(data?.page || 1);

      const storedUserStr = localStorage.getItem("user") || sessionStorage.getItem("user");
      if (storedUserStr) {
        try {
          const storedUser = JSON.parse(storedUserStr);
          storedUser.points = pts;
          if (localStorage.getItem("user")) localStorage.setItem("user", JSON.stringify(storedUser));
          if (sessionStorage.getItem("user")) sessionStorage.setItem("user", JSON.stringify(storedUser));
        } catch (e) {
          console.error(e);
        }
      }

      window.dispatchEvent(new CustomEvent('points-updated', { detail: pts }));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Lỗi khi tải dữ liệu điểm thưởng');
    } finally {
      setLoading(false);
    }
  };

  const [redeemableCoupons, setRedeemableCoupons] = useState<any[]>([]);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const fetchRedeemableCoupons = async () => {
    const token = getAccessToken();
    try {
      const res = await fetch(`${env.API_URL}/coupons/redeemable`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await parseRes(res);
        setRedeemableCoupons(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPointData(1);
    fetchRedeemableCoupons();
  }, []);

  const handleRedeem = async (couponId: string, code: string, pointsReq: number) => {
    if (points < pointsReq) {
      toast.error(`Bạn không đủ điểm thưởng! Cần ${pointsReq} điểm (bạn hiện có ${points} điểm).`);
      return;
    }
    if (!window.confirm(`Bạn có chắc muốn dùng ${pointsReq} điểm để đổi Voucher ${code} không?`)) return;

    const token = getAccessToken();
    if (!token) {
      toast.error("Vui lòng đăng nhập để đổi voucher.");
      return;
    }

    setRedeemingId(couponId);
    try {
      const res = await fetch(`${env.API_URL}/coupons/${couponId}/redeem`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseRes(res);
      if (res.ok) {
        toast.success(data.message || `Đổi mã ${code} thành công!`);
        fetchPointData(1);
        fetchRedeemableCoupons();
      } else {
        toast.error(data.message || 'Không thể đổi voucher.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi kết nối khi đổi voucher.');
    } finally {
      setRedeemingId(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchPointData(newPage);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'order_completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <ShoppingBag size={12} /> Đơn hàng hoàn thành
          </span>
        );
      case 'product_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Star size={12} /> Đánh giá sản phẩm
          </span>
        );
      case 'admin_adjustment':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <ShieldCheck size={12} /> Điều chỉnh Admin
          </span>
        );
      case 'points_redeemed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            <Award size={12} /> Đổi Voucher
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary text-muted-foreground">
            <Coins size={12} /> Giao dịch điểm
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner: Point Balance */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-40 h-40 rounded-full bg-black/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-bold tracking-wider uppercase text-amber-100">
                <Sparkles size={13} /> Thành viên Sweet Bean
              </span>
            </div>
            <p className="text-amber-100 text-xs font-medium">Tổng điểm thưởng tích lũy hiện có</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight drop-shadow-sm">
                {points.toLocaleString('vi-VN')}
              </span>
              <span className="text-lg font-bold text-amber-100 uppercase">điểm</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchPointData(page)}
            disabled={loading}
            className="self-start sm:self-center px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold text-xs transition flex items-center gap-2 shadow-sm border border-white/20 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Làm mới điểm</span>
          </button>
        </div>
      </div>

      {/* Point Earning Rules Section */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/20 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
          <ShoppingBag size={24} />
        </div>
        <div className="space-y-0.5 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-bold text-sm text-foreground">Quy tắc tích điểm mua hàng</h4>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
              1.000 VNĐ = 1 điểm
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tích điểm tự động dựa trên tổng giá trị sản phẩm của đơn hàng khi hoàn tất (không bao gồm tiền phí giao hàng).
          </p>
        </div>
      </div>

      {/* Redeemable Vouchers Section */}
      {redeemableCoupons.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-base text-foreground font-serif flex items-center gap-2">
              <Award size={18} className="text-amber-500" /> Đổi Voucher bằng Điểm thưởng
            </h4>
            <span className="text-xs text-muted-foreground font-medium">
              Dùng điểm thưởng của bạn để nhận Voucher giảm giá
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {redeemableCoupons.map((c) => {
              const origPoints = Number(c.pointsRequired || 0);
              const discPoints = c.discountedPointsRequired !== null && c.discountedPointsRequired !== undefined ? Number(c.discountedPointsRequired) : null;
              const hasDiscount = discPoints !== null && discPoints >= 0 && discPoints < origPoints;
              const effectivePoints = hasDiscount ? discPoints : origPoints;
              const hasRedeemed = !!c.hasRedeemed;
              const canRedeem = points >= effectivePoints && !hasRedeemed;
              const isRedeeming = redeemingId === c.id;

              return (
                <div
                  key={c.id}
                  className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-card p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-base text-primary uppercase">{c.code}</span>
                        {hasDiscount ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 flex items-center gap-1">
                            🔥 {discPoints} điểm <span className="line-through text-muted-foreground opacity-75 font-normal">{origPoints}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            ⭐ {origPoints} điểm
                          </span>
                        )}
                        {hasRedeemed && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/15 text-green-600 dark:text-green-400">
                            ✓ Đã đổi
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-foreground mt-1">
                        {c.discountType === 'percent' ? `Giảm ${Math.round(Number(c.discountValue))}%` : `Giảm ${Number(c.discountValue).toLocaleString('vi-VN')}đ`}
                        {c.minOrderValue > 0 ? ` cho đơn từ ${Number(c.minOrderValue).toLocaleString('vi-VN')}đ` : ''}
                      </p>
                      {c.description && <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{c.description}</p>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-[11px] text-muted-foreground">
                      Hạn dùng: {new Date(c.expiresAt).toLocaleDateString('vi-VN')}
                    </span>
                    <button
                      type="button"
                      disabled={!canRedeem || isRedeeming}
                      onClick={() => handleRedeem(c.id, c.code, effectivePoints)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                        hasRedeemed
                          ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 cursor-default'
                          : canRedeem
                            ? 'bg-amber-500 hover:bg-amber-600 text-white active:scale-95'
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                      }`}
                    >
                      {isRedeeming ? (
                        <>
                          <Loader2 size={12} className="animate-spin" /> Đang đổi...
                        </>
                      ) : hasRedeemed ? (
                        <>
                          <ShieldCheck size={13} /> Đã sở hữu
                        </>
                      ) : canRedeem ? (
                        <>
                          <Award size={13} /> Đổi ({effectivePoints}pt)
                        </>
                      ) : (
                        `Thiếu ${effectivePoints - points} điểm`
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Point History Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-base text-foreground font-serif flex items-center gap-2">
            <Clock size={16} className="text-primary" /> Lịch sử tích điểm
          </h4>
          <span className="text-xs text-muted-foreground font-medium">
            Trang {page} / {totalPages}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-primary" size={24} />
            <span className="text-xs">Đang tải lịch sử tích điểm...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border border-dashed border-border bg-secondary/30 space-y-2">
            <Coins size={36} className="mx-auto text-muted-foreground/40" />
            <p className="text-sm font-semibold text-foreground">Chưa có lịch sử tích điểm</p>
            <p className="text-xs text-muted-foreground">
              Hãy mua hàng hoặc đánh giá các sản phẩm đã mua để bắt đầu tích lũy điểm thưởng nhé!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/60 text-muted-foreground font-semibold uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-3 px-4">Thời gian</th>
                  <th className="py-3 px-4">Loại giao dịch</th>
                  <th className="py-3 px-4">Biến động</th>
                  <th className="py-3 px-4">Số dư điểm</th>
                  <th className="py-3 px-4">Mô tả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.map((item) => {
                  const isPositive = item.points > 0;
                  return (
                    <tr key={item.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-muted-foreground whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getTypeBadge(item.type)}
                      </td>
                      <td className="py-3.5 px-4 font-bold font-mono whitespace-nowrap">
                        <span
                          className={
                            isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }
                        >
                          {isPositive ? `+${item.points}` : item.points} điểm
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold font-mono text-foreground whitespace-nowrap">
                        {item.balance.toLocaleString('vi-VN')} điểm
                      </td>
                      <td className="py-3.5 px-4 text-foreground/80 max-w-xs truncate">
                        {item.description || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || loading}
              className="p-2 rounded-xl border border-border bg-card text-foreground hover:bg-secondary disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-semibold text-muted-foreground px-2">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || loading}
              className="p-2 rounded-xl border border-border bg-card text-foreground hover:bg-secondary disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
