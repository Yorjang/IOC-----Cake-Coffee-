import { LogOut } from "lucide-react";
import { VIEW_KEYS } from "../../config/appConfig";

const MOCK_ORDERS = [
  { id: "SB98124", date: "05/07/2026", items: "1x Cafe Latte, 1x Bánh Tiramisu", total: "100.000đ", status: "Đã hoàn thành" },
  { id: "SB97512", date: "28/06/2026", items: "1x Bánh sinh nhật socola", total: "350.000đ", status: "Đã hoàn thành" },
  { id: "SB99401", date: "07/07/2026", items: "2x Matcha Latte, 1x Bánh mousse xoài", total: "178.000đ", status: "Đang giao" },
];

const FALLBACK_USER = {
  name: "Nguyễn Minh Anh",
  email: "minhanh@email.com",
  phone: "0987 654 321",
  address: "123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh",
};

export function Profile({ user, setView, onLogout }: any) {
  const displayUser = user || FALLBACK_USER;
  const initial = (displayUser.name || displayUser.fullName || "M").charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-6 lg:px-10">
      <h2 className="mb-6 text-2xl md:text-3xl font-bold font-serif">Hồ sơ cá nhân</h2>
      <div className="grid gap-8 md:grid-cols-3">

        {/* Avatar card */}
        <div className="md:col-span-1 rounded-2xl border bg-card p-6 h-fit text-center space-y-4">
          <div className="size-20 rounded-full bg-primary text-primary-foreground font-bold text-2xl flex items-center justify-center mx-auto">
            {initial}
          </div>
          <div>
            <h3 className="font-bold text-lg">{displayUser.name || displayUser.fullName}</h3>
            <p className="text-xs text-muted-foreground">{displayUser.email}</p>
          </div>
          <div className="border-t pt-4 text-left text-sm space-y-2 text-muted-foreground">
            <p><strong className="text-foreground">Điện thoại:</strong> {displayUser.phone || "Chưa thiết lập"}</p>
            <p><strong className="text-foreground">Địa chỉ:</strong> {displayUser.address || "Chưa thiết lập"}</p>
          </div>
          <button onClick={onLogout} className="w-full rounded-xl border border-red-200 text-red-500 hover:bg-red-50 py-2.5 text-sm font-semibold transition flex items-center justify-center gap-1">
            <LogOut size={14} /> Đăng xuất
          </button>
        </div>

        {/* Order history */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl border bg-card p-6">
            <h3 className="font-bold text-lg font-serif mb-4">Lịch sử đơn hàng</h3>
            {MOCK_ORDERS.length > 0 ? (
              <div className="space-y-4">
                {MOCK_ORDERS.map(o => (
                  <div key={o.id} className="border-b pb-4 last:border-0 last:pb-0 text-sm flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-primary">{o.id}</p>
                      <p className="text-xs text-muted-foreground">{o.date}</p>
                      <p className="text-muted-foreground mt-1">{o.items}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{o.total}</p>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold mt-1 ${o.status === "Đang giao" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Bạn chưa có đơn hàng nào.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
