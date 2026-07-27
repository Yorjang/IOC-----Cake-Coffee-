import { useState, useEffect } from "react";
import { Star, ThumbsUp, Camera, ArrowLeft } from "lucide-react";
import { env } from "../../config/env";
import { getAccessToken } from "./authSession";
import { toast } from "sonner";


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

const ratingLabels = ["", "Tệ (1/5 sao)", "Không tốt (2/5 sao)", "Bình thường (3/5 sao)", "Tuyệt vời (4/5 sao)", "Xuất sắc! (5/5 sao)"];

const predefinedTags = [
  "Cốt bánh mềm mịn",
  "Ít ngọt, dễ ăn",
  "Trang trí đẹp",
  "Đóng gói chống sốc tốt",
  "Giao hàng nhanh"
];

export function ReviewPage({ product, onBack, isEmbedded = false }: any) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [filterRating, setFilterRating] = useState(0);
  const [sortBy, setSortBy] = useState("newest");
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  if (!product) return null;

  const displayProductName = product[0];
  const displayProductPrice = product[1];
  const displayProductImage = product[3];

  const productId = product.raw?.id;

  const loadReviews = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const res = await fetch(`${env.API_URL}/reviews/product/${productId}`);
      if (res.ok) {
        const data = await res.json();
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
    : "5.0";
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
    if (rating === 0) return;

    const tagsText = selectedTags.join(", ");
    const finalComment = selectedTags.length > 0
      ? comment.trim() ? `${tagsText} - ${comment.trim()}` : tagsText
      : comment.trim();

    if (!finalComment) return;

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
          comment: finalComment
        })
      });

      const resData = await res.json();
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

  const Container = isEmbedded ? "div" : "main";
  const containerProps = isEmbedded ? { className: "mt-12", id: "reviews-section" } : { className: "mx-auto max-w-5xl px-4 py-8", id: "reviews-section" };

  return (
    <Container {...containerProps}>
      {!isEmbedded && (
        <>
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
        </>
      )}

      <div className={`${isEmbedded ? "" : "mt-8"} grid gap-8 lg:grid-cols-[1fr_360px]`}>
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
                <p className="mt-3 text-sm text-foreground/90 leading-relaxed">
                  {r.comment.startsWith("[") && r.comment.includes("]")
                    ? r.comment.replace(/^\[(.*?)\]\s*/, (match: any, tags: string) => tags + (r.comment.length > match.length ? " - " : ""))
                    : r.comment}
                </p>
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

        {/* Write review form - Styled specifically for Sweet Bean Concept */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="bg-white p-6 rounded-3xl shadow-xl w-full border border-[#F3EFEA]">
            
            {/* Header: Product Info */}
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                <img src={displayProductImage} alt={displayProductName} className="w-16 h-16 rounded-2xl object-cover shadow-sm" />
                <div>
                    <h2 className="text-base font-bold text-[#4A3B32]">{displayProductName}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Mã SP: {productId || "FNB-92814"}</p>
                </div>
            </div>

            {submitted ? (
              <div className="rounded-2xl bg-[#eef7ed] p-5 text-sm text-[#355c31] text-center mb-4">
                <p className="font-semibold mb-2">Cảm ơn bạn đã gửi đánh giá!</p>
                <p className="text-xs mb-4">Nhận xét sẽ được hiển thị ngay bên dưới.</p>
                <button onClick={() => { setSubmitted(false); setRating(0); setComment(""); setSelectedTags([]); }} className="inline-block px-4 py-2 bg-white rounded-full text-[#355c31] border border-[#355c31] transition hover:bg-[#eef7ed]">Đánh giá thêm</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Rating Stars */}
                <div className="text-center mb-6">
                    <p className="text-sm font-medium text-gray-600 mb-2">Hương vị món này thế nào bạn ơi?</p>
                    <div className="flex justify-center">
                      <StarPicker value={rating} onChange={setRating} />
                    </div>
                    {rating > 0 && <p className="text-xs font-semibold text-amber-600 mt-1">{ratingLabels[rating]}</p>}
                </div>

                {/* Tags / Chips */}
                <div className="mb-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Điểm bạn thích nhất ở món này:</p>
                    <div className="flex flex-wrap gap-2">
                        {predefinedTags.map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`px-3.5 py-1.5 text-xs rounded-full transition ${
                              selectedTags.includes(tag) 
                                ? "border border-[#8C6D53] text-[#8C6D53] bg-[#F3EFEA] font-medium" 
                                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                    </div>
                </div>

                {/* Comment Textarea */}
                <div className="mb-4">
                    <textarea 
                      className="w-full border border-gray-200 rounded-2xl p-3 text-sm text-gray-700 focus:outline-none focus:border-[#8C6D53] focus:ring-1 focus:ring-[#8C6D53] resize-none h-24 bg-[#FAFAFA]" 
                      placeholder="Chia sẻ thêm cảm nhận về độ ngọt, lớp kem hoặc phần trà sữa nhé..."
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                    ></textarea>
                </div>

                {/* Image Upload */}
                <label className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 rounded-2xl p-3 text-gray-500 hover:bg-[#FAF7F2] cursor-pointer transition mb-6">
                    <Camera className="w-5 h-5 text-[#8C6D53]" />
                    <span className="text-xs font-semibold text-gray-600">Thêm ảnh chụp thực tế (Nhận mã giảm 10%)</span>
                    <input type="file" className="hidden" accept="image/*" />
                </label>

                {/* Submit Button */}
                <button 
                  type="submit"
                  disabled={rating === 0}
                  className="w-full bg-[#8C6D53] hover:bg-[#73573F] text-white font-semibold text-sm py-3 rounded-2xl transition shadow-md shadow-[#8C6D53]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Gửi Đánh Giá Ngay
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}

