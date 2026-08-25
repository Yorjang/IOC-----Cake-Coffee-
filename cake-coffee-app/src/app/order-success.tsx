import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { apiFetch } from '../services/apiClient';

const ORDER_STEPS = [
  { key: 'PENDING', label: 'Chờ nhận' },
  { key: 'IN_PROGRESS', label: 'Pha chế' },
  { key: 'SHIPPING', label: 'Đang giao' },
  { key: 'COMPLETED', label: 'Hoàn thành' },
];

export default function OrderSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const orderId = params.orderId;

  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchOrderDetail = async (isSilent = false) => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    if (!isSilent) setLoading(true);

    try {
      // 1. Try public endpoint first
      let res = await apiFetch(`/orders/public/${orderId}`).catch(() => null);

      // 2. Fallback to my orders list if needed
      if (!res) {
        const myOrders = await apiFetch('/orders/my').catch(() => []);
        const rawList = Array.isArray(myOrders) ? myOrders : Array.isArray(myOrders?.data) ? myOrders.data : [];
        res = rawList.find((o: any) => o.id === orderId || o.orderCode === orderId);
      }

      if (res && res.data) {
        res = res.data;
      }

      if (res) {
        setOrder(res);
      }
    } catch (e) {
      console.error('Failed to fetch order confirmation detail:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrderDetail(order?.id === orderId);
      const timer = setInterval(() => {
        fetchOrderDetail(true); // silent live status update
      }, 4000);
      return () => clearInterval(timer);
    }, [orderId])
  );

  const rawStatus = (order?.orderStatus || order?.status || 'PENDING').toUpperCase();
  const currentStepIndex = ORDER_STEPS.findIndex((s) => s.key === rawStatus);
  const activeStepIdx = currentStepIndex >= 0 ? currentStepIndex : 0;

  const formattedDate = order?.createdAt
    ? new Date(order.createdAt).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Mới đây';

  const orderCodeStr = order?.orderCode || (order?.id ? `#${order.id.substring(0, 8).toUpperCase()}` : '#ORDER');

  if (loading && !order) {
    return (
      <SafeAreaView style={styles.loadingArea}>
        <ActivityIndicator size="large" color="#D84315" />
        <Text style={styles.loadingText}>Đang tải thông tin đơn hàng từ Database...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Success Header Banner */}
        <View style={styles.successBanner}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark-sharp" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.bannerTitle}>ĐẶT HÀNG THÀNH CÔNG!</Text>
          <Text style={styles.bannerSub}>
            Cảm ơn bạn đã lựa chọn Sweet Bean Coffee & Cake! Đơn hàng của bạn đã được ghi nhận vào hệ thống.
          </Text>

          <View style={styles.orderCodeBox}>
            <Text style={styles.orderCodeLabel}>Mã Đơn Hàng:</Text>
            <Text style={styles.orderCodeValue}>{orderCodeStr}</Text>
          </View>
        </View>

        {/* Live Order Timeline Progress */}
        <View style={styles.cardSection}>
          <Text style={styles.cardSectionTitle}>Tiến Trình Đơn Hàng Real-Time</Text>
          <View style={styles.timelineRow}>
            {ORDER_STEPS.map((step, idx) => {
              const isPassed = idx <= activeStepIdx;
              const isCurrent = idx === activeStepIdx;
              return (
                <View key={step.key} style={styles.timelineStep}>
                  <View
                    style={[
                      styles.stepDot,
                      isPassed && styles.stepDotPassed,
                      isCurrent && styles.stepDotCurrent,
                    ]}>
                    {isPassed ? (
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    ) : (
                      <Text style={styles.stepNum}>{idx + 1}</Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      isPassed && styles.stepLabelPassed,
                      isCurrent && styles.stepLabelCurrent,
                    ]}>
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Recipient & Delivery Address Card */}
        <View style={styles.cardSection}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="location" size={20} color="#D84315" />
            <Text style={styles.cardSectionTitle}>Địa Chỉ Giao Hàng</Text>
          </View>
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Người nhận:</Text>
              <Text style={styles.infoVal}>{order?.shippingRecipientName || 'Khách hàng'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Số điện thoại:</Text>
              <Text style={styles.infoVal}>{order?.shippingAddressPhone || 'Chưa cập nhật'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Địa chỉ:</Text>
              <Text style={[styles.infoVal, { flex: 1, textAlign: 'right' }]}>
                {order?.shippingAddressStreet || '123 Đường 3/2, Quận 10, TP. HCM'}
              </Text>
            </View>
            {order?.branch?.name && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Chi nhánh xử lý:</Text>
                <Text style={styles.infoVal}>{order.branch.name}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Thời gian tạo:</Text>
              <Text style={styles.infoVal}>{formattedDate}</Text>
            </View>
          </View>
        </View>

        {/* Payment Method Card */}
        <View style={styles.cardSection}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="card" size={20} color="#D84315" />
            <Text style={styles.cardSectionTitle}>Thanh Toán</Text>
          </View>
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phương thức:</Text>
              <Text style={styles.infoVal}>
                {order?.paymentMethod === 'VNPAY' || order?.paymentMethod === 'QR'
                  ? 'Ví điện tử VNPay / Chuyển khoản QR'
                  : 'Thanh toán tiền mặt khi nhận hàng (COD)'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Trạng thái thanh toán:</Text>
              <Text
                style={[
                  styles.infoVal,
                  { color: order?.paymentStatus === 'PAID' ? '#2E7D32' : '#E65100', fontWeight: 'bold' },
                ]}>
                {order?.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán khi nhận hàng'}
              </Text>
            </View>
          </View>
        </View>

        {/* Items Ordered List */}
        <View style={styles.cardSection}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="fast-food" size={20} color="#D84315" />
            <Text style={styles.cardSectionTitle}>Danh Sách Món ({order?.items?.length || 0})</Text>
          </View>

          {Array.isArray(order?.items) && order.items.length > 0 ? (
            order.items.map((item: any, idx: number) => {
              const itemTotal = Number(item.totalPrice || item.unitPrice * item.quantity || 0);
              const imgUri = item.product?.images?.[0] || item.productImage || item.image;

              return (
                <View key={item.id || idx} style={styles.itemRow}>
                  {imgUri ? (
                    <Image source={{ uri: imgUri }} style={styles.itemThumb} />
                  ) : (
                    <View style={styles.itemThumbPlaceholder}>
                      <Ionicons name="cafe" size={24} color="#8D6E63" />
                    </View>
                  )}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.itemNameText}>{item.productName || item.name || 'Sản phẩm'}</Text>
                    {item.variantName && <Text style={styles.itemSubText}>{item.variantName}</Text>}
                    {item.sugar && <Text style={styles.itemSpecText}>Đường: {item.sugar} • Đá: {item.ice}</Text>}
                    <Text style={styles.itemQtyText}>x{item.quantity}</Text>
                  </View>
                  <Text style={styles.itemPriceText}>{itemTotal.toLocaleString('vi-VN')}đ</Text>
                </View>
              );
            })
          ) : (
            <Text style={{ color: '#8D6E63', fontStyle: 'italic', marginVertical: 10 }}>
              Thông tin món đang được đồng bộ...
            </Text>
          )}
        </View>

        {/* Financial Summary */}
        <View style={styles.cardSection}>
          <Text style={styles.cardSectionTitle}>Tóm Tắt Thanh Toán</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tiền hàng:</Text>
            <Text style={styles.summaryVal}>
              {Number(order?.subtotal || order?.totalAmount || 0).toLocaleString('vi-VN')}đ
            </Text>
          </View>
          {Number(order?.discountAmount || 0) > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giảm giá Voucher:</Text>
              <Text style={[styles.summaryVal, { color: '#2E7D32' }]}>
                -{Number(order.discountAmount).toLocaleString('vi-VN')}đ
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí giao hàng:</Text>
            <Text style={styles.summaryVal}>
              {Number(order?.shippingFee || 15000).toLocaleString('vi-VN')}đ
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Tổng Thanh Toán:</Text>
            <Text style={styles.grandTotalVal}>
              {Number(order?.totalAmount || 0).toLocaleString('vi-VN')}đ
            </Text>
          </View>
        </View>

        {/* Navigation Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.ordersBtn}
            onPress={() => router.replace('/(tabs)/orders')}>
            <Ionicons name="receipt" size={18} color="#FFFFFF" />
            <Text style={styles.ordersBtnText}>Theo Dõi Đơn Hàng</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => router.replace('/(tabs)')}>
            <Ionicons name="home" size={18} color="#3E2723" />
            <Text style={styles.homeBtnText}>Về Trang Chủ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingArea: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6D4C41',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
  },
  successBanner: {
    backgroundColor: '#3E2723',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
  },
  checkCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 4,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFB300',
    textAlign: 'center',
    marginBottom: 6,
  },
  bannerSub: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  orderCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  orderCodeLabel: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  orderCodeValue: {
    color: '#FFB300',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EFEBE9',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  timelineStep: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepDotPassed: {
    backgroundColor: '#4CAF50',
  },
  stepDotCurrent: {
    backgroundColor: '#D84315',
  },
  stepNum: {
    fontSize: 11,
    color: '#757575',
    fontWeight: 'bold',
  },
  stepLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    textAlign: 'center',
  },
  stepLabelPassed: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  stepLabelCurrent: {
    color: '#D84315',
    fontWeight: 'bold',
  },
  infoBox: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 13,
    color: '#795548',
  },
  infoVal: {
    fontSize: 13,
    color: '#3E2723',
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EBE6',
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#EFEBE9',
  },
  itemThumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  itemSubText: {
    fontSize: 11,
    color: '#795548',
  },
  itemSpecText: {
    fontSize: 11,
    color: '#8D6E63',
  },
  itemQtyText: {
    fontSize: 12,
    color: '#D84315',
    fontWeight: 'bold',
    marginTop: 2,
  },
  itemPriceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6D4C41',
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#EFEBE9',
    paddingTop: 10,
    marginTop: 6,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  grandTotalVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D84315',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  ordersBtn: {
    flex: 1,
    backgroundColor: '#D84315',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    elevation: 2,
  },
  ordersBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  homeBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#3E2723',
  },
  homeBtnText: {
    color: '#3E2723',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
