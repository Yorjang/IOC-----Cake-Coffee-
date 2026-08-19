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
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../services/apiClient';

const VOUCHERS_PER_PAGE = 3;
const HISTORY_PER_PAGE = 5;

export default function PointsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [points, setPoints] = useState<number>(user?.points || 0);
  const [history, setHistory] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  // Pagination states
  const [vouchersPage, setVouchersPage] = useState<number>(1);
  const [historyPage, setHistoryPage] = useState<number>(1);

  // Confirmation modal state
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmVoucher, setConfirmVoucher] = useState<any | null>(null);

  // Real-time live polling & focus refresh
  useFocusEffect(
    useCallback(() => {
      fetchData(history.length === 0);
      const timer = setInterval(() => {
        fetchData(true); // silent live background fetch
      }, 4000);
      return () => clearInterval(timer);
    }, [user])
  );

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      // 1. Fetch real points and history from PostgreSQL Database
      const pointsRes = await apiFetch('/points/my-points').catch(() => null);
      if (pointsRes && typeof pointsRes.points === 'number') {
        setPoints(pointsRes.points);
        if (Array.isArray(pointsRes.history)) {
          setHistory(pointsRes.history);
        }
      } else {
        const histRes = await apiFetch('/points/history').catch(() => null);
        if (histRes) {
          if (typeof histRes.points === 'number') setPoints(histRes.points);
          if (Array.isArray(histRes.items)) setHistory(histRes.items);
        }
      }

      // 2. Fetch redeemable coupons (requiring points) AND public active vouchers
      const uParam = user?.id ? `?userId=${user.id}` : '';
      const [redeemableRes, publicRes] = await Promise.all([
        apiFetch(`/coupons/redeemable${uParam}`).catch(() => []),
        apiFetch(`/coupons/public${uParam}`).catch(() => []),
      ]);

      const redeemableList = Array.isArray(redeemableRes) ? redeemableRes : [];
      const publicList = Array.isArray(publicRes) ? publicRes : [];

      // Combine vouchers, avoiding duplicates by code/id
      const map = new Map<string, any>();
      redeemableList.forEach((v) => map.set(v.id || v.code, v));
      publicList.forEach((v) => {
        const key = v.id || v.code;
        if (!map.has(key)) map.set(key, v);
      });

      setVouchers(Array.from(map.values()));
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRedeemConfirm = (voucher: any) => {
    if (!user) {
      Alert.alert('Yêu cầu đăng nhập 🔑', 'Vui lòng đăng nhập tài khoản để đổi điểm thưởng lấy voucher.');
      return;
    }

    const ptsReq = Number(voucher.discountedPointsRequired ?? voucher.pointsRequired ?? 0);
    if (points < ptsReq) {
      Alert.alert(
        'Chưa đủ điểm thưởng ⭐️',
        `Voucher ${voucher.code} cần ${ptsReq.toLocaleString('vi-VN')} điểm. Hiện tại bạn đang có ${points.toLocaleString('vi-VN')} điểm.`
      );
      return;
    }

    setConfirmVoucher(voucher);
    setConfirmModalVisible(true);
  };

  const executeRedeem = async () => {
    if (!confirmVoucher) return;
    const voucher = confirmVoucher;
    const ptsReq = Number(voucher.discountedPointsRequired ?? voucher.pointsRequired ?? 0);

    setConfirmModalVisible(false);
    setRedeemingId(voucher.id);

    try {
      const res = await apiFetch(`/coupons/${voucher.id}/redeem`, {
        method: 'POST',
      });

      Alert.alert(
        'Đổi Voucher Thành Công! 🎉',
        res?.message || `Bạn đã dùng ${ptsReq.toLocaleString('vi-VN')} điểm đổi thành công mã ${voucher.code}.`,
        [
          { text: 'Đóng', style: 'cancel' },
          { text: 'Đến Giỏ Hàng', onPress: () => router.push('/(tabs)/cart') },
        ]
      );
      await fetchData(false);
    } catch (e: any) {
      Alert.alert('Đổi thất bại', e?.message || 'Có lỗi xảy ra khi thực hiện đổi voucher.');
    } finally {
      setRedeemingId(null);
      setConfirmVoucher(null);
    }
  };

  // Determine Rank Tier based on total points
  const getRankTier = (pts: number) => {
    if (pts >= 100000) return { name: 'KIM CƯƠNG 💎', color: '#00BCD4', next: 200000, target: 'Đặc quyền VVIP' };
    if (pts >= 20000) return { name: 'THÀNH VIÊN VÀNG 🥇', color: '#FFB300', next: 100000, target: 'Kim Cương' };
    if (pts >= 5000) return { name: 'THÀNH VIÊN BẠC 🥈', color: '#78909C', next: 20000, target: 'Hạng Vàng' };
    return { name: 'THÀNH VIÊN ĐỒNG 🥉', color: '#A1887F', next: 5000, target: 'Hạng Bạc' };
  };

  const currentTier = getRankTier(points);
  const progressPercent = Math.min(100, Math.round((points / currentTier.next) * 100));

  const confirmPtsReq = confirmVoucher
    ? Number(confirmVoucher.discountedPointsRequired ?? confirmVoucher.pointsRequired ?? 0)
    : 0;

  // Calculate paginated slices
  const totalVoucherPages = Math.max(1, Math.ceil(vouchers.length / VOUCHERS_PER_PAGE));
  const currentVoucherPage = Math.min(vouchersPage, totalVoucherPages);
  const paginatedVouchers = vouchers.slice(
    (currentVoucherPage - 1) * VOUCHERS_PER_PAGE,
    currentVoucherPage * VOUCHERS_PER_PAGE
  );

  const totalHistoryPages = Math.max(1, Math.ceil(history.length / HISTORY_PER_PAGE));
  const currentHistoryPage = Math.min(historyPage, totalHistoryPages);
  const paginatedHistory = history.slice(
    (currentHistoryPage - 1) * HISTORY_PER_PAGE,
    currentHistoryPage * HISTORY_PER_PAGE
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.userBar}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
          ) : (
            <View style={styles.userAvatarCircle}>
              <Text style={styles.userAvatarLetter}>
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
          )}
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.userName}>{user?.fullName || 'Khách hàng Sweet Bean'}</Text>
            <Text style={[styles.tierBadgeText, { color: currentTier.color }]}>
              {currentTier.name}
            </Text>
          </View>
        </View>

        {/* Royalty Points VIP Card */}
        <View style={styles.pointsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="sparkles" size={24} color="#FFB300" />
            <Text style={styles.cardBrandTitle}>SWEET BEAN REWARDS</Text>
          </View>

          <Text style={styles.pointsVal}>{points.toLocaleString('vi-VN')} điểm</Text>
          <Text style={styles.cardSub}>Điểm tích lũy mua sắm tự động từ đơn hàng của bạn</Text>

          {/* Progress Bar to next tier */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Tiến trình lên {currentTier.target}</Text>
              <Text style={styles.progressVal}>{progressPercent}%</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
          </View>
        </View>

        {/* Vouchers Available for Exchange */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Đổi Voucher Khuyến Mãi 🎟️</Text>
          {vouchers.length > 0 && (
            <Text style={styles.countBadgeText}>
              (Tổng {vouchers.length} mã)
            </Text>
          )}
        </View>

        {vouchers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="ticket-outline" size={36} color="#BCAAA4" />
            <Text style={styles.emptyText}>Chưa có voucher khả dụng lúc này.</Text>
          </View>
        ) : (
          <>
            {paginatedVouchers.map((voucher: any) => {
              const rawVal = Number(voucher.discountValue || 0);
              const formattedVal = Number.isInteger(rawVal) ? rawVal : parseFloat(rawVal.toFixed(2));
              const discountStr = voucher.discountType === 'percent' || voucher.discountType === 'percentage'
                ? `Giảm ${formattedVal}%`
                : `Giảm ${rawVal.toLocaleString('vi-VN')}đ`;

              const ptsRequired = Number(voucher.discountedPointsRequired ?? voucher.pointsRequired ?? 0);
              const isPointVoucher = ptsRequired > 0;
              const hasRedeemed = voucher.hasRedeemed;

              return (
                <View key={voucher.id || voucher.code} style={styles.voucherItemCard}>
                  <View style={[styles.voucherLeft, isPointVoucher && { backgroundColor: '#E65100' }]}>
                    <Ionicons name={isPointVoucher ? 'star' : 'gift'} size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.voucherRight}>
                    <View style={styles.voucherRow}>
                      <Text style={styles.voucherCode}>{voucher.code}</Text>
                      <Text style={styles.voucherDiscount}>{discountStr}</Text>
                    </View>

                    <Text style={styles.voucherDesc} numberOfLines={2}>
                      {voucher.description || voucher.name || 'Áp dụng cho đơn hàng hợp lệ'}
                    </Text>

                    {/* Points requirement badge */}
                    {isPointVoucher && (
                      <View style={styles.pointCostBadge}>
                        <Ionicons name="star" size={13} color="#FFB300" />
                        <Text style={styles.pointCostBadgeText}>
                          Đổi bằng {ptsRequired.toLocaleString('vi-VN')} điểm
                        </Text>
                      </View>
                    )}

                    {/* Action button */}
                    {isPointVoucher ? (
                      hasRedeemed ? (
                        <View style={styles.redeemedRow}>
                          <Text style={styles.redeemedText}>✅ Đã đổi mã này</Text>
                          <TouchableOpacity
                            style={styles.useVoucherBtn}
                            onPress={() => router.push('/(tabs)/cart')}>
                            <Text style={styles.useVoucherBtnText}>Dùng ngay</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[
                            styles.redeemBtn,
                            points < ptsRequired && styles.redeemBtnDisabled,
                          ]}
                          disabled={redeemingId === voucher.id}
                          onPress={() => handleOpenRedeemConfirm(voucher)}>
                          {redeemingId === voucher.id ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                              <Text style={styles.redeemBtnText}>
                                Đổi ({ptsRequired.toLocaleString('vi-VN')} điểm)
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )
                    ) : (
                      <TouchableOpacity
                        style={styles.useVoucherBtn}
                        onPress={() => {
                          Alert.alert(
                            'Dùng Voucher',
                            `Mã ${voucher.code} đã sẵn sàng! Bạn có thể chọn áp dụng ngay ở màn hình Giỏ Hàng.`,
                            [
                              { text: 'Đóng', style: 'cancel' },
                              { text: 'Đến Giỏ Hàng', onPress: () => router.push('/(tabs)/cart') },
                            ]
                          );
                        }}>
                        <Text style={styles.useVoucherBtnText}>Dùng ngay</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}

            {/* Voucher Pagination Controls */}
            {totalVoucherPages > 1 && (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  disabled={currentVoucherPage <= 1}
                  style={[
                    styles.pageBtn,
                    currentVoucherPage <= 1 && styles.pageBtnDisabled,
                  ]}
                  onPress={() => setVouchersPage((p) => Math.max(1, p - 1))}>
                  <Ionicons
                    name="chevron-back"
                    size={16}
                    color={currentVoucherPage <= 1 ? '#BDBDBD' : '#FFFFFF'}
                  />
                  <Text
                    style={[
                      styles.pageBtnText,
                      currentVoucherPage <= 1 && styles.pageBtnTextDisabled,
                    ]}>
                    Trang trước
                  </Text>
                </TouchableOpacity>

                <Text style={styles.pageInfoText}>
                  Trang <Text style={{ fontWeight: 'bold', color: '#D84315' }}>{currentVoucherPage}</Text> / {totalVoucherPages}
                </Text>

                <TouchableOpacity
                  disabled={currentVoucherPage >= totalVoucherPages}
                  style={[
                    styles.pageBtn,
                    currentVoucherPage >= totalVoucherPages && styles.pageBtnDisabled,
                  ]}
                  onPress={() => setVouchersPage((p) => Math.min(totalVoucherPages, p + 1))}>
                  <Text
                    style={[
                      styles.pageBtnText,
                      currentVoucherPage >= totalVoucherPages && styles.pageBtnTextDisabled,
                    ]}>
                    Trang sau
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={currentVoucherPage >= totalVoucherPages ? '#BDBDBD' : '#FFFFFF'}
                  />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* Points History */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Lịch Sử Tích / Tiêu Điểm 📜</Text>
          {history.length > 0 && (
            <Text style={styles.countBadgeText}>
              (Tổng {history.length} giao dịch)
            </Text>
          )}
        </View>

        {loading ? (
          <ActivityIndicator color="#D84315" style={{ marginVertical: 20 }} />
        ) : history.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={36} color="#BCAAA4" />
            <Text style={styles.emptyText}>Chưa có lịch sử biến động điểm.</Text>
            <Text style={styles.emptySubText}>Hoàn thành các đơn hàng để tự động tích điểm thưởng!</Text>
          </View>
        ) : (
          <>
            {paginatedHistory.map((item: any, idx: number) => {
              const isPositive = (item.points || 0) > 0;
              const description = item.description || item.reason || (isPositive ? 'Tích điểm mua hàng' : 'Đổi voucher khuyến mãi');
              return (
                <View key={item.id || idx} style={styles.historyCard}>
                  <View
                    style={[
                      styles.historyIconCircle,
                      { backgroundColor: isPositive ? '#E8F5E9' : '#FFEBEE' },
                    ]}>
                    <Ionicons
                      name={isPositive ? 'add-circle' : 'remove-circle'}
                      size={22}
                      color={isPositive ? '#2E7D32' : '#E53935'}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.historyReason}>{description}</Text>
                    <Text style={styles.historyDate}>
                      {item.createdAt || item.created_at ? new Date(item.createdAt || item.created_at).toLocaleString('vi-VN') : 'Mới đây'}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.historyPtsVal,
                      { color: isPositive ? '#2E7D32' : '#E53935' },
                    ]}>
                    {isPositive ? `+${item.points}` : `${item.points}`} điểm
                  </Text>
                </View>
              );
            })}

            {/* History Pagination Controls */}
            {totalHistoryPages > 1 && (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  disabled={currentHistoryPage <= 1}
                  style={[
                    styles.pageBtn,
                    currentHistoryPage <= 1 && styles.pageBtnDisabled,
                  ]}
                  onPress={() => setHistoryPage((p) => Math.max(1, p - 1))}>
                  <Ionicons
                    name="chevron-back"
                    size={16}
                    color={currentHistoryPage <= 1 ? '#BDBDBD' : '#FFFFFF'}
                  />
                  <Text
                    style={[
                      styles.pageBtnText,
                      currentHistoryPage <= 1 && styles.pageBtnTextDisabled,
                    ]}>
                    Trang trước
                  </Text>
                </TouchableOpacity>

                <Text style={styles.pageInfoText}>
                  Trang <Text style={{ fontWeight: 'bold', color: '#D84315' }}>{currentHistoryPage}</Text> / {totalHistoryPages}
                </Text>

                <TouchableOpacity
                  disabled={currentHistoryPage >= totalHistoryPages}
                  style={[
                    styles.pageBtn,
                    currentHistoryPage >= totalHistoryPages && styles.pageBtnDisabled,
                  ]}
                  onPress={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}>
                  <Text
                    style={[
                      styles.pageBtnText,
                      currentHistoryPage >= totalHistoryPages && styles.pageBtnTextDisabled,
                    ]}>
                    Trang sau
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={currentHistoryPage >= totalHistoryPages ? '#BDBDBD' : '#FFFFFF'}
                  />
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* Royalty Rules */}
        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>Quy tắc tích điểm Sweet Bean 💡</Text>
          <Text style={styles.rulesItem}>• Mỗi 1.000đ giá trị đơn hàng = 1 điểm thưởng.</Text>
          <Text style={styles.rulesItem}>• Điểm tự động cộng vào tài khoản sau khi đơn hàng giao thành công.</Text>
          <Text style={styles.rulesItem}>• Dùng điểm để đổi voucher giảm giá trên ứng dụng bất cứ lúc nào!</Text>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="sparkles" size={32} color="#E65100" />
            </View>

            <Text style={styles.modalTitle}>Xác Nhận Đổi Voucher 🎟️</Text>
            <Text style={styles.modalMessage}>
              Bạn có chắc chắn muốn dùng{' '}
              <Text style={{ fontWeight: 'bold', color: '#E65100' }}>
                {confirmPtsReq.toLocaleString('vi-VN')} điểm
              </Text>{' '}
              để đổi voucher{' '}
              <Text style={{ fontWeight: 'bold', color: '#3E2723' }}>
                "{confirmVoucher?.code}"
              </Text>{' '}
              không?
            </Text>

            <View style={styles.modalBalanceBox}>
              <Text style={styles.modalBalanceText}>
                Điểm hiện có: <Text style={{ fontWeight: 'bold' }}>{points.toLocaleString('vi-VN')} điểm</Text>
              </Text>
              <Text style={styles.modalBalanceText}>
                Điểm còn lại: <Text style={{ fontWeight: 'bold', color: '#2E7D32' }}>{(points - confirmPtsReq).toLocaleString('vi-VN')} điểm</Text>
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setConfirmModalVisible(false)}>
                <Text style={styles.modalCancelText}>Hủy bỏ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={executeRedeem}>
                <Text style={styles.modalConfirmText}>Đổi Ngay 🎟️</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  userBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEBE9',
  },
  userAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D84315',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarLetter: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  pointsCard: {
    backgroundColor: '#3E2723',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardBrandTitle: {
    color: '#FFB300',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  pointsVal: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  cardSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  progressContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
  },
  progressVal: {
    color: '#FFB300',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFB300',
    borderRadius: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  countBadgeText: {
    fontSize: 12,
    color: '#8D6E63',
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EFEBE9',
  },
  emptyText: {
    fontSize: 14,
    color: '#6D4C41',
    fontWeight: 'bold',
    marginTop: 8,
  },
  emptySubText: {
    fontSize: 12,
    color: '#8D6E63',
    marginTop: 4,
    textAlign: 'center',
  },
  voucherItemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  voucherLeft: {
    width: 60,
    backgroundColor: '#D84315',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voucherRight: {
    flex: 1,
    padding: 12,
  },
  voucherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voucherCode: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  voucherDiscount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#D84315',
  },
  voucherDesc: {
    fontSize: 12,
    color: '#6D4C41',
    marginTop: 4,
  },
  pointCostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF3E0',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  pointCostBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#E65100',
  },
  useVoucherBtn: {
    backgroundColor: '#3E2723',
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 8,
  },
  useVoucherBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  redeemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E65100',
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 8,
  },
  redeemBtnDisabled: {
    backgroundColor: '#BDBDBD',
  },
  redeemBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  redeemedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  redeemedText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EFEBE9',
  },
  historyIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyReason: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  historyDate: {
    fontSize: 11,
    color: '#8D6E63',
    marginTop: 2,
  },
  historyPtsVal: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 8,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3E2723',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  pageBtnDisabled: {
    backgroundColor: '#E0E0E0',
  },
  pageBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pageBtnTextDisabled: {
    color: '#9E9E9E',
  },
  pageInfoText: {
    fontSize: 13,
    color: '#5D4037',
  },
  rulesCard: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  rulesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D84315',
    marginBottom: 8,
  },
  rulesItem: {
    fontSize: 12,
    color: '#5D4037',
    marginBottom: 4,
    lineHeight: 18,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  modalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3E2723',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#5D4037',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  modalBalanceBox: {
    width: '100%',
    backgroundColor: '#FFF8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    gap: 4,
  },
  modalBalanceText: {
    fontSize: 13,
    color: '#5D4037',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#757575',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#E65100',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
