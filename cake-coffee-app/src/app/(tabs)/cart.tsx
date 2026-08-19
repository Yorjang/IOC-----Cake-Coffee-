import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../services/apiClient';

export function cleanStreetDetail(
  rawStreet: string,
  ward?: string,
  district?: string,
  province?: string
): string {
  if (!rawStreet) return '';
  let str = rawStreet.trim();

  const removePhrase = (phrase: string) => {
    if (!phrase) return;
    const cleanPhrase = phrase.trim();
    if (!cleanPhrase) return;

    const shortPhrase = cleanPhrase.replace(/^(Phường|Xã|Thị trấn|Quận|Huyện|Thị xã|TP\.|Tỉnh)\s+/i, '').trim();
    const targets = [cleanPhrase, shortPhrase, 'Hanoi', 'Việt Nam', 'Vietnam'].filter(
      (t) => t && t.length > 1
    );

    for (const t of targets) {
      const regex = new RegExp(`[,\\s\\-–]*${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'gi');
      str = str.replace(regex, '');
    }
  };

  if (province) removePhrase(province);
  if (district) removePhrase(district);
  if (ward) removePhrase(ward);

  return str.replace(/[,\\s\\-–]+$/, '').trim();
}

const VIETNAM_PROVINCES = ['TP. Hà Nội', 'TP. Hồ Chí Minh', 'TP. Đà Nẵng', 'Tỉnh Ninh Bình'];

const VIETNAM_DISTRICTS: Record<string, string[]> = {
  'TP. Hà Nội': ['Quận Hà Đông', 'Quận Cầu Giấy', 'Quận Thanh Xuân', 'Quận Ba Đình', 'Quận Đống Đa', 'Quận Hoàn Kiếm', 'Quận Nam Từ Liêm'],
  'TP. Hồ Chí Minh': ['Quận 1', 'Quận 3', 'Quận 7', 'Quận Bình Thạnh', 'TP. Thủ Đức'],
  'TP. Đà Nẵng': ['Quận Hải Châu', 'Quận Thanh Khê', 'Quận Sơn Trà'],
  'Tỉnh Ninh Bình': ['Huyện Gia Viễn', 'TP. Ninh Bình'],
};

const VIETNAM_WARDS: Record<string, string[]> = {
  'Quận Hà Đông': ['Phường Nguyễn Trãi', 'Phường Vạn Phúc', 'Phường Mỗ Lao', 'Phường Quang Trung', 'Phường Yết Kiêu', 'Phường Hà Cầu'],
  'Quận Cầu Giấy': ['Phường Dịch Vọng', 'Phường Dịch Vọng Hậu', 'Phường Mai Dịch', 'Phường Nghĩa Tân'],
  'Quận Thanh Xuân': ['Phường Nhân Chính', 'Phường Thanh Xuân Bắc', 'Phường Thanh Xuân Trung'],
  'Quận Ba Đình': ['Phường Đội Cấn', 'Phường Kim Mã', 'Phường Giảng Võ'],
  'Quận Đống Đa': ['Phường Ô Chợ Dừa', 'Phường Cát Linh', 'Phường Láng Hạ'],
  'Quận Hoàn Kiếm': ['Phường Hàng Bạc', 'Phường Tràng Tiền', 'Phường Lý Thái Tổ'],
  'Quận Nam Từ Liêm': ['Phường Mỹ Đình 1', 'Phường Mỹ Đình 2', 'Phường Mễ Trì'],
  'Quận 1': ['Phường Bến Nghé', 'Phường Bến Thành', 'Phường Tân Định'],
  'Quận 3': ['Phường Võ Thị Sáu', 'Phường 1', 'Phường 2'],
  'Quận 7': ['Phường Tân Phong', 'Phường Tân Phú'],
  'Quận Bình Thạnh': ['Phường 14', 'Phường 15', 'Phường 25'],
  'TP. Thủ Đức': ['Phường Thảo Điền', 'Phường An Phú', 'Phường Linh Trung'],
  'Quận Hải Châu': ['Phường Hải Châu 1', 'Phường Hòa Cường Bắc'],
  'Quận Thanh Khê': ['Phường Tân Chính', 'Phường Vĩnh Trung'],
  'Quận Sơn Trà': ['Phường An Hải Bắc', 'Phường Phước Mỹ'],
  'Huyện Gia Viễn': ['Xã Gia Vân (Tràng An)', 'Xã Gia Thanh', 'Thị trấn Me'],
  'TP. Ninh Bình': ['Phường Đông Thành', 'Phường Tân Thành'],
};

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    cart,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    discount,
    shippingFee,
    grandTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    setShippingFee,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [voucherModalVisible, setVoucherModalVisible] = useState(false);
  const [loginConfirmModalVisible, setLoginConfirmModalVisible] = useState(false);

  // Customer Delivery Info
  const [recipientName, setRecipientName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'VNPAY'>('COD');
  const [note, setNote] = useState('');

  // Saved User Addresses State
  const [userAddresses, setUserAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);

  // New Address Form State
  const [selectedCartProvince, setSelectedCartProvince] = useState('');
  const [selectedCartDistrict, setSelectedCartDistrict] = useState('');
  const [selectedCartWard, setSelectedCartWard] = useState('');
  const [newLabel, setNewLabel] = useState('Nhà riêng');
  const [newAddress, setNewAddress] = useState('');
  const [newRecipient, setNewRecipient] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);
  const [assignedBranch, setAssignedBranch] = useState<any>(null);
  const [fetchingBranch, setFetchingBranch] = useState(false);
  const [branchErrorMessage, setBranchErrorMessage] = useState<string | null>(null);
  const [deleteConfirmModalVisible, setDeleteConfirmModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      fetchVouchers();
      fetchUserAddresses();
      if (user) {
        if (!recipientName) setRecipientName(user.fullName || '');
        if (!phone) setPhone(user.phone || '');
      }
    }, [user])
  );

  const fetchAssignedBranch = async () => {
    setFetchingBranch(true);
    setBranchErrorMessage(null);
    try {
      let lat = 10.7769;
      let lng = 106.7009;
      if (selectedAddressId) {
        const found = userAddresses.find((a) => a.id === selectedAddressId);
        if (found && found.latitude && found.longitude && Number(found.latitude) !== 0) {
          lat = Number(found.latitude);
          lng = Number(found.longitude);
        }
      }
      const lower = (address || '').toLowerCase();
      if (
        lower.includes('hà nội') ||
        lower.includes('hanoi') ||
        lower.includes('hà đông') ||
        lower.includes('ha dong') ||
        lower.includes('cầu giấy') ||
        lower.includes('thanh xuân') ||
        lower.includes('ba đình') ||
        lower.includes('hoàn kiếm') ||
        lower.includes('đống đa')
      ) {
        lat = 20.9723;
        lng = 105.7770;
      } else if (lower.includes('đà nẵng') || lower.includes('da nang')) {
        lat = 16.0544;
        lng = 108.2022;
      }

      const quoteBody = {
        latitude: lat,
        longitude: lng,
        items: cart.map((item) => ({
          variantId: (item as any).variantId || item.productId,
          quantity: item.quantity,
        })),
      };

      const res = await apiFetch('/branches/delivery-quote', {
        method: 'POST',
        body: JSON.stringify(quoteBody),
      });

      const data = res?.data || res;
      if (data?.branch) {
        setAssignedBranch(data.branch);
        setBranchErrorMessage(null);
        if (data.shippingFee !== undefined && Number(data.shippingFee) >= 0) {
          setShippingFee(Number(data.shippingFee));
        }
      } else if (data?.id || data?.name) {
        setAssignedBranch(data);
        setBranchErrorMessage(null);
      } else {
        setAssignedBranch(null);
        setBranchErrorMessage('Hiện tại tất cả các chi nhánh đều đang đóng cửa hoặc hết sản phẩm trong giỏ hàng.');
      }
    } catch (e: any) {
      setAssignedBranch(null);
      setBranchErrorMessage('Hiện tại hết sản phẩm ở mọi chi nhánh (hoặc các cửa hàng đã đóng cửa).');
    } finally {
      setFetchingBranch(false);
    }
  };

  useEffect(() => {
    fetchAssignedBranch();
  }, [address, selectedAddressId, userAddresses, cart]);

  const fetchUserAddresses = async () => {
    if (!user) return;
    try {
      const res = await apiFetch('/users/addresses');
      if (Array.isArray(res)) {
        setUserAddresses(res);
        if (res.length > 0) {
          const def = res.find((a: any) => a.isDefault) || res[0];
          setSelectedAddressId(def.id);
          setAddress(def.address);
          if (def.recipientName) setRecipientName(def.recipientName);
          if (def.phone) setPhone(def.phone);
        }
      }
    } catch (e) {}
  };

  const handleSelectAddress = (addr: any) => {
    setSelectedAddressId(addr.id);
    setAddress(addr.address);
    if (addr.recipientName) setRecipientName(addr.recipientName);
    if (addr.phone) setPhone(addr.phone);
    setAddressModalVisible(false);
  };

  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  const handleEditCartAddressClick = (addr: any) => {
    setEditingAddressId(addr.id);
    setShowAddAddressForm(true);
    setNewLabel(addr.label || 'Nhà riêng');

    if (addr.city && VIETNAM_PROVINCES.includes(addr.city)) {
      setSelectedCartProvince(addr.city);
    } else {
      setSelectedCartProvince('TP. Hà Nội');
    }

    if (addr.district) {
      setSelectedCartDistrict(addr.district);
    } else {
      setSelectedCartDistrict('');
    }

    if (addr.ward) {
      setSelectedCartWard(addr.ward);
    } else {
      setSelectedCartWard('');
    }

    const streetText = addr.street || addr.address || '';
    const cleanStreet = cleanStreetDetail(streetText, addr.ward, addr.district, addr.city);
    setNewAddress(cleanStreet);
  };

  const handleDeleteCartAddress = (addrId: string) => {
    const doDelete = async () => {
      try {
        await apiFetch(`/users/addresses/${addrId}`, {
          method: 'DELETE',
        });
        const updated = await apiFetch('/users/addresses');
        if (Array.isArray(updated)) {
          setUserAddresses(updated);
          if (selectedAddressId === addrId && updated.length > 0) {
            handleSelectAddress(updated[0]);
          }
        }
        Alert.alert('Thành công 🗑️', 'Đã xóa địa chỉ khỏi sổ địa chỉ!');
      } catch (e: any) {
        Alert.alert('Lỗi', e.message || 'Không thể xóa địa chỉ.');
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này khỏi sổ địa chỉ không?')) {
        doDelete();
      }
    } else {
      Alert.alert('Xác nhận xóa 🗑️', 'Bạn có chắc chắn muốn xóa địa chỉ này khỏi sổ địa chỉ không?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa địa chỉ', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const handleSaveNewAddress = async () => {
    if (!selectedCartProvince) {
      Alert.alert('Thiếu thông tin 📍', 'Vui lòng chọn Thành phố / Tỉnh.');
      return;
    }
    if (!selectedCartDistrict) {
      Alert.alert('Thiếu thông tin 📍', 'Vui lòng chọn Quận / Huyện.');
      return;
    }
    if (!selectedCartWard) {
      Alert.alert('Thiếu thông tin 📍', 'Vui lòng chọn Phường / Xã / Thị trấn.');
      return;
    }
    if (!newAddress.trim()) {
      Alert.alert('Thiếu thông tin 📍', 'Vui lòng nhập số nhà và tên đường chi tiết.');
      return;
    }
    setSavingAddress(true);

    const cleanedStreet = cleanStreetDetail(newAddress, selectedCartWard, selectedCartDistrict, selectedCartProvince);
    const fullLockedAddress = `${cleanedStreet}, ${selectedCartWard}, ${selectedCartDistrict}, ${selectedCartProvince}`;

    let lat = 20.9723;
    let lng = 105.7770;
    if (selectedCartProvince.includes('Hồ Chí Minh')) {
      lat = 10.7769;
      lng = 106.7009;
    } else if (selectedCartProvince.includes('Đà Nẵng')) {
      lat = 16.0544;
      lng = 108.2022;
    } else if (selectedCartProvince.includes('Ninh Bình')) {
      lat = 20.2506;
      lng = 105.9744;
    }

    try {
      const body = {
        label: newLabel || 'Nhà riêng',
        address: fullLockedAddress,
        street: cleanedStreet,
        ward: selectedCartWard,
        district: selectedCartDistrict,
        city: selectedCartProvince,
        recipientName: newRecipient.trim() || recipientName || user?.fullName || 'Khách hàng',
        phone: newPhone.trim() || phone || user?.phone || '',
        latitude: lat,
        longitude: lng,
        isDefault: userAddresses.length === 0,
      };

      if (editingAddressId) {
        await apiFetch(`/users/addresses/${editingAddressId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch('/users/addresses', {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }

      const updated = await apiFetch('/users/addresses');
      if (Array.isArray(updated)) {
        setUserAddresses(updated);
        const newest = updated.find((a: any) => a.address === body.address) || updated[updated.length - 1];
        if (newest) {
          handleSelectAddress(newest);
        }
      }

      setEditingAddressId(null);
      setShowAddAddressForm(false);
      setNewAddress('');
      setSelectedCartProvince('');
      setSelectedCartDistrict('');
      setSelectedCartWard('');
      Alert.alert('Thành công 🎉', editingAddressId ? 'Đã cập nhật địa chỉ giao hàng!' : 'Đã lưu địa chỉ giao hàng!');
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Không thể lưu địa chỉ.');
    } finally {
      setSavingAddress(false);
    }
  };

  const fetchVouchers = async () => {
    try {
      const uParam = user?.id ? `?userId=${user.id}` : '';
      const [pubRes, redRes] = await Promise.all([
        apiFetch(`/coupons/public${uParam}`).catch(() => []),
        user ? apiFetch(`/coupons/redeemable${uParam}`).catch(() => []) : Promise.resolve([]),
      ]);

      const pubList = Array.isArray(pubRes) ? pubRes : [];
      const redList = Array.isArray(redRes) ? redRes : [];

      const map = new Map<string, any>();
      pubList.forEach((v) => map.set(v.id || v.code, v));
      redList.forEach((v) => {
        if (v.hasRedeemed) {
          map.set(v.id || v.code, v);
        }
      });

      const list = Array.from(map.values()).filter((v: any) => {
        const pointsReq = Number(v.pointsRequired || 0);
        if (pointsReq > 0 && v.hasRedeemed === false) return false;
        return true;
      });

      setAvailableCoupons(list);

      if (appliedCoupon) {
        const isStillAvailable = list.some(
          (v: any) => v.code.toUpperCase() === appliedCoupon.code.toUpperCase()
        );
        if (!isStillAvailable) {
          removeCoupon();
        }
      }
    } catch (e) {}
  };

  const isVoucherValidForCart = useCallback(
    (voucher: any): boolean => {
      if (!voucher) return false;

      // 1. Check expiration date
      if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) {
        return false;
      }

      // 2. Check minimum order subtotal requirement
      const minOrder = Number(voucher.minOrderValue || 0);
      if (minOrder > 0 && subtotal < minOrder) {
        return false;
      }

      // 3. Check specific product requirement
      if (voucher.productId) {
        const hasProduct = cart.some(
          (item) => item.productId === voucher.productId || item.id === voucher.productId
        );
        if (!hasProduct) return false;
      }

      // 4. Check specific category requirement
      if (voucher.categoriesId) {
        const hasCategory = cart.some(
          (item: any) =>
            item.categoriesId === voucher.categoriesId ||
            item.category?.id === voucher.categoriesId ||
            item.product?.categoriesId === voucher.categoriesId
        );
        if (!hasCategory) return false;
      }

      // 5. Check target size requirement
      if (voucher.targetSize) {
        const hasSize = cart.some(
          (item) => String(item.size).toUpperCase() === String(voucher.targetSize).toUpperCase()
        );
        if (!hasSize) return false;
      }

      return true;
    },
    [cart, subtotal]
  );

  const validCouponsForCart = availableCoupons.filter(isVoucherValidForCart);

  const checkLoginForVoucher = (): boolean => {
    if (!user) {
      setLoginConfirmModalVisible(true);
      return false;
    }
    return true;
  };

  const handleOpenVoucherModal = () => {
    setVoucherModalVisible(true);
  };

  const handleApplyCouponCode = async (codeToApply?: string) => {
    if (!checkLoginForVoucher()) return;

    const targetCode = (codeToApply || couponCode).trim().toUpperCase();
    if (!targetCode) return;

    // Find voucher in availableCoupons
    const found = availableCoupons.find((c) => c.code?.toUpperCase() === targetCode);
    if (found && !isVoucherValidForCart(found)) {
      const minVal = Number(found.minOrderValue || 0);
      let reason = 'Mã giảm giá này chưa hợp lệ cho đơn hàng hiện tại.';
      if (minVal > 0 && subtotal < minVal) {
        reason = `Mã ${targetCode} yêu cầu đơn hàng tối thiểu từ ${minVal.toLocaleString('vi-VN')}đ. (Hiện tại giỏ của bạn là ${subtotal.toLocaleString('vi-VN')}đ)`;
      }
      Alert.alert('Chưa đạt điều kiện ⚠️', reason);
      return;
    }

    setCouponLoading(true);
    const success = await applyCoupon(targetCode);
    setCouponLoading(false);

    if (success) {
      setVoucherModalVisible(false);
      Alert.alert('Thành công 🎉', `Đã áp dụng mã giảm giá ${targetCode}!`);
    } else {
      Alert.alert('Không hợp lệ ⚠️', 'Mã giảm giá không tồn tại, chưa đạt điều kiện hoặc đã hết hạn.');
    }
  };

  const handleSelectVoucherObj = async (voucher: any) => {
    if (!checkLoginForVoucher()) return;

    const type = voucher.discountType === 'percent' || voucher.discountType === 'percentage' ? 'percentage' : 'fixed';
    const val = Number(voucher.discountValue || 0);

    const success = await applyCoupon({
      code: voucher.code,
      discountType: type,
      discountValue: val,
      minOrderValue: Number(voucher.minOrderValue || 0),
    } as any);

    if (success) {
      setVoucherModalVisible(false);
      Alert.alert('Thành công', `Đã áp dụng voucher ${voucher.code}!`);
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Giỏ hàng trống', 'Vui lòng chọn món trước khi đặt hàng.');
      return;
    }

    const finalName = recipientName.trim() || user?.fullName || 'Khách hàng Sweet Bean';
    const finalPhone = phone.trim() || user?.phone;
    const finalAddress = address.trim();

    if (!finalAddress) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn hoặc nhập địa chỉ giao hàng.');
      return;
    }

    if (!finalPhone) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số điện thoại người nhận.');
      return;
    }

    if (branchErrorMessage || (!assignedBranch && !fetchingBranch)) {
      const msg = branchErrorMessage || 'Hiện tại các cửa hàng đang đóng cửa hoặc hết sản phẩm trong giỏ hàng. Vui lòng quay lại sau.';
      if (Platform.OS === 'web') {
        alert(`Không thể đặt hàng: ${msg}`);
      } else {
        Alert.alert('Hiện tại hết sản phẩm', msg);
      }
      return;
    }

    let lat = 10.7769;
    let lng = 106.7009;
    if (selectedAddressId) {
      const selectedAddrObj = userAddresses.find((a) => a.id === selectedAddressId);
      if (selectedAddrObj && selectedAddrObj.latitude && selectedAddrObj.longitude && Number(selectedAddrObj.latitude) !== 0) {
        lat = Number(selectedAddrObj.latitude);
        lng = Number(selectedAddrObj.longitude);
      }
    }
    const lowerAddr = (finalAddress || '').toLowerCase();
    if (
      lowerAddr.includes('hà nội') ||
      lowerAddr.includes('hanoi') ||
      lowerAddr.includes('hà đông') ||
      lowerAddr.includes('ha dong') ||
      lowerAddr.includes('cầu giấy') ||
      lowerAddr.includes('thanh xuân') ||
      lowerAddr.includes('ba đình') ||
      lowerAddr.includes('hoàn kiếm') ||
      lowerAddr.includes('đống đa')
    ) {
      lat = 20.9723;
      lng = 105.7770;
    } else if (lowerAddr.includes('đà nẵng') || lowerAddr.includes('da nang')) {
      lat = 16.0544;
      lng = 108.2022;
    }

    const payload: any = {
      shippingRecipientName: finalName,
      shippingAddressPhone: finalPhone,
      shippingAddressStreet: finalAddress,
      shippingLatitude: lat,
      shippingLongitude: lng,
      subtotal,
      discountAmount: discount,
      shippingFee,
      totalAmount: grandTotal,
      paymentMethod: (paymentMethod || 'cod').toLowerCase(),
      fulfillmentType: 'delivery',
      note,
      couponCode: appliedCoupon?.code || null,
      items: cart.map((item) => ({
        productId: item.productId,
        variantId: (item as any).variantId || item.productId,
        productName: item.name,
        variantName: `Size ${item.size}`,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
        sugar: item.sugar,
        ice: item.ice,
        toppings: item.toppings,
      })),
    };

    try {
      const resData = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const createdOrder = resData?.data || resData;
      const newOrderId = createdOrder?.id;

      clearCart();

      if (newOrderId) {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.location.href = `/order-success?orderId=${newOrderId}`;
        } else {
          router.push(`/order-success?orderId=${newOrderId}`);
        }
      } else {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.location.href = '/orders';
        } else {
          router.push('/(tabs)/orders');
        }
      }
    } catch (error: any) {
      const msg = error?.message || 'Có lỗi xảy ra khi tạo đơn hàng. Vui lòng kiểm tra lại.';
      if (Platform.OS === 'web') {
        alert(`Không thể đặt hàng: ${msg}`);
      } else {
        Alert.alert('Không thể đặt hàng', msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color="#D7CCC8" />
          <Text style={styles.emptyTitle}>Giỏ hàng của bạn đang trống</Text>
          <Text style={styles.emptySub}>Thưởng thức những món bánh & cà phê hấp dẫn ngay hôm nay!</Text>
          <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/(tabs)/menu')}>
            <Text style={styles.exploreBtnText}>Khám phá Menu ngay</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleConfirmRemoveItem = (item: any) => {
    setItemToDelete(item);
    setDeleteConfirmModalVisible(true);
  };

  const handleDecreaseQuantity = (item: any) => {
    if (item.quantity === 1) {
      handleConfirmRemoveItem(item);
    } else {
      updateQuantity(item.id, -1);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Giỏ Hàng & Đặt Hàng 🛒</Text>
        </View>

        {/* Cart Items List */}
        <Text style={styles.sectionHeader}>Danh sách món ({cart.length})</Text>
        {cart.map((item) => {
          const isCakeOrFood =
            (!item.sugar && !item.ice) ||
            (item.name || '').toLowerCase().includes('bánh') ||
            (item.name || '').toLowerCase().includes('cake') ||
            (item.name || '').toLowerCase().includes('mousse') ||
            (item.name || '').toLowerCase().includes('croissant') ||
            (item.name || '').toLowerCase().includes('bread') ||
            (item.name || '').toLowerCase().includes('cookie') ||
            (item.name || '').toLowerCase().includes('tiramisu');

          const specParts = [];
          if (item.size) specParts.push(`Size ${item.size}`);
          if (!isCakeOrFood) {
            if (item.sugar) specParts.push(`Đường ${item.sugar}`);
            if (item.ice) specParts.push(`Đá ${item.ice}`);
          }

          return (
            <View key={item.id} style={styles.cartItemCard}>
              <Image
                source={{
                  uri: item.image || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600',
                }}
                style={styles.itemImg}
              />
              <View style={styles.itemInfo}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <TouchableOpacity onPress={() => handleConfirmRemoveItem(item)}>
                    <Ionicons name="trash-outline" size={18} color="#E53935" />
                  </TouchableOpacity>
                </View>
                {specParts.length > 0 && (
                  <Text style={styles.itemSpec}>{specParts.join(' • ')}</Text>
                )}
                {item.toppings.length > 0 && (
                  <Text style={styles.itemTopping}>+ {item.toppings.join(', ')}</Text>
                )}
                <View style={styles.itemBottom}>
                  <Text style={styles.itemPrice}>{(item.price * item.quantity).toLocaleString('vi-VN')} đ</Text>
                  <View style={styles.qtyControl}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => handleDecreaseQuantity(item)}>
                      <Ionicons name="remove" size={14} color="#3E2723" />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(item.id, 1)}>
                      <Ionicons name="add" size={14} color="#3E2723" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          );
        })}

        {/* Coupon & Voucher Section */}
        <View style={styles.cardSection}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Ưu đãi & Voucher</Text>
            <TouchableOpacity
              style={styles.dropdownPickerBtn}
              onPress={handleOpenVoucherModal}>
              <Ionicons name="ticket-outline" size={16} color="#D84315" />
              <Text style={styles.dropdownPickerText}>
                Chọn Voucher ({availableCoupons.length})
              </Text>
              <Ionicons name="chevron-down" size={16} color="#D84315" />
            </TouchableOpacity>
          </View>

          {appliedCoupon ? (
            <View style={styles.couponAppliedRow}>
              <Ionicons name="ticket" size={20} color="#D84315" />
              <View style={{ flex: 1 }}>
                <Text style={styles.couponCodeText}>Mã {appliedCoupon.code} đã áp dụng</Text>
                <Text style={styles.couponDiscountDetailText}>
                  {appliedCoupon.discountType === 'percentage'
                    ? `Giảm ${Number.isInteger(appliedCoupon.discountValue) ? appliedCoupon.discountValue : parseFloat(appliedCoupon.discountValue.toFixed(2))}%`
                    : `Giảm -${appliedCoupon.discountValue.toLocaleString('vi-VN')}đ`}
                </Text>
              </View>
              <TouchableOpacity onPress={removeCoupon}>
                <Text style={styles.removeCouponText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponInputRow}>
              <TextInput
                style={styles.couponInput}
                placeholder="Nhập mã hoặc chọn voucher ở trên"
                placeholderTextColor="#A1887F"
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.applyCouponBtn}
                onPress={() => handleApplyCouponCode()}>
                {couponLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.applyCouponText}>Áp dụng</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Delivery Customer Details */}
        <View style={styles.cardSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.cardTitle}>Thông tin giao hàng</Text>
            {user && (
              <TouchableOpacity
                onPress={() => {
                  setShowAddAddressForm(false);
                  setAddressModalVisible(true);
                }}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FBE9E7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                <Ionicons name="location" size={15} color="#D84315" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#D84315' }}>
                  {userAddresses.length > 0 ? 'Đổi địa chỉ' : '+ Thêm địa chỉ'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Saved Address Quick Card */}
          {userAddresses.length > 0 && selectedAddressId && (
            <TouchableOpacity
              onPress={() => {
                setShowAddAddressForm(false);
                setAddressModalVisible(true);
              }}
              style={{
                backgroundColor: '#FFF3E0',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#FFE0B2',
                marginBottom: 12,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="home" size={16} color="#D84315" style={{ marginRight: 6 }} />
                <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#3E2723' }}>
                  {userAddresses.find((a) => a.id === selectedAddressId)?.label || 'Địa chỉ đã chọn'}
                </Text>
                {userAddresses.find((a) => a.id === selectedAddressId)?.isDefault && (
                  <View style={{ backgroundColor: '#D84315', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 }}>
                    <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>Mặc định</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 13, color: '#5D4037' }}>{address}</Text>
            </TouchableOpacity>
          )}

          {/* Auto-assigned Nearest Store Card */}
          {branchErrorMessage ? (
            <View
              style={{
                backgroundColor: '#FFEBEE',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#FFCDD2',
                marginBottom: 12,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="alert-circle" size={18} color="#D32F2F" style={{ marginRight: 6 }} />
                <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#C62828' }}>
                  Thông báo tồn kho chi nhánh
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: '#B71C1C', lineHeight: 16 }}>
                ⚠️ {branchErrorMessage}
              </Text>
            </View>
          ) : assignedBranch ? (
            <View
              style={{
                backgroundColor: '#E8F5E9',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#C8E6C9',
                marginBottom: 12,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="storefront" size={16} color="#2E7D32" style={{ marginRight: 6 }} />
                <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#1B5E20' }}>
                  Cửa hàng xử lý đơn: {assignedBranch.name || assignedBranch.branch?.name || 'Tiệm Bánh & Cà Phê'}
                </Text>
                <View style={{ backgroundColor: '#2E7D32', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 }}>
                  <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>Tự động chọn</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: '#33691E', lineHeight: 16 }}>
                📍 {assignedBranch.address || assignedBranch.branch?.address || 'Chi nhánh phục vụ gần nhất'}
                {assignedBranch.distanceKm ? ` (Cách ${Number(assignedBranch.distanceKm).toFixed(1)} km)` : ''}
              </Text>
            </View>
          ) : fetchingBranch ? (
            <View style={{ backgroundColor: '#F5F5F5', padding: 10, borderRadius: 8, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#D84315" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 12, color: '#666' }}>Đang tự động xác định cửa hàng gần nhất còn đủ hàng...</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Họ và tên người nhận</Text>
            <TextInput
              style={styles.input}
              value={recipientName}
              onChangeText={setRecipientName}
              placeholder="Nhập họ tên người nhận"
              placeholderTextColor="#A1887F"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Số điện thoại liên hệ</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="Nhập số điện thoại người nhận"
              placeholderTextColor="#A1887F"
            />
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.cardSection}>
          <Text style={styles.cardTitle}>Phương thức thanh toán</Text>
          <TouchableOpacity
            style={[styles.payOption, paymentMethod === 'COD' && styles.payOptionActive]}
            onPress={() => setPaymentMethod('COD')}>
            <Ionicons name="cash-outline" size={22} color={paymentMethod === 'COD' ? '#D84315' : '#795548'} />
            <Text style={styles.payText}>Thanh toán tiền mặt khi nhận hàng (COD)</Text>
            {paymentMethod === 'COD' && <Ionicons name="checkmark-circle" size={20} color="#D84315" />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.payOption, paymentMethod === 'VNPAY' && styles.payOptionActive]}
            onPress={() => setPaymentMethod('VNPAY')}>
            <Ionicons name="card-outline" size={22} color={paymentMethod === 'VNPAY' ? '#D84315' : '#795548'} />
            <Text style={styles.payText}>Ví điện tử VNPay / Chuyển khoản QR</Text>
            {paymentMethod === 'VNPAY' && <Ionicons name="checkmark-circle" size={20} color="#D84315" />}
          </TouchableOpacity>
        </View>

        {/* Order Summary */}
        <View style={styles.cardSection}>
          <Text style={styles.cardTitle}>Tóm tắt thanh toán</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tiền hàng ({cart.length} món)</Text>
            <Text style={styles.summaryVal}>{subtotal.toLocaleString('vi-VN')} đ</Text>
          </View>
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giảm giá Voucher</Text>
              <Text style={[styles.summaryVal, { color: '#2E7D32' }]}>
                -{discount.toLocaleString('vi-VN')} đ
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phí giao hàng</Text>
            <Text style={styles.summaryVal}>{shippingFee.toLocaleString('vi-VN')} đ</Text>
          </View>
          {Math.floor(Math.max(0, subtotal - discount) / 1000) > 0 && (
            <View style={[styles.summaryRow, { marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F5F5F5' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="gift-outline" size={16} color="#E65100" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 13, color: '#E65100', fontWeight: '600' }}>Điểm thưởng nhận được</Text>
              </View>
              <View style={{ backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, borderWidth: 1, borderColor: '#FFE0B2' }}>
                <Text style={{ fontSize: 12, color: '#E65100', fontWeight: 'bold' }}>
                  +{Math.floor(Math.max(0, subtotal - discount) / 1000)} điểm
                </Text>
              </View>
            </View>
          )}
          <View style={[styles.summaryRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Tổng thanh toán</Text>
            <Text style={styles.grandTotalVal}>{grandTotal.toLocaleString('vi-VN')} đ</Text>
          </View>
        </View>

        {/* Place Order Button */}
        {(() => {
          const isOrderDisabled = submitting || Boolean(branchErrorMessage) || (!assignedBranch && !fetchingBranch);
          return (
            <TouchableOpacity
              style={[
                styles.placeOrderBtn,
                isOrderDisabled && { backgroundColor: '#CCCCCC', opacity: 0.6, elevation: 0, shadowOpacity: 0 },
              ]}
              onPress={isOrderDisabled ? undefined : handlePlaceOrder}
              disabled={isOrderDisabled}>
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.placeOrderText}>
                    {branchErrorMessage ? 'KHÔNG THỂ ĐẶT HÀNG' : 'XÁC NHẬN ĐẶT HÀNG'}
                  </Text>
                  <Ionicons name={isOrderDisabled ? 'lock-closed-outline' : 'arrow-forward'} size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          );
        })()}
      </ScrollView>

      {/* Voucher Selection Dropdown Modal */}
      <Modal visible={voucherModalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setVoucherModalVisible(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#3E2723" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Chọn Voucher Khuyến Mãi 🎟️</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            {availableCoupons.length === 0 ? (
              <View style={styles.noVouchersBox}>
                <Ionicons name="ticket-outline" size={48} color="#D7CCC8" />
                <Text style={styles.noVouchersText}>Chưa có mã ưu đãi nào sẵn có lúc này.</Text>
              </View>
            ) : (
              availableCoupons.map((voucher: any) => {
                const isValid = isVoucherValidForCart(voucher);
                const rawVal = Number(voucher.discountValue || 0);
                const formattedVal = Number.isInteger(rawVal) ? rawVal : parseFloat(rawVal.toFixed(2));
                const discountStr = voucher.discountType === 'percent' || voucher.discountType === 'percentage'
                  ? `Giảm ${formattedVal}%`
                  : `Giảm ${rawVal.toLocaleString('vi-VN')}đ`;

                const minOrderVal = Number(voucher.minOrderValue || 0);

                let unfulfilledReason = '';
                if (!isValid) {
                  if (minOrderVal > 0 && subtotal < minOrderVal) {
                    const diff = minOrderVal - subtotal;
                    unfulfilledReason = `Cần đơn từ ${minOrderVal.toLocaleString('vi-VN')}đ (còn thiếu ${diff.toLocaleString('vi-VN')}đ)`;
                  } else if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) {
                    unfulfilledReason = 'Mã đã hết hạn sử dụng';
                  } else {
                    unfulfilledReason = 'Chưa đúng sản phẩm / size yêu cầu';
                  }
                }

                return (
                  <View
                    key={voucher.id || voucher.code}
                    style={[
                      styles.voucherCardItem,
                      !isValid && styles.voucherCardDisabled,
                    ]}>
                    <View
                      style={[
                        styles.voucherLeftTag,
                        !isValid && styles.voucherLeftTagDisabled,
                      ]}>
                      <Ionicons name="ticket" size={28} color="#FFFFFF" />
                      <Text style={styles.voucherTagText}>VOUCHER</Text>
                    </View>
                    <View style={styles.voucherRightContent}>
                      <View style={styles.voucherCodeRow}>
                        <Text
                          style={[
                            styles.voucherCodeTextTitle,
                            !isValid && { color: '#757575' },
                          ]}>
                          {voucher.code}
                        </Text>
                        <Text
                          style={[
                            styles.voucherDiscountValue,
                            !isValid && { color: '#9E9E9E' },
                          ]}>
                          {discountStr}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.voucherDescText,
                          !isValid && { color: '#9E9E9E' },
                        ]}
                        numberOfLines={2}>
                        {voucher.description || voucher.name || 'Áp dụng cho đơn hàng đáp ứng điều kiện'}
                      </Text>

                      {!isValid ? (
                        <View style={styles.invalidReasonBadge}>
                          <Ionicons name="alert-circle" size={13} color="#D32F2F" />
                          <Text style={styles.invalidReasonText}>{unfulfilledReason}</Text>
                        </View>
                      ) : minOrderVal > 0 ? (
                        <Text style={styles.voucherMinOrderText}>
                          Đơn tối thiểu: {minOrderVal.toLocaleString('vi-VN')}đ
                        </Text>
                      ) : null}

                      <View style={styles.voucherCardBottom}>
                        <Text style={styles.voucherExpiryText}>
                          {voucher.expiresAt ? `HSD: ${new Date(voucher.expiresAt).toLocaleDateString('vi-VN')}` : 'HSD: Không giới hạn'}
                        </Text>
                        <TouchableOpacity
                          style={[
                            styles.useVoucherBtn,
                            !isValid && styles.useVoucherBtnDisabled,
                          ]}
                          disabled={!isValid}
                          onPress={() => handleSelectVoucherObj(voucher)}>
                          <Text
                            style={[
                              styles.useVoucherBtnText,
                              !isValid && { color: '#757575' },
                            ]}>
                            {isValid ? 'Áp dụng' : 'Chưa đủ ĐK'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Login Prompt Confirmation Modal */}
      <Modal visible={loginConfirmModalVisible} animationType="fade" transparent={true}>
        <View style={styles.loginModalBackdrop}>
          <View style={styles.loginModalBox}>
            <View style={styles.loginIconBg}>
              <Ionicons name="key-outline" size={32} color="#D84315" />
            </View>
            <Text style={styles.loginModalTitle}>Xác nhận đăng nhập 🔑</Text>
            <Text style={styles.loginModalSub}>
              Bạn có muốn đăng nhập tài khoản ngay bây giờ để áp dụng voucher khuyến mãi cho đơn hàng này không?
            </Text>
            <View style={styles.loginModalActions}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setLoginConfirmModalVisible(false)}>
                <Text style={styles.cancelModalText}>Để sau</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmModalBtn}
                onPress={() => {
                  setLoginConfirmModalVisible(false);
                  setVoucherModalVisible(false);
                  router.push('/(tabs)/profile');
                }}>
                <Text style={styles.confirmModalText}>Đăng nhập ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Address Selection & Addition Modal */}
      <Modal visible={addressModalVisible} animationType="slide" transparent={true}>
        <View style={styles.loginModalBackdrop}>
          <View style={[styles.loginModalBox, { maxHeight: '85%', padding: 20 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#3E2723' }}>Sổ địa chỉ của bạn 📍</Text>
              <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
                <Ionicons name="close" size={24} color="#795548" />
              </TouchableOpacity>
            </View>

            {!showAddAddressForm ? (
              <ScrollView style={{ width: '100%', maxHeight: 360 }}>
                {userAddresses.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <Ionicons name="location-outline" size={40} color="#BCAAA4" />
                    <Text style={{ color: '#8D6E63', marginVertical: 8, fontSize: 13 }}>Bạn chưa lưu địa chỉ nào trong sổ địa chỉ.</Text>
                  </View>
                ) : (
                  userAddresses.map((addr: any) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <View
                        key={addr.id}
                        style={{
                          backgroundColor: isSelected ? '#FFF3E0' : '#FAFAFA',
                          borderColor: isSelected ? '#D84315' : '#E0E0E0',
                          borderWidth: 1.5,
                          borderRadius: 12,
                          padding: 12,
                          marginBottom: 10,
                        }}>
                        <TouchableOpacity
                          onPress={() => handleSelectAddress(addr)}
                          style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={{ fontWeight: 'bold', color: '#3E2723', fontSize: 14 }}>{addr.label || 'Địa chỉ'}</Text>
                              {addr.isDefault && (
                                <View style={{ backgroundColor: '#D84315', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6 }}>
                                  <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>Mặc định</Text>
                                </View>
                              )}
                            </View>
                            {isSelected && <Ionicons name="checkmark-circle" size={20} color="#D84315" />}
                          </View>
                          <Text style={{ fontSize: 13, color: '#4E342E', fontWeight: '500' }}>{addr.recipientName} ({addr.phone})</Text>
                          <Text style={{ fontSize: 12, color: '#795548', marginTop: 2 }}>{addr.address}</Text>
                        </TouchableOpacity>

                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#EEEEEE' }}>
                          <TouchableOpacity
                            onPress={() => handleEditCartAddressClick(addr)}
                            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#FFF3E0', borderRadius: 6, borderWidth: 1, borderColor: '#FFE0B2' }}>
                            <Ionicons name="pencil" size={14} color="#D84315" style={{ marginRight: 4 }} />
                            <Text style={{ fontSize: 12, color: '#D84315', fontWeight: 'bold' }}>Sửa</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteCartAddress(addr.id)}
                            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#FFEBEE', borderRadius: 6, borderWidth: 1, borderColor: '#FFCDD2' }}>
                            <Ionicons name="trash-outline" size={14} color="#E53935" style={{ marginRight: 4 }} />
                            <Text style={{ fontSize: 12, color: '#E53935', fontWeight: 'bold' }}>Xóa</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
                <TouchableOpacity
                  onPress={() => {
                    setEditingAddressId(null);
                    setShowAddAddressForm(true);
                    setNewAddress('');
                    setSelectedCartProvince('');
                    setSelectedCartDistrict('');
                    setSelectedCartWard('');
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#F5EBE6',
                    paddingVertical: 12,
                    borderRadius: 12,
                    marginTop: 8,
                  }}>
                  <Ionicons name="add-circle" size={20} color="#D84315" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#D84315', fontWeight: 'bold', fontSize: 14 }}>➕ Thêm địa chỉ giao hàng mới</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <ScrollView style={{ width: '100%', maxHeight: 400 }}>
                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#D84315', marginBottom: 12 }}>
                  {editingAddressId ? 'Chỉnh sửa địa chỉ giao hàng' : 'Thêm địa chỉ giao hàng mới'}
                </Text>
                <View style={{ marginBottom: 10 }}>
                  <Text style={styles.inputLabel}>Nhãn địa chỉ (VD: Nhà riêng, Công ty)</Text>
                  <TextInput
                    style={styles.input}
                    value={newLabel}
                    onChangeText={setNewLabel}
                    placeholder="Nhà riêng / Cơ quan"
                    placeholderTextColor="#A1887F"
                  />
                </View>

                {/* 1. Chọn Tỉnh / Thành phố Dropdown */}
                <View style={{ marginBottom: 10 }}>
                  <Text style={styles.inputLabel}>1. Thành phố / Tỉnh *</Text>
                  {Platform.OS === 'web' ? (
                    <select
                      style={{
                        ...(styles.input as object),
                        cursor: 'pointer',
                        borderColor: selectedCartProvince ? '#D84315' : '#E0E0E0',
                        backgroundColor: '#FAFAFA',
                      }}
                      value={selectedCartProvince}
                      onChange={(e) => {
                        const prov = e.target.value;
                        setSelectedCartProvince(prov);
                        setSelectedCartDistrict('');
                        setSelectedCartWard('');
                      }}>
                      <option value="" disabled>
                        -- Chọn Thành phố / Tỉnh --
                      </option>
                      {VIETNAM_PROVINCES.map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                      {VIETNAM_PROVINCES.map((prov) => (
                        <TouchableOpacity
                          key={prov}
                          style={[styles.chipBtn, selectedCartProvince === prov && styles.chipBtnActive]}
                          onPress={() => {
                            setSelectedCartProvince(prov);
                            setSelectedCartDistrict('');
                            setSelectedCartWard('');
                          }}>
                          <Text style={[styles.chipText, selectedCartProvince === prov && styles.chipTextActive]}>
                            {prov}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* 2. Chọn Quận / Huyện Dropdown */}
                <View style={{ marginBottom: 10 }}>
                  <Text style={[styles.inputLabel, !selectedCartProvince && { opacity: 0.5 }]}>
                    2. Quận / Huyện {!selectedCartProvince ? '(Vui lòng chọn Tỉnh trước)' : '*'}
                  </Text>
                  {Platform.OS === 'web' ? (
                    <select
                      disabled={!selectedCartProvince}
                      style={{
                        ...(styles.input as object),
                        cursor: !selectedCartProvince ? 'not-allowed' : 'pointer',
                        opacity: !selectedCartProvince ? 0.6 : 1,
                        backgroundColor: !selectedCartProvince ? '#F5F5F5' : '#FAFAFA',
                        borderColor: selectedCartDistrict ? '#D84315' : '#E0E0E0',
                      }}
                      value={selectedCartDistrict}
                      onChange={(e) => {
                        const dist = e.target.value;
                        setSelectedCartDistrict(dist);
                        setSelectedCartWard('');
                      }}>
                      <option value="" disabled>
                        {!selectedCartProvince ? '-- Vui lòng chọn Thành phố / Tỉnh trước --' : '-- Chọn Quận / Huyện --'}
                      </option>
                      {(VIETNAM_DISTRICTS[selectedCartProvince] || []).map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                      {(VIETNAM_DISTRICTS[selectedCartProvince] || []).map((dist) => (
                        <TouchableOpacity
                          key={dist}
                          disabled={!selectedCartProvince}
                          style={[styles.chipBtn, selectedCartDistrict === dist && styles.chipBtnActive]}
                          onPress={() => {
                            setSelectedCartDistrict(dist);
                            setSelectedCartWard('');
                          }}>
                          <Text style={[styles.chipText, selectedCartDistrict === dist && styles.chipTextActive]}>
                            {dist}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* 3. Chọn Phường / Xã Dropdown */}
                <View style={{ marginBottom: 10 }}>
                  <Text style={[styles.inputLabel, !selectedCartDistrict && { opacity: 0.5 }]}>
                    3. Phường / Xã / Thị trấn {!selectedCartDistrict ? '(Vui lòng chọn Quận/Huyện trước)' : '*'}
                  </Text>
                  {Platform.OS === 'web' ? (
                    <select
                      disabled={!selectedCartDistrict}
                      style={{
                        ...(styles.input as object),
                        cursor: !selectedCartDistrict ? 'not-allowed' : 'pointer',
                        opacity: !selectedCartDistrict ? 0.6 : 1,
                        backgroundColor: !selectedCartDistrict ? '#F5F5F5' : '#FAFAFA',
                        borderColor: selectedCartWard ? '#D84315' : '#E0E0E0',
                      }}
                      value={selectedCartWard}
                      onChange={(e) => setSelectedCartWard(e.target.value)}>
                      <option value="" disabled>
                        {!selectedCartDistrict ? '-- Vui lòng chọn Quận / Huyện trước --' : '-- Chọn Phường / Xã / Thị trấn --'}
                      </option>
                      {(VIETNAM_WARDS[selectedCartDistrict] || []).map((ward) => (
                        <option key={ward} value={ward}>
                          {ward}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                      {(VIETNAM_WARDS[selectedCartDistrict] || []).map((ward) => (
                        <TouchableOpacity
                          key={ward}
                          disabled={!selectedCartDistrict}
                          style={[styles.chipBtn, selectedCartWard === ward && styles.chipBtnActive]}
                          onPress={() => setSelectedCartWard(ward)}>
                          <Text style={[styles.chipText, selectedCartWard === ward && styles.chipTextActive]}>
                            {ward}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* 4. Nhập Địa chỉ cụ thể */}
                <View style={{ marginBottom: 10 }}>
                  <Text style={[styles.inputLabel, !selectedCartWard && { opacity: 0.5 }]}>
                    4. Số nhà / Tên đường chi tiết {!selectedCartWard ? '(Vui lòng chọn Phường/Xã trước)' : '*'}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      !selectedCartWard && { backgroundColor: '#F5EBE6', opacity: 0.6 },
                    ]}
                    editable={Boolean(selectedCartWard)}
                    value={newAddress}
                    onChangeText={setNewAddress}
                    placeholder={!selectedCartWard ? 'Vui lòng chọn Phường/Xã trước...' : 'Ví dụ: 16 Hào Nam'}
                    placeholderTextColor="#A1887F"
                  />
                </View>

                {/* Xem trước Địa chỉ Lọc Trùng Chuẩn */}
                {Boolean(selectedCartWard || selectedCartDistrict || selectedCartProvince || newAddress) && (
                  <View style={{ backgroundColor: '#FFF3E0', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#FFE0B2', marginBottom: 12 }}>
                    <Text style={{ fontSize: 10, color: '#D84315', fontWeight: 'bold', marginBottom: 2 }}>ĐỊA CHỈ XEM TRƯỚC:</Text>
                    <Text style={{ fontSize: 12, color: '#3E2723', fontWeight: '600' }}>
                      {[
                        cleanStreetDetail(newAddress, selectedCartWard, selectedCartDistrict, selectedCartProvince),
                        selectedCartWard,
                        selectedCartDistrict,
                        selectedCartProvince,
                      ].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                )}

                <View style={{ marginBottom: 10 }}>
                  <Text style={styles.inputLabel}>Tên người nhận</Text>
                  <TextInput
                    style={styles.input}
                    value={newRecipient}
                    onChangeText={setNewRecipient}
                    placeholder={user?.fullName || 'Họ và tên người nhận'}
                    placeholderTextColor="#A1887F"
                  />
                </View>
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.inputLabel}>Số điện thoại liên hệ</Text>
                  <TextInput
                    style={styles.input}
                    value={newPhone}
                    onChangeText={setNewPhone}
                    keyboardType="phone-pad"
                    placeholder={user?.phone || 'Số điện thoại'}
                    placeholderTextColor="#A1887F"
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={styles.cancelModalBtn}
                    onPress={() => {
                      setShowAddAddressForm(false);
                      setEditingAddressId(null);
                    }}>
                    <Text style={styles.cancelModalText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmModalBtn}
                    onPress={handleSaveNewAddress}
                    disabled={savingAddress}>
                    {savingAddress ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.confirmModalText}>
                        {editingAddressId ? 'Lưu cập nhật' : 'Lưu & Chọn'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Custom Confirmation Modal for Deleting Item */}
      <Modal
        visible={deleteConfirmModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDeleteConfirmModalVisible(false)}>
        <View style={styles.loginModalBackdrop}>
          <View style={styles.confirmDeleteCard}>
            <View style={styles.confirmDeleteIconCircle}>
              <Ionicons name="trash-outline" size={32} color="#E53935" />
            </View>
            <Text style={styles.confirmDeleteTitle}>Xác nhận bỏ sản phẩm</Text>
            <Text style={styles.confirmDeleteMessage}>
              Bạn có chắc chắn muốn bỏ sản phẩm{' '}
              <Text style={{ fontWeight: 'bold', color: '#D84315' }}>"{itemToDelete?.name}"</Text> ra khỏi giỏ hàng không?
            </Text>
            <View style={styles.confirmDeleteBtnRow}>
              <TouchableOpacity
                style={styles.cancelDeleteBtn}
                onPress={() => {
                  setDeleteConfirmModalVisible(false);
                  setItemToDelete(null);
                }}>
                <Text style={styles.cancelDeleteBtnText}>Giữ lại món</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitDeleteBtn}
                onPress={() => {
                  if (itemToDelete) {
                    removeFromCart(itemToDelete.id);
                  }
                  setDeleteConfirmModalVisible(false);
                  setItemToDelete(null);
                }}>
                <Ionicons name="trash" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.submitDeleteBtnText}>Xóa món</Text>
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
    paddingTop: 12,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4E342E',
    marginBottom: 10,
  },
  cartItemCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#3E2723',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemImg: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3E2723',
    flex: 1,
    marginRight: 8,
  },
  itemSpec: {
    fontSize: 12,
    color: '#795548',
    marginTop: 2,
  },
  itemTopping: {
    fontSize: 11,
    color: '#8D6E63',
    marginTop: 2,
    fontStyle: 'italic',
  },
  itemBottom: {
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
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5EBE6',
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3E2723',
    paddingHorizontal: 10,
  },
  cardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#3E2723',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3E2723',
    marginBottom: 8,
  },
  dropdownPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  dropdownPickerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#D84315',
    marginHorizontal: 4,
  },
  couponAppliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBE9E7',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCCBC',
  },
  couponCodeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D84315',
  },
  couponDiscountDetailText: {
    fontSize: 12,
    color: '#BF360C',
    marginTop: 2,
  },
  removeCouponText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#E53935',
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5D4037',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#3E2723',
  },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  payOptionActive: {
    backgroundColor: '#FBE9E7',
    borderColor: '#D84315',
  },
  payText: {
    flex: 1,
    fontSize: 13,
    color: '#3E2723',
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6D4C41',
  },
  summaryVal: {
    fontSize: 13,
    color: '#3E2723',
    fontWeight: '600',
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
  placeOrderBtn: {
    backgroundColor: '#D84315',
    borderRadius: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    elevation: 4,
    ...Platform.select({
      web: { boxShadow: '0px 3px 6px rgba(0,0,0,0.15)' },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
    }),
  },
  disabledBtn: {
    opacity: 0.6,
  },
  placeOrderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
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
  exploreBtn: {
    backgroundColor: '#D84315',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  exploreBtnText: {
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
  noVouchersBox: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  noVouchersText: {
    fontSize: 14,
    color: '#8D6E63',
    marginTop: 10,
  },
  voucherCardItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFE0B2',
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
  voucherLeftTag: {
    width: 80,
    backgroundColor: '#D84315',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  voucherTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4,
    letterSpacing: 1,
  },
  voucherRightContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  voucherCodeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voucherCodeTextTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  voucherDiscountValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#D84315',
  },
  voucherDescText: {
    fontSize: 12,
    color: '#6D4C41',
    marginTop: 4,
  },
  voucherMinOrderText: {
    fontSize: 11,
    color: '#8D6E63',
    marginTop: 2,
  },
  voucherCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5EBE6',
  },
  voucherExpiryText: {
    fontSize: 11,
    color: '#A1887F',
  },
  useVoucherBtn: {
    backgroundColor: '#D84315',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  useVoucherBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  voucherCardDisabled: {
    opacity: 0.65,
    backgroundColor: '#FAF8F5',
    borderColor: '#E0E0E0',
  },
  voucherLeftTagDisabled: {
    backgroundColor: '#9E9E9E',
  },
  invalidReasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  invalidReasonText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#D32F2F',
  },
  useVoucherBtnDisabled: {
    backgroundColor: '#E0E0E0',
  },
  loginModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loginModalBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    ...Platform.select({
      web: { boxShadow: '0px 10px 25px rgba(0,0,0,0.2)' },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
    }),
  },
  loginIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FBE9E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3E2723',
    textAlign: 'center',
    marginBottom: 8,
  },
  loginModalSub: {
    fontSize: 14,
    color: '#6D4C41',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  loginModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F5EBE6',
    alignItems: 'center',
  },
  cancelModalText: {
    color: '#5D4037',
    fontWeight: 'bold',
    fontSize: 14,
  },
  confirmModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#D84315',
    alignItems: 'center',
  },
  confirmModalText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  applyCouponBtn: {
    backgroundColor: '#3E2723',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 10,
  },
  applyCouponText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  confirmDeleteCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    ...Platform.select({
      web: { boxShadow: '0px 10px 25px rgba(0,0,0,0.2)' },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
    }),
  },
  confirmDeleteIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmDeleteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3E2723',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmDeleteMessage: {
    fontSize: 14,
    color: '#5D4037',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  confirmDeleteBtnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelDeleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelDeleteBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#616161',
  },
  submitDeleteBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#E53935',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    ...Platform.select({
      web: { boxShadow: '0px 2px 4px rgba(229,57,53,0.3)' },
      default: {
        shadowColor: '#E53935',
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
    }),
  },
  submitDeleteBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipBtnActive: {
    backgroundColor: '#FBE9E7',
    borderColor: '#D84315',
  },
  chipText: {
    fontSize: 12,
    color: '#5D4037',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#D84315',
    fontWeight: 'bold',
  },
});
