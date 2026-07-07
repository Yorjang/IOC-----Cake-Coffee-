export const VIEW_KEYS = {
  HOME: "Trang chá»§",
  SWEETS: "BÃ¡nh ngá»t",
  DRINKS: "Cafe/Äá»“ uá»‘ng",
  COMBO: "Combo",
  CART: "Giá» hÃ ng",
  CHECKOUT: "Thanh toÃ¡n",
  SUCCESS: "ThÃ nh cÃ´ng",
  DETAIL: "Chi tiáº¿t",
  ADMIN: "Admin",
  LOGIN: "ÄÄƒng nháº­p",
  REVIEW: "ÄÃ¡nh giÃ¡",
  FAVORITES: "YÃªu thÃ­ch",
  PROFILE: "Há»“ sÆ¡",
} as const;

export const CATEGORY_GROUPS = {
  DRINKS: ["Cafe", "TrÃ ", "Äá»“ uá»‘ng khÃ¡c"],
} as const;

export const HOME_CONFIG = {
  HERO_ROTATION_MS: 4000,
  BEST_SELLERS_LIMIT: 8,
  NEW_COMBOS_START: 8,
  NEW_COMBOS_END: 14,
  FEATURE_ITEMS: [
    { title: "Giao há»a tá»‘c 2H", sub: "TP.HCM", icon: "Clock" },
    { title: "NÆ°á»›ng má»›i", sub: "Má»—i ngÃ y", icon: "Coffee" },
    { title: "Há»¯u cÆ¡", sub: "100% sáº¡ch", icon: "AlertCircle" },
    { title: "Miá»…n phÃ­ ship", sub: "Tá»« 300k", icon: "Truck" },
  ],
} as const;

export const PRODUCT_DETAIL_CONFIG = {
  DEFAULT_PRODUCT_INDEX: 0,
  SIZE_OPTIONS: ["Nhá»", "Vá»«a", "Lá»›n"],
  DEFAULT_SIZE_INDEX: 1,
} as const;

export const CART_CONFIG = {
  SAMPLE_PRODUCT_INDEXES: [0, 1],
  ITEM_QUANTITY: 1,
} as const;

export const CHECKOUT_CONFIG = {
  SHIPPING_FIELDS: ["Há» tÃªn", "Sá»‘ Ä‘iá»‡n thoáº¡i", "Äá»‹a chá»‰ giao hÃ ng"],
  PAYMENT_METHODS: ["Thanh toÃ¡n khi nháº­n hÃ ng (COD)", "Chuyá»ƒn khoáº£n ngÃ¢n hÃ ng", "VÃ­ Momo"],
  ORDER_TOTALS: [
    { label: "Táº¡m tÃ­nh", value: "360.000Ä‘" },
    { label: "PhÃ­ giao hÃ ng", value: "15.000Ä‘" },
    { label: "Giáº£m giÃ¡", value: "-0Ä‘", highlight: true },
  ],
  GRAND_TOTAL: "375.000Ä‘",
} as const;

export const HEADER_CONFIG = {
  FAVORITE_COUNT: 4,
  CART_COUNT: 3,
} as const;
