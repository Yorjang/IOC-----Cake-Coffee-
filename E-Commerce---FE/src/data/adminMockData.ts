export const products = [
  { id: 1, name: "BÃ¡nh Tiramisu", cat: "BÃ¡nh mousse", price: "45.000Ä‘", stock: 24, status: "Äang bÃ¡n", img: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=80&h=80&fit=crop&auto=format" },
  { id: 2, name: "BÃ¡nh Red Velvet", cat: "BÃ¡nh mousse", price: "55.000Ä‘", stock: 12, status: "Äang bÃ¡n", img: "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=80&h=80&fit=crop&auto=format" },
  { id: 3, name: "BÃ¡nh sinh nháº­t socola", cat: "BÃ¡nh sinh nháº­t", price: "350.000Ä‘", stock: 8, status: "Äáº·t trÆ°á»›c", img: "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=80&h=80&fit=crop&auto=format" },
  { id: 4, name: "BÃ¡nh mousse xoÃ i", cat: "BÃ¡nh mousse", price: "60.000Ä‘", stock: 0, status: "Háº¿t hÃ ng", img: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=80&h=80&fit=crop&auto=format" },
  { id: 5, name: "Cafe Latte", cat: "Cafe", price: "55.000Ä‘", stock: 999, status: "Äang bÃ¡n", img: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=80&h=80&fit=crop&auto=format" },
  { id: 6, name: "Matcha Latte", cat: "TrÃ ", price: "59.000Ä‘", stock: 999, status: "Äang bÃ¡n", img: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=80&h=80&fit=crop&auto=format" },
  { id: 7, name: "Combo Tiramisu + Latte", cat: "Combo", price: "89.000Ä‘", stock: 20, status: "Äang bÃ¡n", img: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=80&h=80&fit=crop&auto=format" },
  { id: 8, name: "BÃ¡nh tart trá»©ng", cat: "BÃ¡nh tart", price: "25.000Ä‘", stock: 36, status: "Äang bÃ¡n", img: "https://images.unsplash.com/photo-1621743478914-cc8a86d7e7b5?w=80&h=80&fit=crop&auto=format" },
];

export const orders = [
  { id: "#SB1024", customer: "Nguyá»…n Minh Anh", items: "BÃ¡nh Tiramisu, Cafe Latte", total: "100.000Ä‘", status: "Äang giao", time: "12:45" },
  { id: "#SB1023", customer: "Tráº§n Thá»‹ BÃ¬nh", items: "BÃ¡nh sinh nháº­t socola", total: "350.000Ä‘", status: "Äang chuáº©n bá»‹", time: "12:10" },
  { id: "#SB1022", customer: "LÃª VÄƒn CÆ°á»ng", items: "Combo Tiramisu + Latte", total: "89.000Ä‘", status: "HoÃ n thÃ nh", time: "11:30" },
  { id: "#SB1021", customer: "Pháº¡m Thu HÃ ", items: "Matcha Latte x2", total: "118.000Ä‘", status: "XÃ¡c nháº­n", time: "11:00" },
  { id: "#SB1020", customer: "VÅ© Äá»©c Minh", items: "BÃ¡nh tart trá»©ng x3", total: "75.000Ä‘", status: "Huá»·", time: "10:15" },
  { id: "#SB1019", customer: "Äinh Lan HÆ°Æ¡ng", items: "BÃ¡nh Red Velvet, Cold Brew", total: "115.000Ä‘", status: "HoÃ n thÃ nh", time: "09:40" },
];

export const users = [
  { id: 1, name: "Nguyá»…n Minh Anh", email: "minhanh@email.com", phone: "0909888777", orders: 12, total: "1.240.000Ä‘", joined: "01/01/2025", status: "Hoáº¡t Ä‘á»™ng" },
  { id: 2, name: "Tráº§n Thá»‹ BÃ¬nh", email: "binhtran@email.com", phone: "0912345678", orders: 7, total: "850.000Ä‘", joined: "15/02/2025", status: "Hoáº¡t Ä‘á»™ng" },
  { id: 3, name: "LÃª VÄƒn CÆ°á»ng", email: "cuongle@email.com", phone: "0987654321", orders: 3, total: "267.000Ä‘", joined: "20/03/2025", status: "Hoáº¡t Ä‘á»™ng" },
  { id: 4, name: "Pháº¡m Thu HÃ ", email: "hapt@email.com", phone: "0901112233", orders: 22, total: "2.100.000Ä‘", joined: "10/11/2024", status: "VIP" },
  { id: 5, name: "VÅ© Äá»©c Minh", email: "minhvd@email.com", phone: "0977123456", orders: 1, total: "75.000Ä‘", joined: "18/06/2025", status: "Má»›i" },
];

export const reviews = [
  { id: 1, product: "BÃ¡nh Tiramisu", user: "Nguyá»…n Minh Anh", rating: 5, comment: "BÃ¡nh ngon tuyá»‡t, cream má»‹n, khÃ´ng ngá»t quÃ¡. Giao hÃ ng nhanh!", date: "20/06/2025", status: "ÄÃ£ duyá»‡t" },
  { id: 2, product: "Cafe Latte", user: "Tráº§n Thá»‹ BÃ¬nh", rating: 4, comment: "Cafe thÆ¡m, vá»‹ chuáº©n Ã½. Sáº½ order tiáº¿p.", date: "19/06/2025", status: "ÄÃ£ duyá»‡t" },
  { id: 3, product: "BÃ¡nh mousse xoÃ i", user: "LÃª VÄƒn CÆ°á»ng", rating: 3, comment: "Vá»‹ xoÃ i nháº¡t hÆ¡n tÃ´i mong Ä‘á»£i nhÆ°ng váº«n á»•n.", date: "18/06/2025", status: "Chá» duyá»‡t" },
  { id: 4, product: "Combo sinh nháº­t mini", user: "Pháº¡m Thu HÃ ", rating: 5, comment: "Äáº·t tiá»‡c sinh nháº­t cho con, má»i ngÆ°á»i khen ná»©c ná»Ÿ!", date: "17/06/2025", status: "Chá» duyá»‡t" },
  { id: 5, product: "BÃ¡nh tart trá»©ng", user: "VÅ© Äá»©c Minh", rating: 2, comment: "Vá» tart bá»‹ má»m do ship xa, mong shop cáº£i thiá»‡n.", date: "16/06/2025", status: "áº¨n" },
];

export const vouchers = [
  { code: "CAKE10", type: "Pháº§n trÄƒm", value: "10%", min: "0Ä‘", used: 42, limit: 100, expiry: "31/07/2025", status: "Äang hoáº¡t Ä‘á»™ng" },
  { code: "COFFEE20", type: "Pháº§n trÄƒm", value: "20%", min: "50.000Ä‘", used: 18, limit: 50, expiry: "30/06/2025", status: "Äang hoáº¡t Ä‘á»™ng" },
  { code: "COMBO15", type: "Pháº§n trÄƒm", value: "15%", min: "80.000Ä‘", used: 9, limit: 30, expiry: "15/07/2025", status: "Äang hoáº¡t Ä‘á»™ng" },
  { code: "NEWUSER50", type: "Cá»‘ Ä‘á»‹nh", value: "50.000Ä‘", min: "100.000Ä‘", used: 5, limit: 20, expiry: "31/12/2025", status: "Äang hoáº¡t Ä‘á»™ng" },
  { code: "SUMMER30", type: "Pháº§n trÄƒm", value: "30%", min: "200.000Ä‘", used: 30, limit: 30, expiry: "30/06/2025", status: "Háº¿t lÆ°á»£t" },
];

export const banners = [
  { id: 1, title: "Flash Sale 14:00 â€“ Cafe giáº£m 20%", position: "Hero chÃ­nh", status: "Hiá»ƒn thá»‹", start: "01/06/2025", end: "30/06/2025", img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=180&h=80&fit=crop&auto=format" },
  { id: 2, title: "Combo sinh nháº­t mini tá»« 399.000Ä‘", position: "Banner phá»¥ 1", status: "Hiá»ƒn thá»‹", start: "01/06/2025", end: "31/07/2025", img: "https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=180&h=80&fit=crop&auto=format" },
  { id: 3, title: "Matcha má»›i â€“ Thá»­ ngay!", position: "Banner phá»¥ 2", status: "áº¨n", start: "15/06/2025", end: "15/07/2025", img: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=180&h=80&fit=crop&auto=format" },
  { id: 4, title: "Voucher CAKE10 toÃ n bá»™ bÃ¡nh", position: "Popup", status: "Hiá»ƒn thá»‹", start: "01/06/2025", end: "31/07/2025", img: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=180&h=80&fit=crop&auto=format" },
];

export const categories = [
  { id: 1, name: "BÃ¡nh sinh nháº­t", slug: "banh-sinh-nhat", count: 8, status: "Hiá»ƒn thá»‹" },
  { id: 2, name: "BÃ¡nh mousse", slug: "banh-mousse", count: 12, status: "Hiá»ƒn thá»‹" },
  { id: 3, name: "BÃ¡nh tart", slug: "banh-tart", count: 6, status: "Hiá»ƒn thá»‹" },
  { id: 4, name: "BÃ¡nh quy", slug: "banh-quy", count: 9, status: "Hiá»ƒn thá»‹" },
  { id: 5, name: "Cafe", slug: "cafe", count: 15, status: "Hiá»ƒn thá»‹" },
  { id: 6, name: "TrÃ ", slug: "tra", count: 7, status: "Hiá»ƒn thá»‹" },
  { id: 7, name: "Äá»“ uá»‘ng khÃ¡c", slug: "do-uong-khac", count: 5, status: "áº¨n" },
  { id: 8, name: "Combo", slug: "combo", count: 4, status: "Hiá»ƒn thá»‹" },
];

export const options = [
  { id: 1, name: "Size", values: "S / M / L", applies: "Cafe, TrÃ , Äá»“ uá»‘ng khÃ¡c", type: "Size" },
  { id: 2, name: "ÄÆ°á»ng", values: "Ãt / BÃ¬nh thÆ°á»ng / Nhiá»u", applies: "Cafe, TrÃ , Äá»“ uá»‘ng khÃ¡c", type: "TÃ¹y chá»‰nh" },
  { id: 3, name: "ÄÃ¡", values: "Ãt Ä‘Ã¡ / BÃ¬nh thÆ°á»ng / Nhiá»u Ä‘Ã¡", applies: "Cafe, TrÃ , Äá»“ uá»‘ng khÃ¡c", type: "TÃ¹y chá»‰nh" },
  { id: 4, name: "Size bÃ¡nh", values: "4 inch / 6 inch / 8 inch", applies: "BÃ¡nh sinh nháº­t, BÃ¡nh mousse", type: "Size" },
  { id: 5, name: "Lá»i chÃºc", values: "Nháº­p vÄƒn báº£n", applies: "BÃ¡nh sinh nháº­t", type: "Text" },
  { id: 6, name: "Topping", values: "DÃ¢u / Viá»‡t quáº¥t / Kiwi / KhÃ´ng", applies: "BÃ¡nh tart, BÃ¡nh mousse", type: "Topping" },
];

export const statusColor: Record<string, string> = {
  "Äang giao": "bg-blue-100 text-blue-700",
  "Äang chuáº©n bá»‹": "bg-yellow-100 text-yellow-700",
  "HoÃ n thÃ nh": "bg-green-100 text-green-700",
  "XÃ¡c nháº­n": "bg-purple-100 text-purple-700",
  "Huá»·": "bg-red-100 text-red-700",
  "Äang bÃ¡n": "bg-green-100 text-green-700",
  "Háº¿t hÃ ng": "bg-red-100 text-red-700",
  "Äáº·t trÆ°á»›c": "bg-yellow-100 text-yellow-700",
  "Hoáº¡t Ä‘á»™ng": "bg-green-100 text-green-700",
  "VIP": "bg-amber-100 text-amber-700",
  "Má»›i": "bg-blue-100 text-blue-700",
  "ÄÃ£ duyá»‡t": "bg-green-100 text-green-700",
  "Chá» duyá»‡t": "bg-yellow-100 text-yellow-700",
  "áº¨n": "bg-gray-100 text-gray-700",
  "Äang hoáº¡t Ä‘á»™ng": "bg-green-100 text-green-700",
  "Háº¿t lÆ°á»£t": "bg-red-100 text-red-700",
  "Hiá»ƒn thá»‹": "bg-green-100 text-green-700",
};


