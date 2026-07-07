export const products = [
  { id: 1, name: "Bánh Tiramisu", cat: "Bánh mousse", price: "45.000đ", stock: 24, status: "Đang bán", img: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=80&h=80&fit=crop&auto=format" },
  { id: 2, name: "Bánh Red Velvet", cat: "Bánh mousse", price: "55.000đ", stock: 12, status: "Đang bán", img: "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=80&h=80&fit=crop&auto=format" },
  { id: 3, name: "Bánh sinh nhật socola", cat: "Bánh sinh nhật", price: "350.000đ", stock: 8, status: "Đặt trước", img: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=80&h=80&fit=crop&auto=format" },
  { id: 4, name: "Bánh mousse xoài", cat: "Bánh mousse", price: "60.000đ", stock: 0, status: "Hết hàng", img: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=80&h=80&fit=crop&auto=format" },
  { id: 5, name: "Cafe Latte", cat: "Cafe", price: "55.000đ", stock: 999, status: "Đang bán", img: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=80&h=80&fit=crop&auto=format" },
  { id: 6, name: "Matcha Latte", cat: "Trà", price: "59.000đ", stock: 999, status: "Đang bán", img: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=80&h=80&fit=crop&auto=format" },
  { id: 7, name: "Combo Tiramisu + Latte", cat: "Combo", price: "89.000đ", stock: 20, status: "Đang bán", img: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=80&h=80&fit=crop&auto=format" },
  { id: 8, name: "Bánh tart trứng", cat: "Bánh tart", price: "25.000đ", stock: 36, status: "Đang bán", img: "https://images.unsplash.com/photo-1621743478914-cc8a86d7e7b5?w=80&h=80&fit=crop&auto=format" },
];

export const orders = [
  { id: "#SB1024", customer: "Nguyễn Minh Anh", items: "Bánh Tiramisu, Cafe Latte", total: "100.000đ", status: "Đang giao", time: "12:45" },
  { id: "#SB1023", customer: "Trần Thị Bình", items: "Bánh sinh nhật socola", total: "350.000đ", status: "Đang chuẩn bị", time: "12:10" },
  { id: "#SB1022", customer: "Lê Văn Cường", items: "Combo Tiramisu + Latte", total: "89.000đ", status: "Hoàn thành", time: "11:30" },
  { id: "#SB1021", customer: "Phạm Thu Hà", items: "Matcha Latte x2", total: "118.000đ", status: "Xác nhận", time: "11:00" },
  { id: "#SB1020", customer: "Vũ Đức Minh", items: "Bánh tart trứng x3", total: "75.000đ", status: "Huỷ", time: "10:15" },
  { id: "#SB1019", customer: "Đinh Lan Hương", items: "Bánh Red Velvet, Cold Brew", total: "115.000đ", status: "Hoàn thành", time: "09:40" },
];

export const users = [
  { id: 1, name: "Nguyễn Minh Anh", email: "minhanh@email.com", phone: "0909888777", orders: 12, total: "1.240.000đ", joined: "01/01/2025", status: "Hoạt động" },
  { id: 2, name: "Trần Thị Bình", email: "binhtran@email.com", phone: "0912345678", orders: 7, total: "850.000đ", joined: "15/02/2025", status: "Hoạt động" },
  { id: 3, name: "Lê Văn Cường", email: "cuongle@email.com", phone: "0987654321", orders: 3, total: "267.000đ", joined: "20/03/2025", status: "Hoạt động" },
  { id: 4, name: "Phạm Thu Hà", email: "hapt@email.com", phone: "0901112233", orders: 22, total: "2.100.000đ", joined: "10/11/2024", status: "VIP" },
  { id: 5, name: "Vũ Đức Minh", email: "minhvd@email.com", phone: "0977123456", orders: 1, total: "75.000đ", joined: "18/06/2025", status: "Mới" },
];

export const reviews = [
  { id: 1, product: "Bánh Tiramisu", user: "Nguyễn Minh Anh", rating: 5, comment: "Bánh ngon tuyệt, cream mịn, không ngọt quá. Giao hàng nhanh!", date: "20/06/2025", status: "Đã duyệt" },
  { id: 2, product: "Cafe Latte", user: "Trần Thị Bình", rating: 4, comment: "Cafe thơm, vị chuẩn ý. Sẽ order tiếp.", date: "19/06/2025", status: "Đã duyệt" },
  { id: 3, product: "Bánh mousse xoài", user: "Lê Văn Cường", rating: 3, comment: "Vị xoài nhạt hơn tôi mong đợi nhưng vẫn ổn.", date: "18/06/2025", status: "Chờ duyệt" },
  { id: 4, product: "Combo sinh nhật mini", user: "Phạm Thu Hà", rating: 5, comment: "Đặt tiệc sinh nhật cho con, mọi người khen nức nở!", date: "17/06/2025", status: "Chờ duyệt" },
  { id: 5, product: "Bánh tart trứng", user: "Vũ Đức Minh", rating: 2, comment: "Vỏ tart bị mềm do ship xa, mong shop cải thiện.", date: "16/06/2025", status: "Ẩn" },
];

export const vouchers = [
  { code: "CAKE10", type: "Phần trăm", value: "10%", min: "0đ", used: 42, limit: 100, expiry: "31/07/2025", status: "Đang hoạt động" },
  { code: "COFFEE20", type: "Phần trăm", value: "20%", min: "50.000đ", used: 18, limit: 50, expiry: "30/06/2025", status: "Đang hoạt động" },
  { code: "COMBO15", type: "Phần trăm", value: "15%", min: "80.000đ", used: 9, limit: 30, expiry: "15/07/2025", status: "Đang hoạt động" },
  { code: "NEWUSER50", type: "Cố định", value: "50.000đ", min: "100.000đ", used: 5, limit: 20, expiry: "31/12/2025", status: "Đang hoạt động" },
  { code: "SUMMER30", type: "Phần trăm", value: "30%", min: "200.000đ", used: 30, limit: 30, expiry: "30/06/2025", status: "Hết lượt" },
];

export const banners = [
  { id: 1, title: "Flash Sale 14:00 – Cafe giảm 20%", position: "Hero chính", status: "Hiển thị", start: "01/06/2025", end: "30/06/2025", img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=180&h=80&fit=crop&auto=format" },
  { id: 2, title: "Combo sinh nhật mini từ 399.000đ", position: "Banner phụ 1", status: "Hiển thị", start: "01/06/2025", end: "31/07/2025", img: "https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=180&h=80&fit=crop&auto=format" },
  { id: 3, title: "Matcha mới – Thử ngay!", position: "Banner phụ 2", status: "Ẩn", start: "15/06/2025", end: "15/07/2025", img: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=180&h=80&fit=crop&auto=format" },
  { id: 4, title: "Voucher CAKE10 toàn bộ bánh", position: "Popup", status: "Hiển thị", start: "01/06/2025", end: "31/07/2025", img: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=180&h=80&fit=crop&auto=format" },
];

export const categories = [
  { id: 1, name: "Bánh sinh nhật", slug: "banh-sinh-nhat", count: 8, status: "Hiển thị" },
  { id: 2, name: "Bánh mousse", slug: "banh-mousse", count: 12, status: "Hiển thị" },
  { id: 3, name: "Bánh tart", slug: "banh-tart", count: 6, status: "Hiển thị" },
  { id: 4, name: "Bánh quy", slug: "banh-quy", count: 9, status: "Hiển thị" },
  { id: 5, name: "Cafe", slug: "cafe", count: 15, status: "Hiển thị" },
  { id: 6, name: "Trà", slug: "tra", count: 7, status: "Hiển thị" },
  { id: 7, name: "Đồ uống khác", slug: "do-uong-khac", count: 5, status: "Ẩn" },
  { id: 8, name: "Combo", slug: "combo", count: 4, status: "Hiển thị" },
];

export const options = [
  { id: 1, name: "Size", values: "S / M / L", applies: "Cafe, Trà, Đồ uống khác", type: "Size" },
  { id: 2, name: "Đường", values: "Ít / Bình thường / Nhiều", applies: "Cafe, Trà, Đồ uống khác", type: "Tùy chỉnh" },
  { id: 3, name: "Đá", values: "Ít đá / Bình thường / Nhiều đá", applies: "Cafe, Trà, Đồ uống khác", type: "Tùy chỉnh" },
  { id: 4, name: "Size bánh", values: "4 inch / 6 inch / 8 inch", applies: "Bánh sinh nhật, Bánh mousse", type: "Size" },
  { id: 5, name: "Lời chúc", values: "Nhập văn bản", applies: "Bánh sinh nhật", type: "Text" },
  { id: 6, name: "Topping", values: "Dâu / Việt quất / Kiwi / Không", applies: "Bánh tart, Bánh mousse", type: "Topping" },
];

export const statusColor: Record<string, string> = {
  "Đang giao": "bg-blue-100 text-blue-700",
  "Đang chuẩn bị": "bg-yellow-100 text-yellow-700",
  "Hoàn thành": "bg-green-100 text-green-700",
  "Xác nhận": "bg-purple-100 text-purple-700",
  "Huỷ": "bg-red-100 text-red-700",
  "Đang bán": "bg-green-100 text-green-700",
  "Hết hàng": "bg-red-100 text-red-700",
  "Đặt trước": "bg-yellow-100 text-yellow-700",
  "Hoạt động": "bg-green-100 text-green-700",
  "VIP": "bg-amber-100 text-amber-700",
  "Mới": "bg-blue-100 text-blue-700",
  "Đã duyệt": "bg-green-100 text-green-700",
  "Chờ duyệt": "bg-yellow-100 text-yellow-700",
  "Ẩn": "bg-gray-100 text-gray-700",
  "Đang hoạt động": "bg-green-100 text-green-700",
  "Hết lượt": "bg-red-100 text-red-700",
  "Hiển thị": "bg-green-100 text-green-700",
};
