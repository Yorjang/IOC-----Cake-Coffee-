import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiFetch } from '../../services/apiClient';
import { useCart } from '../../contexts/CartContext';

const SUGAR_LEVELS = ['100%', '50%', '30%', '0%'];
const ICE_LEVELS = ['100%', '50%', '0%'];

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [sugar, setSugar] = useState('100%');
  const [ice, setIce] = useState('100%');
  const [selectedToppings, setSelectedToppings] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [reviewsModalVisible, setReviewsModalVisible] = useState(false);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      if (id) {
        const [data, reviewsData] = await Promise.all([
          apiFetch(`/products/${id}`),
          apiFetch(`/reviews/product/${id}`),
        ]);

        if (data) {
          const variants = data.variants || [];
          const toppings = data.toppings || [];
          const firstVariantPrice = variants.length > 0 ? Number(variants[0].price) : 0;
          const calculatedBasePrice = Number(data.price || data.basePrice || firstVariantPrice || 0);

          setProduct({
            id: data.id,
            name: data.name || data.title,
            basePrice: calculatedBasePrice,
            rating: data.rating || 5.0,
            image: data.imageUrl || data.image || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600',
            description: data.description || '',
            productType: data.productType || 'drink',
            categoryName: data.category?.name || '',
            variants,
            toppings,
          });

          if (variants.length > 0) {
            setSelectedVariantId(variants[0].id);
          }
        }

        if (Array.isArray(reviewsData)) {
          setReviews(reviewsData);
        } else {
          setReviews([]);
        }
      }
    } catch (e: any) {
      Alert.alert('Thông báo', 'Không thể tải thông tin sản phẩm từ hệ thống.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const isDrink =
    product?.productType === 'drink' ||
    product?.productType === 'coffee' ||
    (product?.categoryName && /cà phê|trà|nước|sinh tố|smoothie|coffee|tea|drink/i.test(product.categoryName)) ||
    (product?.name && /cà phê|trà|latte|macchiato|espresso|sinh tố|sữa/i.test(product.name));

  const hasVariants = product?.variants && product.variants.length > 0;
  const hasToppings = product?.toppings && product.toppings.length > 0;

  const currentVariant = hasVariants
    ? product.variants.find((v: any) => v.id === selectedVariantId) || product.variants[0]
    : null;

  const currentVariantPrice = currentVariant ? Number(currentVariant.price || 0) : (product?.basePrice || 0);
  const toppingExtra = selectedToppings.reduce((sum, t) => sum + Number(t.price || 0), 0);
  const unitPrice = currentVariantPrice + toppingExtra;
  const totalPrice = unitPrice * quantity;

  const calculatedRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / reviews.length).toFixed(1)
    : '5.0';

  const toggleTopping = (topping: any) => {
    setSelectedToppings((prev) => {
      const exists = prev.some((t) => t.id === topping.id || t.name === topping.name);
      if (exists) {
        return prev.filter((t) => t.id !== topping.id && t.name !== topping.name);
      } else {
        return [...prev, topping];
      }
    });
  };

  const handleAddToCart = () => {
    if (!product) return;

    addToCart({
      productId: product.id,
      variantId: currentVariant?.id,
      name: product.name,
      price: unitPrice,
      image: product.image,
      size: currentVariant ? currentVariant.size || currentVariant.variantName : 'Mặc định',
      sugar: isDrink ? sugar : undefined,
      ice: isDrink ? ice : undefined,
      toppings: selectedToppings.map((t) => t.name),
      quantity,
      note,
    } as any);

    Alert.alert('Thành công', `Đã thêm ${quantity}x ${product.name} vào giỏ hàng!`, [
      { text: 'Xem Giỏ Hàng', onPress: () => router.push('/(tabs)/cart') },
      { text: 'Tiếp tục chọn món', style: 'cancel', onPress: () => router.back() },
    ]);
  };

  if (loading || !product) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color="#D84315" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Large Product Banner */}
        <Image source={{ uri: product.image }} style={styles.productBanner} />

        <View style={styles.bodyContainer}>
          {/* Main Info */}
          <View style={styles.titleRow}>
            <Text style={styles.productName}>{product.name}</Text>
            <TouchableOpacity
              style={styles.ratingBadge}
              onPress={() => setReviewsModalVisible(true)}>
              <Ionicons name="star" size={14} color="#FFB300" />
              <Text style={styles.ratingText}>{calculatedRating} ({reviews.length})</Text>
              <Ionicons name="chevron-forward" size={12} color="#E65100" />
            </TouchableOpacity>
          </View>
          <Text style={styles.productPrice}>{currentVariantPrice.toLocaleString('vi-VN')} đ</Text>
          {product.description ? <Text style={styles.productDesc}>{product.description}</Text> : null}

          {/* Real Variants Section from DB */}
          {hasVariants && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Chọn Phân Loại / Kích Cỡ</Text>
              <View style={styles.optionRow}>
                {product.variants.map((v: any) => {
                  const isSelected = selectedVariantId === v.id;
                  const label = v.variantName || v.size || 'Mặc định';
                  const price = Number(v.price || 0);

                  return (
                    <TouchableOpacity
                      key={v.id}
                      style={[styles.chipBtn, isSelected && styles.chipBtnActive]}
                      onPress={() => setSelectedVariantId(v.id)}>
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {label}
                      </Text>
                      <Text style={[styles.chipSubText, isSelected && styles.chipTextActive]}>
                        {price.toLocaleString('vi-VN')}đ
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Sugar Options (Only for drinks) */}
          {isDrink && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Chọn Mức Đường</Text>
              <View style={styles.optionRow}>
                {SUGAR_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[styles.chipBtn, sugar === level && styles.chipBtnActive]}
                    onPress={() => setSugar(level)}>
                    <Text style={[styles.chipText, sugar === level && styles.chipTextActive]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Ice Options (Only for drinks) */}
          {isDrink && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. Chọn Mức Đá</Text>
              <View style={styles.optionRow}>
                {ICE_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[styles.chipBtn, ice === level && styles.chipBtnActive]}
                    onPress={() => setIce(level)}>
                    <Text style={[styles.chipText, ice === level && styles.chipTextActive]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Dynamic Toppings Options (Only if product has toppings in DB) */}
          {hasToppings && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. Thêm Topping Thơm Ngon</Text>
              {product.toppings.map((top: any) => {
                const isChecked = selectedToppings.some((t) => t.id === top.id || t.name === top.name);
                return (
                  <TouchableOpacity
                    key={top.id || top.name}
                    style={[styles.toppingCard, isChecked && styles.toppingCardActive]}
                    onPress={() => toggleTopping(top)}>
                    <Ionicons
                      name={isChecked ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={isChecked ? '#D84315' : '#8D6E63'}
                    />
                    <Text style={styles.toppingName}>{top.name}</Text>
                    <Text style={styles.toppingPrice}>+{Number(top.price || 0).toLocaleString('vi-VN')}đ</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Note Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ghi chú cho quán</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Ví dụ: Mang đi giúp mình..."
              placeholderTextColor="#A1887F"
              value={note}
              onChangeText={setNote}
            />
          </View>

          {/* Quantity Selector */}
          <View style={styles.qtySection}>
            <Text style={styles.sectionTitle}>Số lượng</Text>
            <View style={styles.qtyControl}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
                <Ionicons name="remove" size={20} color="#3E2723" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity((q) => q + 1)}>
                <Ionicons name="add" size={20} color="#3E2723" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Customer Reviews Section */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeaderRow}>
              <Text style={styles.sectionTitle}>Đánh Giá từ Khách Hàng ⭐ ({reviews.length})</Text>
              <TouchableOpacity onPress={() => setReviewsModalVisible(true)}>
                <Text style={styles.seeAllReviews}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>

            {reviews.length === 0 ? (
              <View style={styles.noReviewsBox}>
                <Ionicons name="star-outline" size={32} color="#D7CCC8" />
                <Text style={styles.noReviewsText}>Chưa có đánh giá nào cho sản phẩm này.</Text>
                <Text style={styles.noReviewsSub}>Hãy mua món và gửi đánh giá đầu tiên nhé!</Text>
              </View>
            ) : (
              reviews.slice(0, 3).map((r: any) => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewUserRow}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>
                        {(r.user?.fullName || 'K')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.reviewUserName}>{r.user?.fullName || 'Khách hàng ẩn danh'}</Text>
                      <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons
                            key={star}
                            name={star <= r.rating ? 'star' : 'star-outline'}
                            size={14}
                            color="#FFB300"
                          />
                        ))}
                        <Text style={styles.reviewDate}>
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : ''}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
                  {r.imageUrl ? (
                    <Image source={{ uri: r.imageUrl }} style={styles.reviewImg} resizeMode="cover" />
                  ) : null}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Reviews List Modal */}
      <Modal visible={reviewsModalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setReviewsModalVisible(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#3E2723" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Đánh Giá Sản Phẩm ⭐️</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalBody} contentContainerStyle={{ padding: 16 }}>
            <View style={styles.ratingSummaryCard}>
              <Text style={styles.ratingBigNumber}>{calculatedRating}</Text>
              <View style={{ alignItems: 'center' }}>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const num = Number(calculatedRating) || 0;
                    let iconName: 'star' | 'star-half' | 'star-outline' = 'star-outline';
                    if (num >= star) {
                      iconName = 'star';
                    } else if (num >= star - 0.5) {
                      iconName = 'star-half';
                    }
                    return (
                      <Ionicons key={star} name={iconName} size={18} color="#FFB300" />
                    );
                  })}
                </View>
                <Text style={styles.totalCountText}>{reviews.length} đánh giá từ người mua thực tế</Text>
              </View>
            </View>

            {reviews.length === 0 ? (
              <View style={styles.noReviewsBox}>
                <Ionicons name="star-outline" size={40} color="#D7CCC8" />
                <Text style={styles.noReviewsText}>Chưa có đánh giá nào cho sản phẩm này.</Text>
              </View>
            ) : (
              reviews.map((r: any) => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewUserRow}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>
                        {(r.user?.fullName || 'K')[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.reviewUserName}>{r.user?.fullName || 'Khách hàng ẩn danh'}</Text>
                      <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons
                            key={star}
                            name={star <= r.rating ? 'star' : 'star-outline'}
                            size={14}
                            color="#FFB300"
                          />
                        ))}
                        <Text style={styles.reviewDate}>
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : ''}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
                  {r.imageUrl ? (
                    <Image source={{ uri: r.imageUrl }} style={styles.reviewImg} resizeMode="cover" />
                  ) : null}
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.totalLabel}>TỔNG CỘNG</Text>
          <Text style={styles.totalPrice}>{totalPrice.toLocaleString('vi-VN')} đ</Text>
        </View>
        <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
          <Ionicons name="cart" size={20} color="#FFFFFF" />
          <Text style={styles.addToCartText}>Thêm vào giỏ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  productBanner: {
    width: '100%',
    height: 250,
    backgroundColor: '#EFEBE9',
  },
  bodyContainer: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3E2723',
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  ratingText: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#E65100',
  },
  productPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D84315',
    marginVertical: 6,
  },
  productDesc: {
    fontSize: 14,
    color: '#6D4C41',
    lineHeight: 20,
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3E2723',
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEBE9',
    alignItems: 'center',
  },
  chipBtnActive: {
    backgroundColor: '#FBE9E7',
    borderColor: '#D84315',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5D4037',
  },
  chipSubText: {
    fontSize: 11,
    color: '#8D6E63',
    marginTop: 2,
  },
  chipTextActive: {
    color: '#D84315',
  },
  toppingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EFEBE9',
  },
  toppingCardActive: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFB300',
  },
  toppingName: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#3E2723',
    fontWeight: '500',
  },
  toppingPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#D84315',
  },
  noteInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#3E2723',
    borderWidth: 1,
    borderColor: '#EFEBE9',
  },
  qtySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#EFEBE9',
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5EBE6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3E2723',
    paddingHorizontal: 16,
  },
  reviewsSection: {
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EFEBE9',
  },
  reviewsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllReviews: {
    color: '#D84315',
    fontWeight: '600',
    fontSize: 13,
  },
  noReviewsBox: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEBE9',
  },
  noReviewsText: {
    fontSize: 14,
    color: '#8D6E63',
    fontWeight: '500',
    marginTop: 8,
  },
  noReviewsSub: {
    fontSize: 12,
    color: '#A1887F',
    marginTop: 4,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F5EBE6',
  },
  reviewUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D84315',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  reviewDate: {
    fontSize: 11,
    color: '#A1887F',
    marginLeft: 8,
  },
  reviewComment: {
    fontSize: 13,
    color: '#4E342E',
    lineHeight: 18,
    marginTop: 4,
  },
  reviewImg: {
    width: '100%',
    height: 160,
    borderRadius: 10,
    marginTop: 10,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEBE9',
  },
  closeBtn: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  modalBody: {
    flex: 1,
  },
  ratingSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 20,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  ratingBigNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#D84315',
  },
  totalCountText: {
    fontSize: 12,
    color: '#8D6E63',
    marginTop: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0E6DF',
    elevation: 8,
    ...Platform.select({
      web: { boxShadow: '0px -2px 10px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
    }),
  },
  totalLabel: {
    fontSize: 10,
    color: '#8D6E63',
    fontWeight: 'bold',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D84315',
  },
  addToCartBtn: {
    backgroundColor: '#D84315',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
