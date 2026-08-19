import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../services/apiClient';

const ORDER_STEPS = [
  { key: 'PENDING', label: 'Chờ nhận' },
  { key: 'IN_PROGRESS', label: 'Pha chế' },
  { key: 'SHIPPING', label: 'Đang giao' },
  { key: 'COMPLETED', label: 'Hoàn thành' },
];

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Review Form Modal state
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewingItem, setReviewingItem] = useState<any | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewImageUrl, setReviewImageUrl] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Real-time live polling & focus refresh
  useFocusEffect(
    useCallback(() => {
      fetchOrders(orders.length === 0);
      const timer = setInterval(() => {
        fetchOrders(true); // silent background live update
      }, 4000);
      return () => clearInterval(timer);
    }, [user, selectedOrder?.id])
  );

  const fetchOrders = async (isSilent = false) => {
    if (!user) {
      setOrders([]);
      return;
    }
    if (!isSilent) setLoading(true);
    try {
      const res = await apiFetch('/orders/my');
      const rawList = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : [];

      const formatted = rawList.map((ord: any) => {
        const rawStatus = (ord.orderStatus || ord.status || 'PENDING').toUpperCase();
        return {
          id: ord.id,
          orderCode: ord.orderCode || `#${ord.id?.substring(0, 8) || 'ORD'}`,
          date: new Date(ord.createdAt || ord.created_at || Date.now()).toLocaleString('vi-VN'),
          status: rawStatus,
          statusText: getStatusLabel(rawStatus),
          branchName: ord.branch?.name || 'Sweet Bean Cafe',
          totalAmount: Number(ord.totalAmount || ord.total_amount || 0),
          shippingFee: Number(ord.shippingFee || ord.shipping_fee || 0),
          subtotal: Number(ord.subtotal || 0),
          discountAmount: Number(ord.discountAmount || ord.discount_amount || 0),
          paymentMethod: ord.paymentMethod || ord.payment_method || 'COD',
          shippingAddress: ord.shippingAddressStreet || ord.shipping_address_street || 'Địa chỉ giao hàng',
          recipientName: ord.shippingRecipientName || ord.shipping_recipient_name || user?.fullName,
          phone: ord.shippingAddressPhone || ord.shipping_address_phone || user?.phone,
          itemsCount: ord.items?.length || 0,
          items: ord.items || [],
        };
      });
      setOrders(formatted);

      // If detail modal is currently open for an order, refresh it
      if (selectedOrder) {
        const found = formatted.find((o) => o.id === selectedOrder.id);
        if (found) setSelectedOrder(found);
      }
    } catch (e) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'PENDING':
        return 'Chờ xác nhận';
      case 'IN_PROGRESS':
      case 'PROCESSING':
        return 'Đang pha chế';
      case 'DELIVERING':
      case 'SHIPPING':
        return 'Đang giao hàng';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return 'Đang pha chế';
    }
  };

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'IN_PROGRESS':
      case 'PROCESSING':
        return 1;
      case 'SHIPPING':
      case 'DELIVERING':
        return 2;
      case 'COMPLETED':
        return 3;
      default:
        return 1;
    }
  };

  const handleOpenOrderDetail = (order: any) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
  };

  const handleOpenReviewForm = (item: any) => {
    if (item.isReviewed) {
      Alert.alert('Đã đánh giá', 'Bạn đã gửi đánh giá cho sản phẩm này trong đơn hàng này rồi!');
      return;
    }
    setReviewingItem(item);
    setRating(5);
    setComment('');
    setReviewImageUrl('');
    setReviewModalVisible(true);
  };

  const handlePickReviewImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Quyền truy cập', 'Cần cấp quyền truy cập thư viện ảnh để đính kèm hình ảnh đánh giá.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const imageUri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setReviewImageUrl(imageUri);
      }
    } catch (e: any) {
      Alert.alert('Lỗi chọn ảnh', e.message);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedOrder || !reviewingItem) return;
    if (!comment.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng viết vài dòng cảm nhận của bạn về sản phẩm.');
      return;
    }

    const productId = reviewingItem.productId || reviewingItem.product?.id || reviewingItem.id;
    setSubmittingReview(true);

    try {
      const res = await apiFetch('/reviews/order', {
        method: 'POST',
        body: JSON.stringify({
          orderId: selectedOrder.id,
          productId,
          rating,
          comment: comment.trim(),
          imageUrl: reviewImageUrl || null,
        }),
      });

      const pointsBonus = res?.pointsEarned || 5;
      Alert.alert(
        'Đánh giá thành công! 🎉',
        `Cảm ơn bạn đã gửi phản hồi! Bạn đã nhận được +${pointsBonus} điểm thưởng tích lũy.`
      );

      setReviewModalVisible(false);
      setReviewingItem(null);
      // Refresh order list to update isReviewed state from DB
      await fetchOrders();
    } catch (error: any) {
      Alert.alert('Không thể gửi đánh giá', error?.message || 'Có lỗi xảy ra khi gửi đánh giá.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Theo Dõi & Lịch Sử Đơn Hàng 📋</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="lock-closed-outline" size={70} color="#D7CCC8" />
          <Text style={styles.emptyTitle}>Yêu cầu đăng nhập</Text>
          <Text style={styles.emptySub}>
            Vui lòng đăng nhập tài khoản để theo dõi tiến trình và lịch sử đơn hàng của bạn.
          </Text>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/(tabs)/profile')}>
            <Text style={styles.actionBtnText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Theo Dõi & Lịch Sử Đơn Hàng 📋</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#D84315" style={{ flex: 1 }} />
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={70} color="#D7CCC8" />
          <Text style={styles.emptyTitle}>Chưa có đơn hàng nào</Text>
          <Text style={styles.emptySub}>
            Bạn chưa thực hiện đơn hàng nào. Hãy thưởng thức món ngon ngay hôm nay!
          </Text>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/(tabs)/menu')}>
            <Text style={styles.actionBtnText}>Khám phá Menu ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: { item: any }) => {
            const currentStepIndex = getStepIndex(item.status);
            const isCancelled = item.status === 'CANCELLED';
            const isCompleted = item.status === 'COMPLETED';

            return (
              <TouchableOpacity
                style={styles.orderCard}
                activeOpacity={0.9}
                onPress={() => handleOpenOrderDetail(item)}>
                {/* Order Card Header */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderId}>{item.orderCode}</Text>
                    <Text style={styles.orderDate}>{item.date}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      isCompleted
                        ? styles.statusSuccess
                        : isCancelled
                        ? styles.statusCancelled
                        : styles.statusProgress,
                    ]}>
                    <Text
                      style={[
                        styles.statusText,
                        isCompleted
                          ? styles.statusSuccessText
                          : isCancelled
                          ? styles.statusCancelledText
                          : styles.statusProgressText,
                      ]}>
                      {item.statusText}
                    </Text>
                  </View>
                </View>

                {/* Progress Step Bar */}
                {!isCancelled && (
                  <View style={styles.progressContainer}>
                    {ORDER_STEPS.map((step, idx) => {
                      const isDone = idx <= currentStepIndex;
                      return (
                        <View key={step.key} style={styles.stepItem}>
                          <View
                            style={[
                              styles.stepCircle,
                              isDone ? styles.stepCircleActive : styles.stepCircleInactive,
                            ]}>
                            <Ionicons
                              name={isDone ? 'checkmark' : 'ellipse'}
                              size={12}
                              color={isDone ? '#FFFFFF' : '#BDBDBD'}
                            />
                          </View>
                          <Text style={[styles.stepLabel, isDone && styles.stepLabelActive]}>
                            {step.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Items Summary */}
                <View style={styles.itemsSummary}>
                  {item.items.map((sub: any, i: number) => {
                    const name = sub.productName || sub.product?.name || sub.name || 'Sản phẩm';
                    const qty = sub.quantity || sub.qty || 1;
                    const price = Number(sub.unitPrice || sub.price || 0);

                    return (
                      <View key={i} style={styles.itemLine}>
                        <Text style={styles.itemLineName} numberOfLines={1}>
                          {qty}x {name} {sub.variantName ? `(${sub.variantName})` : ''}
                        </Text>
                        <Text style={styles.itemLinePrice}>
                          {(price * qty).toLocaleString('vi-VN')} đ
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Card Footer */}
                <View style={styles.cardFooter}>
                  <View style={styles.cardFooterLeft}>
                    <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
                    <Text style={styles.totalVal}>{item.totalAmount.toLocaleString('vi-VN')} đ</Text>
                  </View>
                  <View style={styles.viewDetailBadge}>
                    <Text style={styles.viewDetailBadgeText}>Xem chi tiết</Text>
                    <Ionicons name="chevron-forward" size={14} color="#D84315" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Order Detail Modal */}
      <Modal visible={detailModalVisible} animationType="slide">
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#3E2723" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chi Tiết Đơn Hàng 🧾</Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedOrder && (
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {/* Order Basic Summary Box */}
              <View style={styles.detailBox}>
                <View style={styles.detailBoxHeader}>
                  <Text style={styles.detailOrderCode}>{selectedOrder.orderCode}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      selectedOrder.status === 'COMPLETED'
                        ? styles.statusSuccess
                        : selectedOrder.status === 'CANCELLED'
                        ? styles.statusCancelled
                        : styles.statusProgress,
                    ]}>
                    <Text
                      style={[
                        styles.statusText,
                        selectedOrder.status === 'COMPLETED'
                          ? styles.statusSuccessText
                          : selectedOrder.status === 'CANCELLED'
                          ? styles.statusCancelledText
                          : styles.statusProgressText,
                      ]}>
                      {selectedOrder.statusText}
                    </Text>
                  </View>
                </View>
                <Text style={styles.detailDate}>Thời gian: {selectedOrder.date}</Text>
                <Text style={styles.detailText}>Cửa hàng: {selectedOrder.branchName}</Text>
                <Text style={styles.detailText}>Thanh toán: {selectedOrder.paymentMethod}</Text>
                <Text style={styles.detailText}>Giao đến: {selectedOrder.shippingAddress}</Text>
              </View>

              {/* Items List with Review Action */}
              <Text style={styles.sectionTitleModal}>Danh sách sản phẩm trong đơn</Text>
              {selectedOrder.items.map((item: any, idx: number) => {
                const name = item.productName || item.product?.name || item.name || 'Sản phẩm';
                const qty = item.quantity || item.qty || 1;
                const price = Number(item.unitPrice || item.price || 0);

                return (
                  <View key={item.id || idx} style={styles.detailItemCard}>
                    <View style={styles.detailItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailItemName}>{name}</Text>
                        <Text style={styles.detailItemSpec}>
                          {item.variantName ? `Size: ${item.variantName}` : ''}{' '}
                          {item.sugar ? `• Đường: ${item.sugar}` : ''}{' '}
                          {item.ice ? `• Đá: ${item.ice}` : ''}
                        </Text>
                        <Text style={styles.detailItemPriceQty}>
                          {qty} x {price.toLocaleString('vi-VN')} đ = {(price * qty).toLocaleString('vi-VN')} đ
                        </Text>
                      </View>
                    </View>

                    {/* Review Section (ONLY FOR COMPLETED ORDERS) */}
                    {selectedOrder.status === 'COMPLETED' && (
                      <View style={styles.itemReviewSection}>
                        {item.isReviewed ? (
                          <View style={styles.reviewedBadgeBox}>
                            <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.reviewedBadgeTitle}>
                                Đã đánh giá ⭐ {item.review?.rating || 5}/5
                              </Text>
                              {item.review?.comment && (
                                <Text style={styles.reviewedCommentText}>
                                  "{item.review.comment}"
                                </Text>
                              )}
                            </View>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.reviewBtnAction}
                            onPress={() => handleOpenReviewForm(item)}>
                            <Ionicons name="star" size={16} color="#FFFFFF" />
                            <Text style={styles.reviewBtnActionText}>
                              Viết đánh giá món này (+Điểm thưởng)
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Price Calculation Summary */}
              <View style={styles.detailBox}>
                <View style={styles.priceSummaryRow}>
                  <Text style={styles.priceSummaryLabel}>Tiền hàng:</Text>
                  <Text style={styles.priceSummaryVal}>
                    {(selectedOrder.subtotal || selectedOrder.totalAmount).toLocaleString('vi-VN')} đ
                  </Text>
                </View>
                {selectedOrder.discountAmount > 0 && (
                  <View style={styles.priceSummaryRow}>
                    <Text style={styles.priceSummaryLabel}>Giảm giá:</Text>
                    <Text style={[styles.priceSummaryVal, { color: '#2E7D32' }]}>
                      -{selectedOrder.discountAmount.toLocaleString('vi-VN')} đ
                    </Text>
                  </View>
                )}
                <View style={styles.priceSummaryRow}>
                  <Text style={styles.priceSummaryLabel}>Phí giao hàng:</Text>
                  <Text style={styles.priceSummaryVal}>
                    {(selectedOrder.shippingFee || 15000).toLocaleString('vi-VN')} đ
                  </Text>
                </View>
                <View style={[styles.priceSummaryRow, styles.totalSummaryRow]}>
                  <Text style={styles.totalSummaryLabel}>Tổng thanh toán:</Text>
                  <Text style={styles.totalSummaryVal}>
                    {selectedOrder.totalAmount.toLocaleString('vi-VN')} đ
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Write Product Review Modal */}
      <Modal visible={reviewModalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setReviewModalVisible(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#3E2723" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Đánh Giá Sản Phẩm ⭐</Text>
            <View style={{ width: 24 }} />
          </View>

          {reviewingItem && (
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <View style={styles.reviewProductBox}>
                <Text style={styles.reviewProductName}>
                  {reviewingItem.productName || reviewingItem.product?.name || reviewingItem.name}
                </Text>
                <Text style={styles.reviewProductSub}>
                  Đơn hàng: {selectedOrder?.orderCode}
                </Text>
              </View>

              {/* Star Rating Picker */}
              <Text style={styles.formSectionTitle}>Chất lượng sản phẩm</Text>
              <View style={styles.starPickerRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)}>
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={36}
                      color="#FFB300"
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.starRatingText}>
                {rating === 5 ? 'Cực kỳ hài lòng 😍' : rating === 4 ? 'Rất ngon 😋' : rating === 3 ? 'Bình thường 🙂' : 'Chưa hài lòng 🙁'}
              </Text>

              {/* Comment Input */}
              <Text style={styles.formSectionTitle}>Cảm nhận của bạn</Text>
              <TextInput
                style={styles.commentInput}
                multiline
                numberOfLines={4}
                placeholder="Hãy chia sẻ trải nghiệm hương vị bánh & cà phê của bạn..."
                placeholderTextColor="#A1887F"
                value={comment}
                onChangeText={setComment}
              />

              {/* Photo Upload Attachment */}
              <Text style={styles.formSectionTitle}>Đính kèm hình ảnh thực tế (Không bắt buộc)</Text>
              {reviewImageUrl ? (
                <View style={styles.attachedImgBox}>
                  <Image source={{ uri: reviewImageUrl }} style={styles.attachedImg} />
                  <TouchableOpacity
                    style={styles.removeImgBtn}
                    onPress={() => setReviewImageUrl('')}>
                    <Ionicons name="trash" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.attachPhotoBtn} onPress={handlePickReviewImage}>
                  <Ionicons name="camera-outline" size={24} color="#D84315" />
                  <Text style={styles.attachPhotoBtnText}>Thêm ảnh sản phẩm</Text>
                </TouchableOpacity>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitReviewBtn, submittingReview && { opacity: 0.6 }]}
                onPress={handleSubmitReview}
                disabled={submittingReview}>
                {submittingReview ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitReviewBtnText}>GỬI ĐÁNH GIÁ NGAY</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
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
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 8,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EFEBE9',
    elevation: 2,
    ...Platform.select({
      web: { boxShadow: '0px 2px 5px rgba(0,0,0,0.05)' },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  orderDate: {
    fontSize: 11,
    color: '#8D6E63',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusProgress: {
    backgroundColor: '#FFF3E0',
  },
  statusProgressText: {
    color: '#E65100',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusSuccess: {
    backgroundColor: '#E8F5E9',
  },
  statusSuccessText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusCancelled: {
    backgroundColor: '#FFEBEE',
  },
  statusCancelledText: {
    color: '#C62828',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 8,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: '#D84315',
  },
  stepCircleInactive: {
    backgroundColor: '#E0E0E0',
  },
  stepLabel: {
    fontSize: 10,
    color: '#9E9E9E',
  },
  stepLabelActive: {
    color: '#D84315',
    fontWeight: 'bold',
  },
  itemsSummary: {
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
  },
  itemLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemLineName: {
    fontSize: 12,
    color: '#3E2723',
    flex: 1,
  },
  itemLinePrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5D4037',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EFEBE9',
    paddingTop: 8,
  },
  cardFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  totalLabel: {
    fontSize: 12,
    color: '#8D6E63',
  },
  totalVal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#D84315',
  },
  viewDetailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailBadgeText: {
    fontSize: 12,
    color: '#D84315',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3E2723',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 13,
    color: '#8D6E63',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  actionBtn: {
    backgroundColor: '#D84315',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
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
  detailBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFEBE9',
  },
  detailBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailOrderCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  detailDate: {
    fontSize: 12,
    color: '#8D6E63',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#5D4037',
    marginTop: 2,
  },
  sectionTitleModal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3E2723',
    marginBottom: 10,
  },
  detailItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFEBE9',
  },
  detailItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailItemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  detailItemSpec: {
    fontSize: 11,
    color: '#8D6E63',
    marginTop: 2,
  },
  detailItemPriceQty: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#D84315',
    marginTop: 4,
  },
  itemReviewSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5EBE6',
  },
  reviewBtnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D84315',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  reviewBtnActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reviewedBadgeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5E9',
    padding: 8,
    borderRadius: 10,
    gap: 8,
  },
  reviewedBadgeTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  reviewedCommentText: {
    fontSize: 11,
    color: '#388E3C',
    fontStyle: 'italic',
    marginTop: 2,
  },
  priceSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  priceSummaryLabel: {
    fontSize: 13,
    color: '#795548',
  },
  priceSummaryVal: {
    fontSize: 13,
    color: '#3E2723',
    fontWeight: '600',
  },
  totalSummaryRow: {
    borderTopWidth: 1,
    borderTopColor: '#EFEBE9',
    paddingTop: 8,
    marginTop: 4,
  },
  totalSummaryLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  totalSummaryVal: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#D84315',
  },
  reviewProductBox: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFEBE9',
    alignItems: 'center',
  },
  reviewProductName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3E2723',
    textAlign: 'center',
  },
  reviewProductSub: {
    fontSize: 12,
    color: '#8D6E63',
    marginTop: 4,
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3E2723',
    marginBottom: 8,
    marginTop: 10,
  },
  starPickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 10,
  },
  starRatingText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: 'bold',
    color: '#D84315',
    marginBottom: 16,
  },
  commentInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#3E2723',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    textAlignVertical: 'top',
    height: 100,
    marginBottom: 16,
  },
  attachPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCCBC',
    borderStyle: 'dashed',
    gap: 8,
    marginBottom: 20,
  },
  attachPhotoBtnText: {
    color: '#D84315',
    fontWeight: 'bold',
    fontSize: 13,
  },
  attachedImgBox: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 20,
  },
  attachedImg: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  removeImgBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#E53935',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitReviewBtn: {
    backgroundColor: '#D84315',
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    elevation: 3,
  },
  submitReviewBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
