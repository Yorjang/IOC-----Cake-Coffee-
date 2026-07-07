import { useState } from "react";
import { Star, ThumbsUp, Camera, ChevronDown } from "lucide-react";

const products = [
  ["Bánh Tiramisu", "45.000đ", "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=120&h=120&fit=crop&auto=format"],
  ["Cafe Latte", "55.000đ", "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=120&h=120&fit=crop&auto=format"],
  ["Bánh mousse xoài", "60.000đ", "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=120&h=120&fit=crop&auto=format"],
];

const existingReviews = [
  { user: "Nguyễn Minh Anh", avatar: "N", rating: 5, date: "20/06/2025", comment: "Bánh ngon tuyệt, cream mịn, không ngọt quá. Giao hàng nhanh!", likes: 12, verified: true, images: ["https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=80&h=80&fit=crop&auto=format"] },
  { user: "Trần Thị Bình", avatar: "T", rating: 5, date: "18/06/2025", comment: "Mình đặt bánh sinh nhật cho con, cả nhà khen ngon. Hộp đóng gói đẹp, không bị méo. Sẽ mua lại!", likes: 8, verified: true, images: [] },
  { user: "Lê Văn Cường", avatar: "L", rating: 4, date: "15/06/2025", comment: "Tiramisu đúng vị Ý, cà phê đậm đà. Chỉ tiếc là lần này giao hơi muộn 15 phút.", likes: 5, verified: false, images: [] },
  { user: "Phạm Thu Hà", avatar: "P", rating: 5, date: "10/06/2025", comment: "Lần thứ 5 mình order rồi, chất lượng ổn định, nhân viên nhiệt tình. Tuyệt vời!", likes: 20, verified: true, images: ["https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=80&h=80&fit=crop&auto=format", "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=80&h=80&fit=crop&auto=format"] },
  { user: "Vũ Đức Minh", avatar: "V", rating: 3, date: "05/06/2025", comment: "Vị okay nhưng giá hơi cao so với phần ăn. Phù hợp làm quà hơn là ăn thường ngày.", likes: 2, verified: false, images: [] },
];

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

export function ReviewPage() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [filterRating, setFilterRating] = useState(0);
  const [sortBy, setSortBy] = useState("newest");
  const [selectedProduct, setSelectedProduct] = useState(0);
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());

  const avgRating = (existingReviews.reduce((a, r) => a + r.rating, 0) / existingReviews.length).toFixed(1);
  const dist = [5, 4, 3, 2, 1].map(r => ({ r, count: existingReviews.filter(x => x.rating === r).length }));

  const filtered = existingReviews
    .filter(r => filterRating === 0 || r.rating === filterRating)
    .sort((a, b) => sortBy === "highest" ? b.rating - a.rating : sortBy === "lowest" ? a.rating - b.rating : b.likes - a.likes);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0 || !comment.trim()) return;
    setSubmitted(true);
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* Breadcrumb */}
      <p className="text-sm text-muted-foreground">Trang chủ / Bánh Tiramisu / Đánh giá</p>

      {/* Product context */}
      <div className="mt-5 flex flex-wrap items-center gap-5 rounded-[2rem] border bg-card p-6">
        <img src={products[selectedProduct][2]} alt={products[selectedProduct][0]} className="size-20 rounded-2xl object-cover" />
        <div className="flex-1">
          <h1 className="text-3xl">{products[selectedProduct][0]}</h1>
          <p className="mt-1 text-muted-foreground">{products[selectedProduct][1]}</p>
        </div>
        <select
          className="rounded-xl border bg-input-background px-3 py-2 text-sm outline-none focus:border-primary"
          value={selectedProduct}
          onChange={e => setSelectedProduct(+e.target.value)}
        >
          {products.map((p, i) => <option key={i} value={i}>{p[0]}</option>)}
        </select>
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
                  {[1,2,3,4,5].map(i => <Star key={i} size={16} className="fill-[#d99554] text-[#d99554]" />)}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{existingReviews.length} đánh giá</p>
              </div>
              <div className="flex-1 space-y-2 min-w-[160px]">
                {dist.map(({ r, count }) => (
                  <button key={r} onClick={() => setFilterRating(filterRating === r ? 0 : r)} className={`flex w-full items-center gap-3 rounded-xl px-2 py-1 text-sm transition ${filterRating === r ? "bg-secondary" : "hover:bg-secondary/50"}`}>
                    <span className="w-4 text-right text-muted-foreground">{r}</span>
                    <Star size={12} className="fill-[#d99554] text-[#d99554]" />
                    <div className="flex-1 h-2 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-[#d99554]" style={{ width: `${(count / existingReviews.length) * 100}%` }} />
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
                <button key={r} onClick={() => setFilterRating(filterRating === r ? -1 : r)} className={`rounded-full px-3 py-1.5 text-sm transition ${filterRating === r ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent"}`}>
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
                    {[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= r.rating ? "fill-[#d99554] text-[#d99554]" : "text-muted"} />)}
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
                ✓ Cảm ơn bạn đã đánh giá! Nhận xét sẽ được hiển thị sau khi duyệt.
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
                <p className="text-center text-xs text-muted-foreground">Đánh giá sẽ được kiểm duyệt trước khi hiển thị.</p>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
