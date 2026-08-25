import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiFetch } from '../../services/apiClient';
import { useCart } from '../../contexts/CartContext';

const { width } = Dimensions.get('window');

export default function MenuScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addToCart } = useCart();
  const [selectedCat, setSelectedCat] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [categoryTabs, setCategoryTabs] = useState<string[]>(['Tất cả']);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (params.category) {
      setSelectedCat(params.category as string);
    }
  }, [params.category]);

  useEffect(() => {
    loadMenuData();
  }, []);

  const loadMenuData = async () => {
    setLoading(true);
    try {
      const [catsRes, prodsRes, couponsRes] = await Promise.allSettled([
        apiFetch('/products/categories'),
        apiFetch('/products'),
        apiFetch('/coupons/public'),
      ]);

      if (catsRes.status === 'fulfilled' && Array.isArray(catsRes.value)) {
        setCategoryTabs(['Tất cả', ...catsRes.value.map((c: any) => c.name)]);
      }

      const publicCoupons = couponsRes.status === 'fulfilled' && Array.isArray(couponsRes.value) ? couponsRes.value : [];

      if (prodsRes.status === 'fulfilled' && Array.isArray(prodsRes.value)) {
        const formatted = prodsRes.value.map((item: any) => {
          const firstVariantPrice = item.variants && item.variants.length > 0 ? Number(item.variants[0].price) : 0;
          const displayPrice = Number(item.price || item.basePrice || firstVariantPrice || 0);

          const rawRating = item.averageRating !== undefined && item.averageRating !== null
            ? Number(item.averageRating)
            : (item.rating !== undefined && item.rating !== null ? Number(item.rating) : 5.0);
          const realRating = Number(rawRating.toFixed(1));
          const reviewCount = Number(item.reviewCount || (item.reviews ? item.reviews.length : 0));

          // Calculate best active voucher discount for this product
          let maxSave = 0;
          let bestVoucher: any = null;
          for (const v of publicCoupons) {
            if (Number(v.pointsRequired || 0) > 0) continue;
            if (v.expiresAt && new Date(v.expiresAt) < new Date()) continue;
            if (v.productId && v.productId !== item.id) continue;
            if (v.categoriesId && v.categoriesId !== item.categoryId) continue;

            const minQty = Number(v.minQuantity || v.min_quantity || 1);
            if (minQty > 1) continue;

            const minOrder = Number(v.minOrderValue || 0);
            if (minOrder > 0 && displayPrice < minOrder) continue;

            const rawVal = Number(v.discountValue || 0);
            let saveAmount = 0;
            if (v.discountType === 'percent' || v.discountType === 'percentage') {
              saveAmount = Math.round((displayPrice * rawVal) / 100);
              if (v.maxDiscountAmount && Number(v.maxDiscountAmount) > 0) {
                saveAmount = Math.min(saveAmount, Number(v.maxDiscountAmount));
              }
            } else {
              saveAmount = rawVal;
            }

            if (saveAmount > maxSave) {
              maxSave = saveAmount;
              bestVoucher = v;
            }
          }

          const hasDiscount = maxSave > 0 && bestVoucher !== null;
          const discountedPrice = hasDiscount ? Math.max(0, displayPrice - maxSave) : displayPrice;
          const discountTag = hasDiscount
            ? (bestVoucher.discountType === 'percent' || bestVoucher.discountType === 'percentage'
                ? `-${Number(Number(bestVoucher.discountValue).toFixed(0))}%`
                : `-${Math.round(maxSave / 1000)}k`)
            : null;

          return {
            id: item.id,
            name: item.name || item.title,
            price: displayPrice,
            originalPrice: displayPrice,
            discountedPrice,
            hasDiscount,
            discountTag,
            category: item.category?.name || 'Sản phẩm',
            rating: realRating,
            reviewCount: reviewCount,
            image: item.imageUrl || item.image || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600',
            description: item.description || '',
          };
        });
        setProducts(formatted);
      } else {
        setProducts([]);
      }
    } catch (e) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((item) => {
    const matchesCat = selectedCat === 'Tất cả' || item.category.toLowerCase().includes(selectedCat.toLowerCase());
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Thực Đơn Cake & Coffee</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#8D6E63" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm bánh ngọt, cà phê, trà..."
            placeholderTextColor="#A1887F"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#8D6E63" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Tabs */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categoryTabs}
          keyExtractor={(item) => item}
          style={styles.catTabList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.catTabBtn, selectedCat === item && styles.catTabBtnActive]}
              onPress={() => setSelectedCat(item)}>
              <Text style={[styles.catTabText, selectedCat === item && styles.catTabTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#D84315" style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={48} color="#D7CCC8" />
              <Text style={styles.emptyText}>Không tìm thấy sản phẩm phù hợp</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push(`/product/${item.id}`)}>
              <View style={{ position: 'relative' }}>
                <Image source={{ uri: item.image }} style={styles.itemImg} />
                {item.hasDiscount && item.discountTag ? (
                  <View style={styles.discountBadgeTag}>
                    <Text style={styles.discountBadgeText}>{item.discountTag}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.itemContent}>
                <View style={styles.itemHeaderRow}>
                  <Text style={styles.itemCat}>{item.category}</Text>
                  <View style={styles.ratingBadgeInline}>
                    <Ionicons name="star" size={12} color="#FFB300" />
                    <Text style={styles.ratingTextInline}>
                      {item.rating} {item.reviewCount > 0 ? `(${item.reviewCount})` : ''}
                    </Text>
                  </View>
                </View>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemDesc} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.itemFooter}>
                  {item.hasDiscount ? (
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                      <Text style={styles.itemPrice}>{item.discountedPrice.toLocaleString('vi-VN')} đ</Text>
                      <Text style={styles.originalPriceStrikethrough}>
                        {item.originalPrice.toLocaleString('vi-VN')} đ
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.itemPrice}>{item.price.toLocaleString('vi-VN')} đ</Text>
                  )}
                  <TouchableOpacity
                    style={styles.buyBtn}
                    onPress={() => router.push(`/product/${item.id}`)}>
                    <Text style={styles.buyBtnText}>Tùy chọn</Text>
                    <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFF8F0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3E2723',
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#EFEBE9',
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#3E2723',
  },
  catTabList: {
    marginBottom: 4,
  },
  catTabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#EFEBE9',
  },
  catTabBtnActive: {
    backgroundColor: '#D84315',
    borderColor: '#D84315',
  },
  catTabText: {
    fontSize: 13,
    color: '#5D4037',
    fontWeight: '500',
  },
  catTabTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
  },
  menuCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 14,
    padding: 10,
    elevation: 2,
    ...Platform.select({
      web: { boxShadow: '0px 2px 5px rgba(0,0,0,0.05)' },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
    }),
    borderWidth: 1,
    borderColor: '#F5EBE6',
  },
  itemImg: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#EFEBE9',
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCat: {
    fontSize: 10,
    color: '#8D6E63',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  ratingBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  ratingTextInline: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#E65100',
  },
  itemName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3E2723',
    marginTop: 2,
  },
  itemDesc: {
    fontSize: 12,
    color: '#795548',
    marginTop: 2,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#D84315',
  },
  originalPriceStrikethrough: {
    fontSize: 11,
    color: '#9E9E9E',
    textDecorationLine: 'line-through',
  },
  discountBadgeTag: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#E53935',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    zIndex: 2,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D84315',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 2,
  },
  buyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#8D6E63',
    marginTop: 12,
  },
});
