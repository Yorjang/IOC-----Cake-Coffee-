import { useState, useRef, useEffect } from "react";
import { LogOut, User, Lock, Phone, Upload, Image as ImageIcon, History, Save, ShieldAlert, Check } from "lucide-react";
import { toast } from "sonner";
import { env } from "../../config/env";
import { getAccessToken } from "../components/authSession";

const MOCK_ORDERS = [
  { id: "SB98124", date: "05/07/2026", items: "1x Cafe Latte, 1x Bánh Tiramisu", total: "100.000đ", status: "Đã hoàn thành" },
  { id: "SB97512", date: "28/06/2026", items: "1x Bánh sinh nhật socola", total: "350.000đ", status: "Đã hoàn thành" },
  { id: "SB99401", date: "07/07/2026", items: "2x Matcha Latte, 1x Bánh mousse xoài", total: "178.000đ", status: "Đang giao" },
];

const PRESET_AVATARS = [
  { name: "Coffee", url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=150&auto=format&fit=crop&q=60" },
  { name: "Cupcake", url: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=150&auto=format&fit=crop&q=60" },
  { name: "Donut", url: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=150&auto=format&fit=crop&q=60" },
  { name: "Croissant", url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=150&auto=format&fit=crop&q=60" },
  { name: "Tiramisu", url: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=150&auto=format&fit=crop&q=60" },
];

const FALLBACK_USER = {
  fullName: "Nguyễn Minh Anh",
  email: "minhanh@email.com",
  phone: "0987654321",
  avatar: "",
};

export function Profile({ user, setUser, setView, onLogout }: any) {
  const displayUser = user || FALLBACK_USER;

  // Tabs: 'info' | 'password' | 'orders'
  const [activeTab, setActiveTab] = useState<"info" | "password" | "orders">("info");

  // Profile Form States
  const [fullName, setFullName] = useState(displayUser.fullName || displayUser.name || "");
  const [phone, setPhone] = useState(displayUser.phone || "");
  const [avatar, setAvatar] = useState(displayUser.avatarUrl || displayUser.avatar || "");
  const [address, setAddress] = useState(displayUser.address || "");
  const [isCustomAvatarUrl, setIsCustomAvatarUrl] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [loadingInfo, setLoadingInfo] = useState(false);

  // Password Form States
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const fetchMyOrders = async () => {
    const token = getAccessToken();
    if (!token) return;
    setLoadingOrders(true);
    try {
      const res = await fetch(`${env.API_URL}/orders/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Error fetching my orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (activeTab === "orders") {
      fetchMyOrders();
    }
  }, [activeTab]);

  // Sync state if user prop updates
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || user.name || "");
      setPhone(user.phone || "");
      setAvatar(user.avatarUrl || user.avatar || "");
      setAddress(user.address || "");
    }
  }, [user]);

  const initial = (fullName || "M").charAt(0).toUpperCase();

  // Handle local image upload as base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        toast.error("Ảnh đại diện phải nhỏ hơn 1MB!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
        toast.success("Tải ảnh đại diện lên thành công!");
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit profile details update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Họ và tên không được để trống!");
      return;
    }

    setLoadingInfo(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`${env.API_URL}/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          phone: phone || undefined,
          avatar: avatar || undefined,
          address: address || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Không thể cập nhật thông tin cá nhân");
      }

      // Update user in context and localStorage
      const updatedUser = { ...displayUser, ...data };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      if (setUser) setUser(updatedUser);

      toast.success("Cập nhật thông tin cá nhân thành công!");
    } catch (err: any) {
      toast.error(err.message || "Đã xảy ra lỗi khi lưu thông tin.");
    } finally {
      setLoadingInfo(false);
    }
  };

  // Submit password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      toast.error("Vui lòng nhập mật khẩu cũ!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Xác nhận mật khẩu mới không khớp!");
      return;
    }

    setLoadingPassword(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`${env.API_URL}/users/change-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Đổi mật khẩu thất bại");
      }

      toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        onLogout();
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || "Đã xảy ra lỗi khi đổi mật khẩu.");
    } finally {
      setLoadingPassword(false);
    }
  };

  const applyCustomUrl = () => {
    if (customUrlInput.trim()) {
      setAvatar(customUrlInput.trim());
      setIsCustomAvatarUrl(false);
      setCustomUrlInput("");
      toast.success("Đã áp dụng link ảnh đại diện mới!");
    }
  };

  return (
    <div className="w-full mx-auto px-4 sm:px-8 lg:px-12 xl:px-20 py-8 min-h-screen">
      {/* Title */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold font-serif text-foreground">Hồ sơ của tôi</h2>
        <p className="text-muted-foreground text-sm mt-1">Quản lý thông tin tài khoản, đơn hàng và mật khẩu của bạn.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Side: Avatar Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border bg-card p-6 text-center space-y-5 shadow-sm relative overflow-hidden">
            {/* Header background accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />

            <div className="relative group mx-auto w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 shadow-inner flex items-center justify-center bg-secondary">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-4xl text-primary">{initial}</span>
              )}

            </div>

            <div>
              <h3 className="font-bold text-xl text-foreground font-serif">{fullName}</h3>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary capitalize">
                Thành viên
              </span>
              <p className="text-xs text-muted-foreground mt-2">{displayUser.email}</p>
            </div>

            <div className="border-t pt-4 text-left text-sm space-y-3 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-primary" />
                <span>
                  <strong className="text-foreground">Điện thoại:</strong> {phone || "Chưa thiết lập"}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Detail Panels */}
        <div className="lg:col-span-8 space-y-6">
          {/* Navigation Tabs */}
          <div className="flex rounded-xl bg-secondary p-1 border border-border shadow-sm">
            <button
              onClick={() => setActiveTab("info")}
              className={`flex-1 rounded-lg py-2.5 text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 ${
                activeTab === "info"
                  ? "bg-background shadow-sm text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User size={16} /> Thông tin cá nhân
            </button>
            <button
              onClick={() => setActiveTab("password")}
              className={`flex-1 rounded-lg py-2.5 text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 ${
                activeTab === "password"
                  ? "bg-background shadow-sm text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Lock size={16} /> Đổi mật khẩu
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex-1 rounded-lg py-2.5 text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 ${
                activeTab === "orders"
                  ? "bg-background shadow-sm text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <History size={16} /> Đơn hàng của tôi
            </button>
          </div>

          {/* Form / Content Area */}
          <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm">
            {/* TAB: Personal Info */}
            {activeTab === "info" && (
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <h3 className="text-xl font-bold font-serif border-b pb-3 mb-4">Cập nhật thông tin cá nhân</h3>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Họ và tên</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full rounded-xl border bg-input-background py-3 pl-10 pr-4 text-sm outline-none focus:border-primary text-foreground"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Số điện thoại</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="tel"
                        placeholder="Ví dụ: 0987654321"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-xl border bg-input-background py-3 pl-10 pr-4 text-sm outline-none focus:border-primary text-foreground"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Địa chỉ Email (Không thể thay đổi)</label>
                  <input
                    type="email"
                    disabled
                    value={displayUser.email}
                    className="w-full rounded-xl border bg-secondary/50 py-3 px-4 text-sm outline-none text-muted-foreground cursor-not-allowed mb-4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Địa chỉ nhận hàng mặc định</label>
                  <input
                    type="text"
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-xl border bg-input-background py-3 px-4 text-sm outline-none focus:border-primary text-foreground"
                  />
                </div>

                {/* Avatar Design Section */}
                <div className="space-y-4 border-t pt-6">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Thiết lập ảnh đại diện</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Chọn một ảnh đại diện ngọt ngào từ thực đơn hoặc tải lên từ thiết bị của bạn.
                    </p>
                  </div>

                  {/* Preset Cards */}
                  <div className="grid grid-cols-5 gap-3">
                    {PRESET_AVATARS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setAvatar(preset.url)}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition ${
                          avatar === preset.url ? "border-primary scale-95 shadow-md" : "border-border hover:border-primary/40"
                        }`}
                        title={preset.name}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        {avatar === preset.url && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <span className="bg-primary text-primary-foreground rounded-full p-0.5">
                              <Check size={12} strokeWidth={3} />
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Custom upload or URL */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl border border-primary/20 text-primary hover:bg-primary/5 py-2.5 px-4 text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <Upload size={14} /> Tải ảnh từ máy
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsCustomAvatarUrl(!isCustomAvatarUrl)}
                      className="rounded-xl border border-border text-foreground hover:bg-secondary py-2.5 px-4 text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <ImageIcon size={14} /> Nhập liên kết ảnh
                    </button>
                  </div>

                  {isCustomAvatarUrl && (
                    <div className="flex gap-2 animate-fadeIn mt-2">
                      <input
                        type="url"
                        placeholder="https://example.com/avatar.jpg"
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        className="flex-1 rounded-xl border bg-input-background py-2 px-3 text-xs outline-none focus:border-primary text-foreground"
                      />
                      <button
                        type="button"
                        onClick={applyCustomUrl}
                        className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-xl px-4 py-2 text-xs font-semibold transition"
                      >
                        Áp dụng
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t pt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={loadingInfo}
                    className="rounded-full bg-primary hover:bg-primary/90 py-3 px-8 text-sm font-semibold text-primary-foreground transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save size={16} />
                    {loadingInfo ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            )}

            {/* TAB: Change Password */}
            {activeTab === "password" && (
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="border-b pb-3 mb-4">
                  <h3 className="text-xl font-bold font-serif text-foreground">Thay đổi mật khẩu</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Đảm bảo mật khẩu của bạn có độ dài tối thiểu là 6 ký tự để giữ tài khoản an toàn.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Mật khẩu hiện tại</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="password"
                        required
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full rounded-xl border bg-input-background py-3 pl-10 pr-4 text-sm outline-none focus:border-primary text-foreground"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Mật khẩu mới</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-xl border bg-input-background py-3 pl-10 pr-4 text-sm outline-none focus:border-primary text-foreground"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Xác nhận mật khẩu mới</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-xl border bg-input-background py-3 pl-10 pr-4 text-sm outline-none focus:border-primary text-foreground"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={loadingPassword}
                    className="rounded-full bg-primary hover:bg-primary/90 py-3 px-8 text-sm font-semibold text-primary-foreground transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <Lock size={16} />
                    {loadingPassword ? "Đang xử lý..." : "Đổi mật khẩu"}
                  </button>
                </div>
              </form>
            )}

            {/* TAB: Order History */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold font-serif border-b pb-3 mb-4">Lịch sử đơn hàng</h3>
                {loadingOrders ? (
                  <div className="text-center py-10 text-muted-foreground">
                    Đang tải lịch sử đơn hàng...
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-4">
                    {(() => {
                      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                      const paginatedOrders = orders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
                      const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);

                      return (
                        <>
                          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2">
                            {paginatedOrders.map((o) => {
                            const itemsStr = o.items
                        ?.map((i: any) => `${i.quantity}x ${i.productName} (${i.variantName})`)
                        .join(", ") || "Không có sản phẩm";

                      const dateStr = new Date(o.createdAt).toLocaleDateString("vi-VN");
                      const priceStr = Number(o.totalAmount).toLocaleString("vi-VN") + "đ";

                      const statusColors: Record<string, string> = {
                        pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                        confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                        preparing: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
                        shipping: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                        completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                        cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      };

                      const getStatusLabel = (status: string) => {
                        const map: Record<string, string> = {
                          pending: "Chờ xác nhận",
                          confirmed: "Đã xác nhận",
                          preparing: "Đang chuẩn bị",
                          shipping: "Đang giao hàng",
                          completed: "Đã hoàn thành",
                          cancelled: "Đã hủy"
                        };
                        return map[status] || status;
                      };

                      return (
                        <div
                          key={o.id}
                          className="border bg-secondary/20 py-2.5 px-3.5 rounded-lg text-sm flex flex-col sm:flex-row justify-between sm:items-center gap-2 transition hover:bg-secondary/40"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-primary">{o.orderCode}</span>
                              <span className="text-muted-foreground text-xs">• {dateStr}</span>
                            </div>
                            <p className="text-foreground/90 font-medium">{itemsStr}</p>
                          </div>
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1">
                            <p className="font-bold text-foreground">{priceStr}</p>
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                statusColors[o.orderStatus] || "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {getStatusLabel(o.orderStatus)}
                            </span>
                            {o.orderStatus !== 'cancelled' && (
                              <button 
                                onClick={() => setView("Theo dõi", o.id)}
                                className="mt-2 text-xs font-semibold text-primary hover:underline"
                              >
                                Theo dõi đơn
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    </div>
                    
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-2 pt-4 border-t mt-2">
                        <button 
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                        >
                          Trước
                        </button>
                        <span className="text-sm font-medium text-muted-foreground mx-3">
                          Trang {currentPage} / {totalPages}
                        </span>
                        <button 
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                        >
                          Sau
                        </button>
                      </div>
                    )}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-sm text-muted-foreground">Bạn chưa thực hiện đơn hàng nào.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
