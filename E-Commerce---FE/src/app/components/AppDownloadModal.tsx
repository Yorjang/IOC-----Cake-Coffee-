import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Smartphone, Download, QrCode, CheckCircle2 } from "lucide-react";

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  apkUrl?: string;
  playStoreUrl?: string;
  appStoreUrl?: string;
}

export function AppDownloadModal({ isOpen, onClose, apkUrl, playStoreUrl, appStoreUrl }: AppDownloadModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  // Priority: Custom APK -> Google Play Store -> App Store -> Default Build Page
  const downloadLink = playStoreUrl || appStoreUrl || apkUrl || "https://expo.dev/accounts/b1leazy/projects/cake-coffee-app/builds";

  const modalContent = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#FFFDF9] border border-amber-950/10 rounded-3xl shadow-2xl p-6 sm:p-8 text-foreground max-h-[90vh] overflow-y-auto my-auto shadow-black/30">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-100/80 text-[#D84315] flex items-center justify-center mb-3 shadow-inner">
            <Smartphone size={32} />
          </div>
          <h2 className="text-xl font-bold text-[#3E2723]">Tải App Sweet Bean Android</h2>
          <p className="text-xs text-[#6D4C41] mt-1"> Trải nghiệm tích điểm, nhận voucher ưu đãi & đặt hàng nhanh chóng trên điện thoại!</p>
        </div>

        {/* QR Code Section */}
        <div className="bg-amber-50/60 border border-amber-200/50 rounded-2xl p-4 flex flex-col items-center justify-center mb-6 text-center">
          <div className="bg-white p-2.5 rounded-xl shadow-md border border-amber-100 mb-2">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(downloadLink)}`}
              alt="QR Code Tải App"
              className="w-32 h-32 object-contain"
            />
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#8D6E63]">
            <QrCode size={14} className="text-[#D84315]" />
            Quét mã QR bằng Camera điện thoại để tải ngay
          </div>
        </div>

        {/* Main Action Buttons */}
        <div className="space-y-3 mb-6">
          <a
            href={downloadLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-[#D84315] hover:bg-[#BF360C] text-white text-sm font-bold rounded-full shadow-lg shadow-amber-900/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download size={18} />
            TẢI NGAY ỨNG DỤNG SWEET BEAN
          </a>

          <a
            href="http://localhost:8081"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white hover:bg-gray-50 border border-gray-200 text-[#5D4037] text-xs font-semibold rounded-full transition-all"
          >
            Trải nghiệm bản Mobile Web (Local)
          </a>
        </div>

        {/* Instructions */}
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-xs font-bold text-[#3E2723] uppercase tracking-wider mb-2">Hướng dẫn cài đặt:</h4>
          <ul className="space-y-1.5 text-[11px] text-[#6D4C41]">
            <li className="flex items-start gap-1.5">
              <CheckCircle2 size={13} className="text-[#4CAF50] shrink-0 mt-0.5" />
              <span><strong>Bước 1:</strong> Bấm nút <strong>Tải ngay ứng dụng Sweet Bean</strong> hoặc quét mã QR ở trên.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 size={13} className="text-[#4CAF50] shrink-0 mt-0.5" />
              <span><strong>Bước 2:</strong> Mở file vừa tải về trong mục <strong>Tải Về (Downloads)</strong>.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 size={13} className="text-[#4CAF50] shrink-0 mt-0.5" />
              <span><strong>Bước 3:</strong> Cho phép <strong>"Cài đặt từ nguồn này"</strong> và bấm Cài Đặt.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 size={13} className="text-[#4CAF50] shrink-0 mt-0.5" />
              <span><strong>Lưu ý:</strong> Nếu file tải về chưa có đuôi <strong>.apk</strong> ở cuối tên file, hãy nhấn giữ file chọn <strong>Đổi tên (Rename)</strong> và thêm <strong>.apk</strong> vào cuối.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
