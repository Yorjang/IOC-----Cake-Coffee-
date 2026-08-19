  import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCart } from '../../contexts/CartContext';
import { apiFetch } from '../../services/apiClient';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [catsRes, prodsRes, bannersRes] = await Promise.allSettled([
        apiFetch('/products/categories'),
        apiFetch('/products'),
        apiFetch('/banners'),
      ]);

      if (catsRes.status === 'fulfilled' && Array.isArray(catsRes.value)) {
        setCategories([
          { id: 'all', name: 'Tất cả', icon: 'grid-outline' },
          ...catsRes.value.map((c: any) => ({
            id: c.id,
            name: c.name,
            icon: 'cafe-outline',
          })),
        ]);
      }

      if (prodsRes.status === 'fulfilled' && Array.isArray(prodsRes.value)) {
        const formatted = prodsRes.value.map((item: any) => {
          const firstVariantPrice = item.variants && item.variants.length > 0 ? Number(item.variants[0].price) : 0;
          const displayPrice = Number(item.price || item.basePrice || firstVariantPrice || 0);

          return {
            id: item.id,
            name: item.name || item.title,
            price: displayPrice,
            category: item.category?.name || 'Sản phẩm',
            rating: item.rating !== undefined && item.rating !== null ? item.rating : 5.0,
            image: item.imageUrl || item.image || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600',
            description: item.description || '',
          };
        });
        setProducts(formatted);
      } else {
        setProducts([]);
      }

      if (bannersRes.status === 'fulfilled' && Array.isArray(bannersRes.value)) {
        setBanners(bannersRes.value.filter((b: any) => b.isActive !== false));
      } else {
        setBanners([]);
      }
    } catch (e) {
      setProducts([]);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = (item: any) => {
    addToCart({
      productId: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      size: 'M',
      sugar: '100%',
      ice: '100%',
      toppings: [],
      quantity: 1,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Chào mừng bạn đến với</Text>
          <Text style={styles.brandTitle}>Sweet Bean Coffee & Cake ☕</Text>
        </View>

        {/* Promo Banners from Database */}
        {banners.length > 0 && (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.bannerContainer}>
            {banners.map((banner, index) => {
              const bgColors = ['#3E2723', '#D84315', '#4E342E', '#E65100'];
              const cardBg = bgColors[index % bgColors.length];

              return (
                <View key={banner.id || index} style={[styles.bannerCard, { backgroundColor: cardBg }]}>
                  {banner.imageUrl ? (
                    <Image source={{ uri: banner.imageUrl }} style={styles.bannerImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.bannerContent}>
                      <Text style={styles.bannerTag}>ƯU ĐÃI ĐẶC BIỆT</Text>
                      <Text style={styles.bannerTitle}>{banner.title}</Text>
                      {banner.subtitle ? <Text style={styles.bannerSub}>{banner.subtitle}</Text> : null}
                    </View>
                  )}
                  {banner.imageUrl && banner.title ? (
                    <View style={styles.bannerOverlay}>
                      <Text style={styles.bannerTitleOverlay}>{banner.title}</Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Category Icons Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Danh mục sản phẩm</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/menu')}>
            <Text style={styles.seeAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryItem}
              onPress={() => router.push({ pathname: '/(tabs)/menu', params: { category: cat.name } } as any)}>
              <View style={styles.categoryIconBg}>
                <Ionicons name={cat.icon as any} size={24} color="#D84315" />
              </View>
              <Text style={styles.categoryName}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Products */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Món Nổi Bật Dành Cho Bạn 🔥</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#D84315" style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.productsGrid}>
            {products.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.productCard}
                onPress={() => router.push(`/product/${item.id}`)}>
                <Image source={{ uri: item.image }} style={styles.productImg} />
                <View style={styles.ratingTag}>
                  <Ionicons name="star" size={12} color="#FFB300" />
                  <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productCategory}>{item.category}</Text>
                  <Text style={styles.productName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.productBottomRow}>
                    <Text style={styles.productPrice}>{item.price.toLocaleString('vi-VN')} đ</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => handleQuickAdd(item)}>
                      <Ionicons name="add" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  welcomeText: {
    fontSize: 13,
    color: '#8D6E63',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3E2723',
    marginTop: 2,
  },
  bannerContainer: {
    paddingLeft: 16,
    marginBottom: 20,
  },
  bannerCard: {
    width: width - 48,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    height: 140,
    justifyContent: 'center',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bannerTitleOverlay: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bannerContent: {
    padding: 20,
    zIndex: 2,
  },
  bannerTag: {
    color: '#FFB300',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  bannerSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  seeAllText: {
    fontSize: 13,
    color: '#D84315',
    fontWeight: '600',
  },
  categoryScroll: {
    paddingLeft: 16,
    marginBottom: 16,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 68,
  },
  categoryIconBg: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE0B2',
    elevation: 2,
    ...Platform.select({
      web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
    }),
  },
  categoryName: {
    fontSize: 12,
    color: '#4E342E',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  productCard: {
    width: (width - 36) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F5EBE6',
    elevation: 2,
    ...Platform.select({
      web: { boxShadow: '0px 2px 6px rgba(0,0,0,0.05)' },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
    }),
  },
  productImg: {
    width: '100%',
    height: 140,
    backgroundColor: '#EFEBE9',
  },
  ratingTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 3,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 10,
  },
  productCategory: {
    fontSize: 10,
    color: '#8D6E63',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3E2723',
    marginVertical: 4,
  },
  productBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D84315',
  },
  addBtn: {
    backgroundColor: '#D84315',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
