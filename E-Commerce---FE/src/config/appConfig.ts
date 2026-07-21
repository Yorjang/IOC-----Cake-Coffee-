export const VIEW_KEYS = {
  HOME: "Trang chủ",
  SWEETS: "Bánh ngọt",
  DRINKS: "Cafe/Đồ uống",
  COMBO: "Combo",
  ALL_PRODUCTS: "Tất cả sản phẩm",
  CART: "Giỏ hàng",
  CHECKOUT: "Thanh toán",
  SUCCESS: "Thành công",
  DETAIL: "Chi tiết",
  ADMIN: "Admin",
  ADMIN_LOGIN: "AdminLogin",
  STAFF: "Staff",
  LOGIN: "Đăng nhập",
  REVIEW: "Đánh giá",
  FAVORITES: "Yêu thích",
  PROFILE: "Hồ sơ",
  RESET_PASSWORD: "ResetPassword",
  STORES: "Hệ thống cửa hàng",
  PRIVACY: "Chính sách bảo mật",
  TERMS: "Điều khoản dịch vụ",
  RETURN_POLICY: "Chính sách đổi trả",
  ORDER_GUIDE: "Hướng dẫn đặt bánh",
  TRACKING: "Theo dõi",
} as const;

export const CATEGORY_GROUPS = {
  DRINKS: ["Cafe", "Trà", "Đồ uống khác"],
} as const;

export const HOME_CONFIG = {
  HERO_ROTATION_MS: 4000,
  DEAL_ROTATION_MS: 5000,
  DEAL_ITEMS_LIMIT: 4,
  BEST_SELLERS_LIMIT: 8,
  NEW_COMBOS_LIMIT: 6,
  FEATURE_ITEMS: [
    { title: "Giao hàng hỏa tốc 45p", sub: "TP.HCM", icon: "Clock" },
    { title: "Nướng mới", sub: "Mỗi ngày", icon: "Coffee" },
    { title: "Hữu cơ", sub: "100% sạch", icon: "AlertCircle" },
    { title: "Miễn phí ship", sub: "Từ 300k", icon: "Truck" },
  ],
} as const;

export const PRODUCT_DETAIL_CONFIG = {
  DEFAULT_PRODUCT_INDEX: 0,
  SIZE_OPTIONS: ["Nhỏ", "Vừa", "Lớn"],
  DEFAULT_SIZE_INDEX: 1,
} as const;

export const CART_CONFIG = {
  SAMPLE_PRODUCT_INDEXES: [0, 1],
  ITEM_QUANTITY: 1,
} as const;

export const CHECKOUT_CONFIG = {
  SHIPPING_FIELDS: ["Họ tên", "Số điện thoại", "Địa chỉ giao hàng"],
  PAYMENT_METHODS: ["Thanh toán khi nhận hàng (COD)", "Chuyển khoản ngân hàng", "Ví Momo"],
  ORDER_TOTALS: [
    { label: "Tạm tính", value: "360.000đ" },
    { label: "Phí giao hàng", value: "15.000đ" },
    { label: "Giảm giá", value: "-0đ", highlight: true },
  ],
  GRAND_TOTAL: "375.000đ",
} as const;

export const HEADER_CONFIG = {
  FAVORITE_COUNT: 4,
  CART_COUNT: 3,
} as const;
