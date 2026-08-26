import { useEffect, useState } from 'react';
import {
  Award,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Crown,
  Loader2,
  Lock,
  ShieldAlert,
  Sparkles,
  Tag,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { env } from '../../../../config/env';
import { parseRes } from '../../../../utils/api';
import { getAccessToken } from '../../../components/authSession';

interface Tier {
  id: string;
  tierLevel: number;
  name: string;
  minSpent: number;
  minProducts: number;
  discountPercent: number;
  bonusPointRate: number;
  color: string;
  description: string;
}

interface LoyaltyStatus {
  currentTier: Tier;
  nextTier?: Tier | null;
  totalSpent: number;
  totalProductsPurchased: number;
  lastOrderCompletedAt?: string;
  tierEvaluatedAt?: string;
  nextEvaluationDate?: string;
  progress: {
    spentPercent: number;
    productsPercent: number;
    spentNeeded: number;
    productsNeeded: number;
  };
  allTiers: Tier[];
}

export function ProfileLoyalty() {
  const [data, setData] = useState<LoyaltyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [tierVoucherPage, setTierVoucherPage] = useState(1);

  const fetchLoyaltyStatus = async () => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${env.API_URL}/points/loyalty-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Không thể tải thông tin Hạng thành viên');
      }

      const resData = await parseRes(res);
      setData(resData);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Lỗi khi tải dữ liệu hạng thành viên');
    } finally {
      setLoading(false);
    }
  };

  const fetchTierVouchers = async (silent = false) => {
    const token = getAccessToken();
    if (!silent) setLoadingVouchers(true);
    try {
      const res = await fetch(`${env.API_URL}/coupons/public`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const resData = await parseRes(res);
        setVouchers(Array.isArray(resData) ? resData : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoadingVouchers(false);
    }
  };

  useEffect(() => {
    fetchLoyaltyStatus();
    fetchTierVouchers();

    const handleUpdated = () => fetchTierVouchers(true);
    window.addEventListener('sb-vouchers-updated', handleUpdated);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('sb_vouchers_channel');
      channel.onmessage = (event) => {
        if (event.data === 'vouchers_updated') {
          fetchTierVouchers(true);
        }
      };
    } catch (err) {}

    // Auto refresh every 5 seconds for real-time sync across different windows/devices
    const interval = setInterval(() => {
      fetchTierVouchers(true);
    }, 5000);

    return () => {
      window.removeEventListener('sb-vouchers-updated', handleUpdated);
      if (channel) channel.close();
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
        <Loader2 className="animate-spin text-primary" size={32} />
        <span className="text-xs font-semibold">Đang cập nhật Hạng thành viên của bạn...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-12 text-center rounded-2xl border border-dashed border-border bg-card space-y-3">
        <Award size={40} className="mx-auto text-muted-foreground/40" />
        <p className="text-sm font-semibold text-foreground">Không tìm thấy thông tin Hạng thành viên</p>
        <button
          type="button"
          onClick={fetchLoyaltyStatus}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const { currentTier, nextTier, totalSpent, totalProductsPurchased, progress, allTiers, lastOrderCompletedAt, nextEvaluationDate } = data;

  // Filter vouchers exclusive for current tier or available for general
  const tierVouchers = vouchers.filter((v) => {
    if (!v.applicableTierId && !v.applicableTier) return false;
    const tierId = v.applicableTierId || v.applicableTier?.id;
    return tierId === currentTier.id || v.applicableTier?.tierLevel === currentTier.tierLevel;
  });

  const generalTierVouchers = vouchers.filter((v) => v.applicableTierId || v.applicableTier);

  // Calculate inactivity warning: if last order was completed > 270 days ago
  let daysSinceLastOrder = 0;
  let isApproachingOneYearInactive = false;
  if (lastOrderCompletedAt) {
    const lastDate = new Date(lastOrderCompletedAt);
    const now = new Date();
    daysSinceLastOrder = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastOrder > 270 && currentTier.tierLevel > 1) {
      isApproachingOneYearInactive = true;
    }
  }

  const tierColors: Record<number, string> = {
    1: 'from-amber-700 via-amber-800 to-stone-900', // Bronze
    2: 'from-slate-500 via-slate-600 to-slate-800', // Silver
    3: 'from-amber-400 via-amber-500 to-amber-700', // Gold
    4: 'from-cyan-500 via-sky-600 to-blue-800', // Platinum
    5: 'from-fuchsia-600 via-purple-600 to-indigo-900', // Diamond
  };

  const currentGradient = tierColors[currentTier.tierLevel] || tierColors[1];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Đã sao chép mã ${code} vào bộ nhớ tạm!`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Dynamic Loyalty Card */}
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${currentGradient} p-6 sm:p-8 text-white shadow-2xl space-y-6 border border-white/20`}
      >
        <div className="absolute top-0 right-0 -mt-10 -mr-10 size-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -mb-10 size-48 rounded-full bg-black/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3.5 py-1 text-xs font-black tracking-wider uppercase text-amber-100 shadow-sm border border-white/20">
                <Crown size={14} /> Thẻ Thành Viên Sweet Bean
              </span>
            </div>

            <div className="flex items-baseline gap-3 pt-1">
              <h2 className="text-3xl sm:text-4xl font-extrabold font-serif tracking-tight drop-shadow-md">
                {currentTier.name}
              </h2>
              <span className="text-xs font-mono font-bold uppercase opacity-85 px-2 py-0.5 rounded bg-black/20">
                Tier {currentTier.tierLevel}
              </span>
            </div>

            <p className="text-xs text-white/80 max-w-md leading-relaxed">
              {currentTier.description || 'Ưu đãi đặc quyền Voucher dành riêng cho bạn.'}
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-start sm:items-end gap-2 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
            <span className="text-[11px] text-white/80 uppercase font-semibold">Đặc quyền Hạng thành viên</span>
            <span className="text-sm font-extrabold text-amber-300 drop-shadow-xs flex items-center gap-1.5">
              <Tag size={16} /> {currentTier.tierLevel === 1 ? 'Hạng Thành Viên Khởi Đầu' : 'Voucher riêng theo Hạng'}
            </span>
          </div>
        </div>

        {/* Current user stats inside card */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-white/15 text-xs">
          <div className="space-y-0.5">
            <span className="text-white/70 text-[11px]">Tổng số tiền tích lũy:</span>
            <p className="font-bold font-mono text-base">{totalSpent.toLocaleString('vi-VN')} đồng</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-white/70 text-[11px]">Sản phẩm đã mua:</span>
            <p className="font-bold font-mono text-base">{totalProductsPurchased} SP</p>
          </div>
          <div className="col-span-2 sm:col-span-1 space-y-0.5 bg-black/20 p-2 rounded-xl border border-white/10">
            <span className="text-amber-200 text-[11px] font-bold flex items-center gap-1">
              <Clock size={12} /> Đợt tổng kết xét hạng tiếp:
            </span>
            <p className="font-bold font-mono text-xs text-amber-300">
              {nextEvaluationDate ? new Date(nextEvaluationDate).toLocaleDateString('vi-VN') : 'Định kỳ 3 tháng'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Inactivity Warning Alert */}
      {isApproachingOneYearInactive && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-start gap-3.5 animate-pulse">
          <ShieldAlert size={22} className="text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-rose-600 dark:text-rose-400 text-sm">
              Cảnh báo quy tắc giáng hạng 1 năm!
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              Đã <strong className="text-foreground">{daysSinceLastOrder} ngày</strong> trôi qua kể từ đơn hàng hoàn thành cuối cùng của bạn. Theo quy định, nếu không phát sinh thanh toán/mua sản phẩm trong vòng 365 ngày, hạng của bạn sẽ bị reset về hạng Đồng (Tier 1). Hãy hoàn thành 1 đơn hàng mới ngay hôm nay để giữ hạng nhé!
            </p>
          </div>
        </div>
      )}

      {/* 3. Next Tier Progress (Dual Progress Bar: Spent & Products) */}
      {nextTier ? (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
                <TrendingUp size={20} className="text-amber-500" /> Tiến trình nâng hạng tiếp theo: {nextTier.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                Cần đạt đồng thời cả 2 mốc <strong>Chi tiêu</strong> và <strong>Số lượng sản phẩm</strong> trước đợt tổng kết xét hạng tiếp theo vào ngày <strong className="text-amber-600 dark:text-amber-400">{nextEvaluationDate ? new Date(nextEvaluationDate).toLocaleDateString('vi-VN') : 'Định kỳ 3 tháng'}</strong>.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 self-start sm:self-center">
              Tier {nextTier.tierLevel}
            </span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Condition 1: Spent */}
            <div className="space-y-2.5 bg-secondary/40 p-4 rounded-2xl border border-border/60">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-foreground">1. Tổng tiền thanh toán ({totalSpent.toLocaleString('vi-VN')} đồng):</span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                  {progress.spentPercent}%
                </span>
              </div>
              <div className="w-full bg-secondary h-3 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress.spentPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Mốc yêu cầu: <strong>{Number(nextTier.minSpent).toLocaleString('vi-VN')} đồng</strong>
                {progress.spentNeeded > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold"> (Còn thiếu {progress.spentNeeded.toLocaleString('vi-VN')} đồng)</span>
                ) : (
                  <span className="text-green-500 font-bold"> (✓ Đã đạt mốc tiền)</span>
                )}
              </p>
            </div>

            {/* Condition 2: Products */}
            <div className="space-y-2.5 bg-secondary/40 p-4 rounded-2xl border border-border/60">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-foreground">2. Số sản phẩm đã mua ({totalProductsPurchased} SP):</span>
                <span className="font-mono text-sky-600 dark:text-sky-400 font-bold">
                  {progress.productsPercent}%
                </span>
              </div>
              <div className="w-full bg-secondary h-3 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-sky-500 to-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress.productsPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Mốc yêu cầu: <strong>{nextTier.minProducts} sản phẩm</strong>
                {progress.productsNeeded > 0 ? (
                  <span className="text-sky-600 dark:text-sky-400 font-semibold"> (Còn thiếu {progress.productsNeeded} SP)</span>
                ) : (
                  <span className="text-green-500 font-bold"> (✓ Đã đạt mốc số lượng)</span>
                )}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-6 text-center space-y-2">
          <Crown size={36} className="mx-auto text-amber-500" />
          <h3 className="font-serif text-lg font-bold text-foreground">Bạn đang ở Hạng Cao Nhất (Kim Cương)!</h3>
          <p className="text-xs text-muted-foreground">
            Xin chúc mừng! Bạn mở khóa tất cả các Voucher ưu đãi cao cấp nhất dành cho Hạng Kim Cương tại Sweet Bean.
          </p>
        </div>
      )}

      {/* 4. EXCLUSIVE TIER VOUCHERS SECTION */}
      {(() => {
        const VOUCHERS_PER_PAGE = 4;
        const totalTierPages = Math.ceil(tierVouchers.length / VOUCHERS_PER_PAGE) || 1;
        const paginatedTierVouchers = tierVouchers.slice((tierVoucherPage - 1) * VOUCHERS_PER_PAGE, tierVoucherPage * VOUCHERS_PER_PAGE);

        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
                  <Tag size={18} className="text-amber-500" /> Voucher Đặc Quyền Dành Cho Hạng Của Bạn
                </h3>
                <span className="text-xs font-bold text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full border border-border/50">
                  (Tổng {tierVouchers.length} voucher)
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                Hạng {currentTier.name}
              </span>
            </div>

            {loadingVouchers ? (
              <div className="py-8 text-center text-muted-foreground flex items-center justify-center gap-2 text-xs">
                <Loader2 size={16} className="animate-spin text-primary" /> Đang kiểm tra Voucher riêng...
              </div>
            ) : tierVouchers.length === 0 ? (
              <div className="py-8 text-center rounded-2xl border border-dashed border-border bg-card space-y-2">
                <Tag size={28} className="mx-auto text-muted-foreground/40" />
                <p className="text-xs font-semibold text-foreground">
                  Hiện tại chưa có Voucher riêng được phát cho Hạng {currentTier.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Admin & Staff sẽ thường xuyên tạo các mã giảm giá đặc quyền riêng cho từng Hạng thành viên.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {paginatedTierVouchers.map((v) => (
                    <div
                      key={v.id}
                      className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-card p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-extrabold text-sm text-primary uppercase bg-primary/10 px-2.5 py-1 rounded-lg">
                            {v.code}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            Dành cho Hạng {currentTier.name}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-foreground mt-1">
                          {v.discountType === 'percent'
                            ? `Giảm ${Math.round(Number(v.discountValue))}% đơn hàng`
                            : `Giảm ${Number(v.discountValue).toLocaleString('vi-VN')}đ`}
                          {v.minOrderValue > 0 ? ` cho đơn từ ${Number(v.minOrderValue).toLocaleString('vi-VN')}đ` : ''}
                        </h4>
                        {v.description && <p className="text-[11px] text-muted-foreground line-clamp-2">{v.description}</p>}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border text-[11px]">
                        <span className="text-muted-foreground">
                          Hạn dùng: {new Date(v.expiresAt).toLocaleDateString('vi-VN')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(v.code)}
                          className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition flex items-center gap-1 cursor-pointer"
                        >
                          <Copy size={12} /> Sao chép mã
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {totalTierPages > 1 && (
                  <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs font-medium text-muted-foreground">
                    <span>Trang {tierVoucherPage} / {totalTierPages} (Hiển thị 4 voucher / trang)</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={tierVoucherPage === 1}
                        onClick={() => setTierVoucherPage(p => Math.max(1, p - 1))}
                        className="p-1.5 rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      {Array.from({ length: totalTierPages }, (_, i) => i + 1).map(pg => (
                        <button
                          key={pg}
                          type="button"
                          onClick={() => setTierVoucherPage(pg)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            tierVoucherPage === pg ? 'bg-primary text-primary-foreground' : 'bg-card border border-border hover:bg-secondary'
                          }`}
                        >
                          {pg}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={tierVoucherPage >= totalTierPages}
                        onClick={() => setTierVoucherPage(p => Math.min(totalTierPages, p + 1))}
                        className="p-1.5 rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* 5. Tier Roadmap (5 Tiers visualization) */}
      <div className="space-y-4">
        <h3 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
          <Sparkles size={18} className="text-primary" /> Lộ trình 5 Bậc Hạng
        </h3>

        <div className="grid gap-3 sm:grid-cols-5">
          {allTiers.map((t) => {
            const isCurrent = t.tierLevel === currentTier.tierLevel;
            const isUnlocked = t.tierLevel <= currentTier.tierLevel;
            const minSpent = Number(t.minSpent || 0);

            return (
              <div
                key={t.id}
                className={`relative p-4 rounded-2xl border transition flex flex-col justify-between space-y-3 ${
                  isCurrent
                    ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30'
                    : isUnlocked
                      ? 'border-border bg-card'
                      : 'border-border/40 bg-secondary/20 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: t.color || '#8B5CF6' }}
                  >
                    Tier {t.tierLevel}
                  </span>
                  {isCurrent ? (
                    <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full">
                      Hạng hiện tại
                    </span>
                  ) : isUnlocked ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <Lock size={14} className="text-muted-foreground" />
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-sm text-foreground">{t.name}</h4>
                  {t.tierLevel > 1 && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                      Voucher đặc quyền Hạng {t.name}
                    </p>
                  )}
                </div>

                <div className="space-y-1 text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                  <p>Tiền: {minSpent > 0 ? `${minSpent.toLocaleString('vi-VN')} đồng` : '0 đồng'}</p>
                  <p>Số lượng: {t.minProducts} sản phẩm</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
