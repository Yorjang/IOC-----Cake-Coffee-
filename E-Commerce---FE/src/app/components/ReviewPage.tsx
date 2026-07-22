import { parseRes } from '../../utils/api';
import { useState, useEffect } from "react";
import { Star, ThumbsUp, Camera, ArrowLeft } from "lucide-react";
import { env } from "../../config/env";
import { getAccessToken } from "./authSession";
import { toast } from "sonner";

// Removed initialReviews mock data

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="transition hover:scale-110"
        >
          <Star
            size={28}
            className={(hover || value) >= i ? "fill-[#d99554] text-[#d99554]" : "text-muted"}
          />
        </button>
      ))}
    </div>
  );
}

const ratingLabels = ["", "Tệ", "Không tốt", "Bình thường", "Tốt", "Xuất sắc!"];

export function ReviewPage({ product, onBack }: any) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [filterRating, setFilterRating] = useState(0);
  const [sortBy, setSortBy] = useState("newest");
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <div className="mb-4 text-muted-foreground"><Camera size={48} /></div>
        <h2 className="text-xl font-semibold mb-2">Không tìm thấy sản phẩm</h2>
        <p className="text-muted-foreground mb-6">Có vẻ như sản phẩm này không tồn tại hoặc đã bị xóa.</p>
        <button onClick={onBack} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-primary-foreground transition hover:bg-primary/90 font-medium">
          <ArrowLeft size={18} /> Quay lại
        </button>
      </div>
    );
  }

  const displayProductName = product[0];
  const displayProductPrice = product[1];
  const displayProductImage = product[3];

  const productId = product?.raw?.id;

  const loadReviews = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const res = await fetch(`${env.API_URL}/reviews/product/${productId}`);
      if (res.ok) {
        const data = await parseRes(res);
        const mapped = data.map((r: any) => ({
          user: r.user?.fullName || "Khách hàng",
          avatar: (r.user?.fullName || "K").charAt(0).toUpperCase(),
          rating: r.rating,
          date: new Date(r.createdAt).toLocaleDateString("vi-VN"),
          comment: r.comment || "",
          likes: 0,
          verified: r.isVerified,
          images: []
        }));
        setReviewsList(mapped);
      }
    } catch (err) {
      console.error("Error loading reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const avgRating = reviewsList.length > 0 
    ? (reviewsList.reduce((a, r) => a + r.rating, 0) / reviewsList.length).toFixed(1)
    : "0.0";
  const dist = [5, 4, 3, 2, 1].map(r => ({ r, count: reviewsList.filter(x => x.rating === r).length }));

  const filtered = reviewsList
    .filter(r => filterRating === 0 || r.rating === filterRating)
    .sort((a, b) => {
      if (sortBy === "highest") return b.rating - a.rating;
      if (sortBy === "lowest") return a.rating - b.rating;
      if (sortBy === "helpful") return b.likes - a.likes;
      return 0; // newest/default
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !comment.trim()) return;

    const token = getAccessToken();
    if (!token) {
      toast.error("Vui lòng đăng nhập để viết đánh giá!");
      return;
    }

    try {
      const res = await fetch(`${env.API_URL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId,
          rating,
          comment
        })
      });

      const resData = await parseRes(res);
      if (!res.ok) {
        throw new Error(resData.message || "Gửi đánh giá thất bại");
      }

      toast.success("Gửi đánh giá thành công!");
      setSubmitted(true);
      loadReviews();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi khi gửi đánh giá.");
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center justify-center size-9 rounded-full bg-secondary hover:bg-accent transition text-foreground"
            title="Quay lại"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <p className="text-sm text-muted-foreground">Trang chủ / {displayProductName} / Đánh giá</p>
      </div>

      {/* Product context */}
      <div className="mt-5 flex flex-wrap items-center gap-5 rounded-[2rem] border bg-card p-6">
        <img src={displayProductImage} alt={displayProductName} className="size-20 rounded-2xl object-cover" />
        <div className="flex-1">
          <h1 className="text-3xl">{displayProductName}</h1>
          <p className="mt-1 text-muted-foreground">{displayProductPrice}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Reviews list */}
        <div>
          {/* Summary */}
          <div className="rounded-[2rem] border bg-card p-6">
            <div className="flex flex-wrap items-center gap-8">
              <div className="text-center">
                <p className="text-5xl font-extrabold text-primary">{avgRating}</p>
                <div className="mt-2 flex justify-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} className="fill-[#d99554] text-[#d99554]" />)}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{reviewsList.length} đánh giá</p>
              </div>
              <div className="flex-1 space-y-2 min-w-[160px]">
                {dist.map(({ r, count }) => (
                  <button key={r} onClick={() => setFilterRating(filterRating === r ? 0 : r)} className={`flex w-full items-center gap-3 rounded-xl px-2 py-1 text-sm transition ${filterRating === r ? "bg-secondary" : "hover:bg-secondary/50"}`}>
                    <span className="w-4 text-right text-muted-foreground">{r}</span>
                    <Star size={12} className="fill-[#d99554] text-[#d99554]" />
                    <div className="flex-1 h-2 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-[#d99554]" style={{ width: `${(count / reviewsList.length) * 100}%` }} />
                    </div>
                    <span className="w-4 text-muted-foreground">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sort + filter bar */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {[0, 5, 4, 3].map(r => (
                <button key={r} onClick={() => setFilterRating(filterRating === r ? 0 : r)} className={`rounded-full px-3 py-1.5 text-sm transition ${filterRating === r ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent"}`}>
                  {r === 0 ? "Tất cả" : `${r} sao`}
                </button>
              ))}
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="rounded-xl border bg-input-background px-3 py-2 text-sm outline-none">
              <option value="newest">Mới nhất</option>
              <option value="highest">Đánh giá cao nhất</option>
              <option value="lowest">Đánh giá thấp nhất</option>
              <option value="helpful">Hữu ích nhất</option>
            </select>
          </div>

          {/* Review cards */}
          <div className="mt-4 space-y-4">
            {filtered.map((r, i) => (
              <div key={i} className="rounded-2xl border bg-card p-5 transition hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground font-bold text-sm">{r.avatar}</div>
                    <div>
                      <p className="font-semibold">{r.user}</p>
                      <p className="text-xs text-muted-foreground">{r.date}{r.verified && <span className="ml-2 text-green-600">✓ Đã mua</span>}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} className={s <= r.rating ? "fill-[#d99554] text-[#d99554]" : "text-muted"} />)}
                  </div>
                </div>
                <p className="mt-3 text-sm text-foreground/90 leading-relaxed">{r.comment}</p>
                {r.images.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {r.images.map((img, j) => <img key={j} src={img} alt="review" className="size-16 rounded-xl object-cover" />)}
                  </div>
                )}
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={() => setLikedIds(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; })}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition ${likedIds.has(i) ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground hover:bg-accent"}`}
                  >
                    <ThumbsUp size={12} /> Hữu ích ({r.likes + (likedIds.has(i) ? 1 : 0)})
                  </button>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground">
                Chưa có đánh giá nào cho mức sao này.
              </div>
            )}
          </div>
        </div>

        {/* Write review form */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="rounded-[2rem] border bg-card p-6">
            <h2 className="text-2xl">Viết đánh giá</h2>
            {submitted ? (
              <div className="mt-5 rounded-2xl bg-[#eef7ed] p-5 text-sm text-[#355c31]">
                ✓ Cảm ơn bạn đã đánh giá! Nhận xét sẽ được hiển thị ngay bên dưới.
                <button onClick={() => { setSubmitted(false); setRating(0); setComment(""); }} className="mt-3 block text-[#355c31] underline">Đánh giá thêm</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold">Xếp hạng *</label>
                  <StarPicker value={rating} onChange={setRating} />
                  {rating > 0 && <p className="mt-1 text-sm text-primary font-medium">{ratingLabels[rating]}</p>}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold">Nhận xét *</label>
                  <textarea
                    rows={5}
                    required
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này…"
                    className="w-full resize-none rounded-xl border bg-input-background p-3 text-sm outline-none focus:border-primary transition"
                  />
                  <p className="mt-1 text-xs text-muted-foreground text-right">{comment.length}/500</p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold">Thêm ảnh (tùy chọn)</label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed bg-secondary p-4 text-sm text-muted-foreground hover:bg-accent transition">
                    <Camera size={18} /> Chọn ảnh từ thiết bị
                    <input type="file" accept="image/*" multiple className="hidden" />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={rating === 0 || !comment.trim()}
                  className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-[#57311e] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Gửi đánh giá
                </button>
                <p className="text-center text-xs text-muted-foreground">Đánh giá sẽ được hiển thị trực tiếp sau khi bạn gửi.</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

