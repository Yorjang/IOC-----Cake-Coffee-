import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Smartphone, QrCode, CircleCheck, Sparkles, Apple, Download } from "lucide-react";

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  playStoreUrl?: string;
  appStoreUrl?: string;
  apkUrl?: string;
}

export function AppDownloadModal({
  isOpen,
  onClose,
  playStoreUrl,
  appStoreUrl,
  apkUrl,
}: AppDownloadModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  // Custom store links or defaults
  const googlePlayLink = playStoreUrl || "https://play.google.com/store/apps/details?id=com.sweetbean.cakecoffeeapp";
  const appleStoreLink = appStoreUrl || "https://apps.apple.com/app/sweet-bean-coffee-cake/id123456789";
  const apkLink = apkUrl || "https://drive.google.com/drive/u/0/folders/1_cih0h2a4YWTwG4RnQE32grrL3J9IADi";

  const modalContent = (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-xl bg-[#FFFDF9] border border-amber-950/15 rounded-3xl shadow-2xl p-6 sm:p-8 text-foreground max-h-[90vh] overflow-y-auto no-scrollbar my-auto shadow-amber-950/20 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 p-2 rounded-full text-amber-900/40 hover:text-amber-900 hover:bg-amber-100/60 transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Top Header Badge */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D84315] to-[#BF360C] text-white flex items-center justify-center shadow-lg shadow-amber-900/20">
              <Smartphone size={32} />
            </div>
            <span className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[#3E2723] text-[10px] font-extrabold shadow">
              <Sparkles size={12} />
            </span>
          </div>

          <h2 className="text-2xl font-bold text-[#3E2723] tracking-tight">Tải Ứng Dụng Sweet Bean</h2>
          <p className="text-xs text-[#6D4C41] mt-1.5 max-w-xs leading-relaxed">
            Đặt hàng cực nhanh • Tích điểm đổi quà • Nhận voucher ưu đãi 50K cho thành viên mới!
          </p>
        </div>

        {/* 2 Column Layout: Android QR + iOS QR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          
          {/* Column 1: Android (Google Play + Direct APK Drive) */}
          <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4 flex flex-col items-center text-center shadow-inner">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#D84315] mb-3 uppercase tracking-wider">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.552 0 .9997.4482.9997.9993s-.4477.9997-.9997.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.552 0 .9997.4482.9997.9993s-.4477.9997-.9997.9997m11.4045-6.02l1.9973-3.4592c.1232-.2132.05-.4864-.1632-.6096-.2132-.1232-.4864-.05-.6096.1632l-2.0224 3.5028c-1.5604-.7124-3.3283-1.1278-5.2155-1.1278s-3.6551.4154-5.2155 1.1278l-2.0224-3.5028c-.1232-.2132-.3964-.2864-.6096-.1632-.2132.1232-.2864.3964-.1632.6096l1.9973 3.4592c-3.1362 1.7061-5.2505 4.8878-5.464 8.6543h23.0006c-.2135-3.7665-2.3278-6.9482-5.464-8.6543" />
              </svg>
              <span>Dành cho Android</span>
            </div>

            <div className="bg-white p-2.5 rounded-2xl shadow-md border border-amber-100 mb-3">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(apkLink)}`}
                alt="Mã QR Android APK"
                className="w-32 h-32 object-contain"
              />
            </div>
            
            <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-[#8D6E63] mb-3">
              <QrCode size={13} className="text-[#D84315]" />
              Quét mã QR tải APK Android
            </div>

            {/* Direct APK Download Button (Google Drive) */}
            <a
              href={apkLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-gradient-to-r from-[#D84315] to-[#BF360C] hover:from-[#BF360C] hover:to-[#9E2A0B] text-white rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] border border-amber-600/40 mb-2"
            >
              <Download size={18} className="shrink-0 text-amber-200" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase font-medium tracking-wider text-amber-100/90">Link Google Drive</span>
                <span className="text-xs font-bold tracking-wide">Tải File APK App</span>
              </div>
            </a>

            {/* Google Play Button */}
            <a
              href={googlePlayLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full py-2 px-3 bg-gradient-to-r from-gray-900 via-black to-gray-900 hover:from-black hover:to-gray-800 text-white rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] border border-gray-700/50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M3.609 1.814L13.792 12 3.61 22.186c-.198-.182-.317-.442-.317-.732V2.546c0-.29.119-.55.317-.732z"/>
                <path fill="#34A853" d="M17.156 8.636l-3.364 3.364L3.609 1.814C3.805 1.632 4.07 1.5 4.372 1.5c.29 0 .55.119.732.317l12.052 6.819z"/>
                <path fill="#4285F4" d="M17.156 15.364L5.104 22.183c-.182.198-.442.317-.732.317-.302 0-.567-.132-.763-.314l10.183-10.183 3.364 3.361z"/>
                <path fill="#FBBC05" d="M21.144 10.97l-3.988-2.334-3.364 3.364 3.364 3.364 3.988-2.334c.563-.33.912-.924.912-1.57 0-.646-.349-1.24-.912-1.57z"/>
              </svg>
              <div className="flex flex-col text-left">
                <span className="text-[8px] uppercase font-medium tracking-wider text-gray-300">Tải trên</span>
                <span className="text-[11px] font-bold tracking-wide">Google Play</span>
              </div>
            </a>
          </div>

          {/* Column 2: iOS (App Store) */}
          <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4 flex flex-col items-center text-center shadow-inner justify-between">
            <div className="w-full flex flex-col items-center">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#D84315] mb-3 uppercase tracking-wider">
                <Apple size={16} />
                <span>Dành cho iOS (iPhone)</span>
              </div>

              <div className="bg-white p-2.5 rounded-2xl shadow-md border border-amber-100 mb-3">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(appleStoreLink)}`}
                  alt="Mã QR iOS"
                  className="w-32 h-32 object-contain"
                />
              </div>
              
              <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-[#8D6E63] mb-3">
                <QrCode size={13} className="text-[#D84315]" />
                Quét mã QR iOS / iPhone
              </div>
            </div>

            {/* App Store Button */}
            <a
              href={appleStoreLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full py-3 px-3 bg-black hover:bg-gray-900 text-white rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] border border-gray-800 mt-auto"
            >
              <Apple size={22} className="shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase font-medium tracking-wider text-gray-300">Download on</span>
                <span className="text-xs font-bold tracking-wide">App Store</span>
              </div>
            </a>
          </div>

        </div>

        {/* Instructions */}
        <div className="border-t border-amber-900/10 pt-4">
          <h4 className="text-xs font-bold text-[#3E2723] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            ⚡ Hướng dẫn tải về:
          </h4>
          <ul className="space-y-1.5 text-[11px] text-[#6D4C41]">
            <li className="flex items-start gap-2">
              <CircleCheck size={14} className="text-[#4CAF50] shrink-0 mt-0.5" />
              <span><strong>Tải File APK Android (Google Drive):</strong> Bấm nút <strong>Tải File APK App</strong> để truy cập thư mục Google Drive chứa file .apk và cài đặt trực tiếp.</span>
            </li>
            <li className="flex items-start gap-2">
              <CircleCheck size={14} className="text-[#4CAF50] shrink-0 mt-0.5" />
              <span><strong>Mã QR:</strong> Dùng camera điện thoại quét mã QR tương ứng ở cột <strong>Android</strong> hoặc <strong>iOS</strong> để tải app.</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
