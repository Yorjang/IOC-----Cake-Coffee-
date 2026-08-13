import React, { useState } from 'react';
import { X, Star, Award, Check, Camera, Sparkles, Loader2, Coins } from 'lucide-react';
import { env } from '../../../../config/env';
import { getAccessToken } from '../../../components/authSession';
import { toast } from 'sonner';
import { supabase } from '../../../../config/supabase';

interface CreateReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  productId: string;
  productName: string;
  variantName?: string;
  productImage?: string;
  onSuccess?: () => void;
}

const PREDEFINED_TAGS = [
  'Cốt bánh mềm mịn',
  'Ít ngọt, vừa vị',
  'Trang trí đẹp mắt',
  'Đóng gói cẩn thận',
  'Giao hàng hỏa tốc',
  'Phục vụ tận tình',
];

const RATING_LABELS = [
  '',
  'Tệ (1/5 sao)',
  'Chưa hài lòng (2/5 sao)',
  'Bình thường (3/5 sao)',
  'Rất ngon (4/5 sao)',
  'Tuyệt vời! (5/5 sao)',
];

export function CreateReviewModal({
  isOpen,
  onClose,
  orderId,
  productId,
  productName,
  variantName,
  productImage,
  onSuccess,
}: CreateReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rewardPoints, setRewardPoints] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước file tối đa là 5MB.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `reviews/${fileName}`;

      const { error } = await supabase.storage
        .from('cakeandcoffee')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('cakeandcoffee')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Lỗi khi tải ảnh lên.");
    } finally {
      setUploading(false);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Vui lòng chọn số sao đánh giá!');
      return;
    }

    const token = getAccessToken();
    if (!token) {
      toast.error('Vui lòng đăng nhập để đánh giá!');
      return;
    }

    const tagsText = selectedTags.length > 0 ? selectedTags.join(', ') : '';
    const finalComment = comment.trim()
      ? tagsText
        ? `[${tagsText}] ${comment.trim()}`
        : comment.trim()
      : tagsText || 'Sản phẩm tuyệt vời!';

    setSubmitting(true);
    try {
      const res = await fetch(`${env.API_URL}/reviews/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          productId,
          rating,
          comment: finalComment,
          imageUrl: imageUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Không thể gửi đánh giá');
      }

      const pointsEarned = data.pointsEarned || 20;
      setRewardPoints(pointsEarned);
      toast.success(`Gửi đánh giá thành công! Bạn tích được +${pointsEarned} điểm.`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Lỗi khi gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in" onClick={onClose}>
      <div 
        className="bg-card text-foreground border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2.5">
            <Sparkles className="size-5 text-amber-500" />
            <h3 className="font-bold text-base text-foreground">Đánh giá sản phẩm</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {rewardPoints !== null ? (
            /* Celebration Points Reward State */
            <div className="py-6 text-center space-y-5 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto shadow-inner animate-bounce">
                <Coins size={36} />
              </div>

              <div>
                <h4 className="text-xl font-bold text-foreground">Cảm ơn bạn đã đánh giá!</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Nhận xét của bạn giúp Sweet Bean cải thiện chất lượng phục vụ ngày càng tốt hơn.
                </p>
              </div>

              {/* Points Card */}
              <div className="p-5 rounded-2xl border-2 border-dashed border-amber-400 bg-amber-500/10 text-amber-900 dark:text-amber-200 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  🎉 ĐÃ TÍCH THÊM VÀO TÀI KHOẢN
                </p>
                <div className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5">
                  <Award size={28} />
                  <span>+{rewardPoints} ĐIỂM THƯỞNG</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Số điểm đã được cộng trực tiếp vào ví điểm của bạn.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onSuccess?.();
                  onClose();
                }}
                className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors shadow-md"
              >
                Hoàn tất
              </button>
            </div>
          ) : (
            /* Review Input Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Product Info */}
              <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border flex items-center gap-3">
                {productImage ? (
                  <img
                    src={productImage}
                    alt={productName}
                    className="w-12 h-12 rounded-xl object-cover border border-border/50 shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0 border border-primary/10">
                    🍰
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-foreground truncate">{productName}</h4>
                  {variantName && (
                    <p className="text-xs text-muted-foreground truncate">Phân loại: {variantName}</p>
                  )}
                </div>
              </div>

              {/* Star Rating Picker */}
              <div className="text-center py-2 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Bạn cảm thấy món ăn/đồ uống này thế nào?
                </p>
                <div className="flex justify-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((i) => {
                    const active = (hoverRating || rating) >= i;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRating(i)}
                        onMouseEnter={() => setHoverRating(i)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-115 p-1"
                      >
                        <Star
                          size={30}
                          className={
                            active
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-muted-foreground/30'
                          }
                        />
                      </button>
                    );
                  })}
                </div>
                {rating > 0 && (
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    {RATING_LABELS[rating]}
                  </p>
                )}
              </div>

              {/* Tag Chips */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Điểm nổi bật:
                </p>
                <div className="flex flex-wrap gap-2">
                  {PREDEFINED_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-primary/15 border-primary text-primary font-semibold'
                            : 'bg-secondary/60 border border-border text-foreground/80 hover:bg-secondary'
                        }`}
                      >
                        {isSelected && <Check size={12} className="inline mr-1" />}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comment Textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Nhận xét chi tiết (không bắt buộc):
                </label>
                <textarea
                  rows={3}
                  placeholder="Chia sẻ cảm nhận về hương vị, độ ngọt, lớp kem hoặc thái độ giao hàng nhé..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-input-background p-3 text-xs outline-none focus:border-primary text-foreground resize-none leading-relaxed"
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Đính kèm hình ảnh (nếu có):
                </label>
                <div className="flex items-center gap-3 mt-1">
                  {imageUrl ? (
                    <div className="relative size-16 rounded-xl border border-border overflow-hidden shrink-0 group">
                      <img src={imageUrl} alt="Review attachment" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="absolute inset-0 bg-black/60 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white font-semibold"
                      >
                        Xóa
                      </button>
                    </div>
                  ) : (
                    <label className="flex size-16 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shrink-0">
                      {uploading ? (
                        <Loader2 className="animate-spin text-primary" size={18} />
                      ) : (
                        <>
                          <Camera size={18} className="mb-1" />
                          <span className="text-[10px] font-medium">Thêm ảnh</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || rating === 0}
                className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Award size={18} />
                <span>{submitting ? 'Đang gửi...' : 'Gửi Đánh Giá & Tích Điểm'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
