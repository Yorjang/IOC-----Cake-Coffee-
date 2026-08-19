import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
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

export default function ProfileScreen() {
  const router = useRouter();
  const { user, login, loginWithGoogle, register, logout, updateUser } = useAuth();

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  // Dynamic user data from DB
  const [userPoints, setUserPoints] = useState<number>(user?.points || 0);
  const [addresses, setAddresses] = useState<any[]>([]);

  // Modals state
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [regSuccessModalVisible, setRegSuccessModalVisible] = useState(false);
  const [unverifiedModalVisible, setUnverifiedModalVisible] = useState(false);
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [sendingForgot, setSendingForgot] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Structured address state
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [newAddressStreet, setNewAddressStreet] = useState('');
  const [newAddrLabel, setNewAddrLabel] = useState('Nhà riêng');
  const [savingAddress, setSavingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);

  // Edit profile state
  const [editFullName, setEditFullName] = useState(user?.fullName || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Change password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        setRegSuccessModalVisible(false);
        setUnverifiedModalVisible(false);
        setForgotModalVisible(false);
        fetchUserPoints();
        fetchUserAddresses();
        setEditFullName(user.fullName || '');
        setEditPhone(user.phone || '');
      }
    }, [user])
  );

  const fetchUserPoints = async () => {
    try {
      const res = await apiFetch('/points/my-points');
      if (res && typeof res.points === 'number') {
        setUserPoints(res.points);
      } else if (res && typeof res.data?.points === 'number') {
        setUserPoints(res.data.points);
      }
    } catch (e) {
      setUserPoints(user?.points || 0);
    }
  };

  const fetchUserAddresses = async () => {
    try {
      const res = await apiFetch('/users/addresses');
      if (Array.isArray(res)) {
        setAddresses(res);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '803255193380-vveh9regmvuijmji8947l0hsabpokna8.apps.googleusercontent.com';
      const initGsi = () => {
        if ((window as any).google?.accounts?.id && !(window as any).gsiInitialized) {
          try {
            (window as any).google.accounts.id.initialize({
              client_id: googleClientId,
              use_fedcm_for_prompt: true,
              callback: async (response: any) => {
                if (response?.credential) {
                  try {
                    setLoading(true);
                    await loginWithGoogle(response.credential);
                    setRegisteredEmail('Tài khoản Google Gmail');
                    setRegSuccessModalVisible(true);
                  } catch (err: any) {
                    Alert.alert('Lỗi Google Auth', err.message || 'Đăng nhập bằng Google thất bại.');
                  } finally {
                    setLoading(false);
                  }
                }
              },
            });
            (window as any).gsiInitialized = true;
          } catch (e) {}
        }

        const renderGoogleBtn = () => {
          const btnContainer = document.getElementById('google-signin-btn-expo');
          if (btnContainer && (window as any).google?.accounts?.id) {
            try {
              (window as any).google.accounts.id.renderButton(btnContainer, {
                theme: 'outline',
                size: 'large',
                width: 320,
                shape: 'pill',
                text: 'signin_with',
              });
            } catch (e) {}
          }
        };

        renderGoogleBtn();
        setTimeout(renderGoogleBtn, 300);
      };

      const existingScript = document.getElementById('google-gsi-client');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'google-gsi-client';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initGsi;
        document.body.appendChild(script);
      } else {
        initGsi();
      }
    }
  }, []);

  const handleGoogleLogin = async () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const google = (window as any).google;
      if (google?.accounts?.id) {
        try {
          // Reset any pending credential request to avoid FedCM concurrency conflict
          google.accounts.id.cancel();
        } catch (e) {}

        setTimeout(() => {
          try {
            google.accounts.id.prompt((notification: any) => {
              const notDisplayedReason = typeof notification.getNotDisplayedReason === 'function'
                ? notification.getNotDisplayedReason()
                : null;
              const skippedReason = typeof notification.getSkippedReason === 'function'
                ? notification.getSkippedReason()
                : null;

              if (notDisplayedReason === 'origin_not_allowed' || skippedReason === 'origin_not_allowed') {
                Alert.alert(
                  'Lỗi Tên Miền Google Auth',
                  'Tên miền http://localhost:8081 chưa được lưu trong Google Cloud Console hoặc đang chờ Google đồng bộ (cần 2-5 phút sau khi bấm Save).'
                );
              } else if (notDisplayedReason || skippedReason) {
                Alert.alert('Thông báo Đăng nhập Google', 'Hệ thống đã kích hoạt đăng nhập Google. Vui lòng chọn tài khoản trong cửa sổ Google.');
              }
            });
          } catch (err) {
            console.warn('Google prompt error:', err);
          }
        }, 100);
        return;
      }
    }
    Alert.alert(
      'Đăng nhập Google',
      'Đang kết nối dịch vụ xác thực Google...'
    );
  };

  const handleForgotPasswordSubmit = async () => {
    if (!forgotEmail) {
      setAuthErrorMessage('Vui lòng nhập email đăng ký tài khoản.');
      setUnverifiedModalVisible(true);
      return;
    }

    setSendingForgot(true);
    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail }),
      });
      setForgotModalVisible(false);
      setAuthErrorMessage('Nếu địa chỉ email tồn tại trên hệ thống, liên kết đặt lại mật khẩu đã được gửi tới Gmail của bạn. Vui lòng kiểm tra hộp thư.');
      setUnverifiedModalVisible(true);
    } catch (err: any) {
      setAuthErrorMessage(err?.message || 'Không thể gửi yêu cầu đặt lại mật khẩu.');
      setUnverifiedModalVisible(true);
    } finally {
      setSendingForgot(false);
    }
  };

  const handleAuthSubmit = async () => {
    if (!email || !password) {
      setAuthErrorMessage('Vui lòng nhập email và mật khẩu.');
      setUnverifiedModalVisible(true);
      return;
    }

    setLoading(true);
    try {
      if (isLoginTab) {
        await login(email, password);
      } else {
        if (!fullName) {
          setAuthErrorMessage('Vui lòng nhập họ và tên.');
          setUnverifiedModalVisible(true);
          setLoading(false);
          return;
        }
        await register(fullName, email, password, phone);
        setRegisteredEmail(email);
        setRegSuccessModalVisible(true);
      }
    } catch (error: any) {
      setAuthErrorMessage(error.message || 'Đăng nhập không thành công.');
      setUnverifiedModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (avatarUrlToSave?: string) => {
    setUpdatingProfile(true);
    const targetAvatar = avatarUrlToSave !== undefined ? avatarUrlToSave : user?.avatar;
    try {
      await apiFetch('/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: editFullName,
          phone: editPhone,
          avatar: targetAvatar,
        }),
      });

      await updateUser({
        fullName: editFullName,
        phone: editPhone,
        avatar: targetAvatar,
      });

      Alert.alert('Thành công', 'Đã cập nhật thông tin tài khoản thành công!');
      setAccountModalVisible(false);
      setAvatarModalVisible(false);
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Không thể cập nhật thông tin.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword) {
      Alert.alert('Thiếu thông tin 🔒', 'Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Mật khẩu quá ngắn 🔒', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Không trùng khớp 🔒', 'Mật khẩu mới và xác nhận mật khẩu không trùng nhau.');
      return;
    }

    setChangingPassword(true);
    try {
      await apiFetch('/users/change-password', {
        method: 'PATCH',
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      Alert.alert('Thành công 🎉', 'Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (e: any) {
      const msg = e.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.';
      Alert.alert('Đổi mật khẩu thất bại', msg);
    } finally {
      setChangingPassword(false);
    }
  };

  const pickImageFromLibrary = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Quyền truy cập 📷', 'Cần cho phép ứng dụng truy cập thư viện ảnh để đổi Avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const imageUri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;

        await handleUpdateProfile(imageUri);
      }
    } catch (error: any) {
      Alert.alert('Lỗi chọn ảnh', 'Không thể chọn ảnh từ thiết bị: ' + error.message);
    }
  };

  const handleEditAddressClick = (addr: any) => {
    setEditingAddressId(addr.id);
    setShowAddAddressForm(true);
    setNewAddrLabel(addr.label || 'Nhà riêng');

    if (addr.city && VIETNAM_PROVINCES.includes(addr.city)) {
      setSelectedProvince(addr.city);
    } else {
      setSelectedProvince('TP. Hà Nội');
    }

    if (addr.district) {
      setSelectedDistrict(addr.district);
    } else {
      setSelectedDistrict('');
    }

    if (addr.ward) {
      setSelectedWard(addr.ward);
    } else {
      setSelectedWard('');
    }

    const streetText = addr.street || addr.address || '';
    const cleanStreet = cleanStreetDetail(streetText, addr.ward, addr.district, addr.city);
    setNewAddressStreet(cleanStreet);
  };

  const handleDeleteAddress = (addrId: string) => {
    const doDelete = async () => {
      try {
        await apiFetch(`/users/addresses/${addrId}`, {
          method: 'DELETE',
        });
        fetchUserAddresses();
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

  const handleAddAddress = async () => {
    if (!selectedProvince) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn Thành phố / Tỉnh.');
      return;
    }
    if (!selectedDistrict) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn Quận / Huyện.');
      return;
    }
    if (!selectedWard) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn Phường / Xã / Thị trấn.');
      return;
    }
    if (!newAddressStreet.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số nhà và tên đường chi tiết.');
      return;
    }

    const cleanedStreet = cleanStreetDetail(newAddressStreet, selectedWard, selectedDistrict, selectedProvince);
    const fullLockedAddress = `${cleanedStreet}, ${selectedWard}, ${selectedDistrict}, ${selectedProvince}`;

    let lat = 20.9723;
    let lng = 105.7770;
    if (selectedProvince.includes('Hồ Chí Minh')) {
      lat = 10.7769;
      lng = 106.7009;
    } else if (selectedProvince.includes('Đà Nẵng')) {
      lat = 16.0544;
      lng = 108.2022;
    } else if (selectedProvince.includes('Ninh Bình')) {
      lat = 20.2506;
      lng = 105.9744;
    }

    setSavingAddress(true);
    try {
      const payload = {
        address: fullLockedAddress,
        street: cleanedStreet,
        ward: selectedWard,
        district: selectedDistrict,
        city: selectedProvince,
        label: newAddrLabel,
        latitude: lat,
        longitude: lng,
        isDefault: addresses.length === 0,
      };

      if (editingAddressId) {
        await apiFetch(`/users/addresses/${editingAddressId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        Alert.alert('Thành công 🎉', 'Đã cập nhật địa chỉ giao hàng!');
      } else {
        await apiFetch('/users/addresses', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        Alert.alert('Thành công 🎉', 'Đã lưu địa chỉ giao hàng mới!');
      }

      setEditingAddressId(null);
      setShowAddAddressForm(false);
      setNewAddressStreet('');
      setSelectedProvince('');
      setSelectedDistrict('');
      setSelectedWard('');
      fetchUserAddresses();
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Không thể lưu địa chỉ.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutModalVisible(false);
    try {
      (window as any).gsiInitialized = false;
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.disableAutoSelect();
      }
    } catch (e) {}
    await logout();
  };

  const avatarUrl = user?.avatar;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {user ? (
          // Logged In View
          <View>
            <View style={styles.profileHeader}>
              <TouchableOpacity
                style={styles.avatarTouchable}
                onPress={() => setAvatarModalVisible(true)}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarLetter}>
                      {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                    </Text>
                  </View>
                )}
                <View style={styles.cameraIconBadge}>
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <Text style={styles.userName}>{user.fullName || 'Khách hàng Sweet Bean'}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>

            {/* Loyalty Points Card from DB */}
            <TouchableOpacity
              style={styles.pointsCard}
              onPress={() => router.push('/points')}>
              <View style={styles.pointsHeader}>
                <Ionicons name="sparkles" size={20} color="#FFB300" />
                <Text style={styles.pointsTitle}>Sweet Bean Rewards</Text>
                <Ionicons name="chevron-forward" size={18} color="#FFB300" style={{ marginLeft: 'auto' }} />
              </View>
              <Text style={styles.pointsVal}>{userPoints.toLocaleString('vi-VN')} điểm</Text>
              <Text style={styles.pointsSub}>Tích điểm tự động khi hoàn thành đơn hàng! (Xem chi tiết ➔)</Text>
            </TouchableOpacity>

            {/* Dynamic Menu Options */}
            <View style={styles.menuGroup}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setAccountModalVisible(true)}>
                <Ionicons name="person-outline" size={20} color="#5D4037" />
                <Text style={styles.menuItemText}>Thông tin tài khoản</Text>
                <Ionicons name="chevron-forward" size={18} color="#BDBDBD" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setAvatarModalVisible(true)}>
                <Ionicons name="image-outline" size={20} color="#5D4037" />
                <Text style={styles.menuItemText}>Đổi ảnh đại diện Avatar</Text>
                <Ionicons name="chevron-forward" size={18} color="#BDBDBD" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => setAddressModalVisible(true)}>
                <Ionicons name="location-outline" size={20} color="#5D4037" />
                <Text style={styles.menuItemText}>Sổ địa chỉ giao hàng ({addresses.length})</Text>
                <Ionicons name="chevron-forward" size={18} color="#BDBDBD" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => Alert.alert('Hỗ trợ khách hàng', 'Hotline miễn phí: 1900 6868\nEmail: support@sweetbean.vn\nGiờ làm việc: 7:00 - 22:30 hằng ngày')}>
                <Ionicons name="help-circle-outline" size={20} color="#5D4037" />
                <Text style={styles.menuItemText}>Hỗ trợ & Hotline 1900 6868</Text>
                <Ionicons name="chevron-forward" size={18} color="#BDBDBD" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#E53935" />
              <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // Logged Out Auth View
          <View style={styles.authContainer}>
            <View style={styles.brandHeader}>
              <Ionicons name="cafe" size={48} color="#D84315" />
              <Text style={styles.authBrandTitle}>Sweet Bean Coffee & Cake</Text>
              <Text style={styles.authBrandSub}>Đăng nhập để nhận tích điểm & voucher ưu đãi</Text>
            </View>

            {/* Auth Tabs */}
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tabBtn, isLoginTab && styles.tabBtnActive]}
                onPress={() => setIsLoginTab(true)}>
                <Text style={[styles.tabText, isLoginTab && styles.tabTextActive]}>Đăng Nhập</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, !isLoginTab && styles.tabBtnActive]}
                onPress={() => setIsLoginTab(false)}>
                <Text style={[styles.tabText, !isLoginTab && styles.tabTextActive]}>Đăng Ký</Text>
              </TouchableOpacity>
            </View>

            {/* Auth Form Inputs */}
            {!isLoginTab && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Họ và tên</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập họ và tên"
                  placeholderTextColor="#A1887F"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                placeholderTextColor="#A1887F"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {!isLoginTab && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Số điện thoại</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0901234567"
                  placeholderTextColor="#A1887F"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mật khẩu</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#A1887F"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {isLoginTab && (
              <TouchableOpacity
                style={{ alignSelf: 'flex-end', marginTop: -8, marginBottom: 16 }}
                onPress={() => {
                  setForgotEmail(email);
                  setForgotModalVisible(true);
                }}>
                <Text style={{ color: '#D84315', fontSize: 13, fontWeight: '600' }}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={handleAuthSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isLoginTab ? 'ĐĂNG NHẬP' : 'TẠO TÀI KHOẢN'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Hoặc</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign In Button */}
            {Platform.OS === 'web' ? (
              <View style={{ alignItems: 'center', marginVertical: 10, width: '100%', justifyContent: 'center' }}>
                <div id="google-signin-btn-expo" style={{ width: '100%', display: 'flex', justifyContent: 'center' }} />
              </View>
            ) : (
              <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin} disabled={loading}>
                <Ionicons name="logo-google" size={20} color="#EA4335" />
                <Text style={styles.googleBtnText}>Đăng nhập bằng Google Gmail</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Logout Confirmation Custom Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmIconBadge}>
              <Ionicons name="log-out-outline" size={32} color="#E53935" />
            </View>
            <Text style={styles.confirmTitle}>Đăng xuất tài khoản</Text>
            <Text style={styles.confirmSubtitle}>
              Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng Sweet Bean Coffee & Cake?
            </Text>
            <View style={styles.confirmActionsRow}>
              <TouchableOpacity
                style={styles.cancelActionBtn}
                onPress={() => setLogoutModalVisible(false)}>
                <Text style={styles.cancelActionText}>Hủy bỏ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutActionBtn}
                onPress={confirmLogout}>
                <Text style={styles.logoutActionText}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Registration Success Email Notification Custom Modal */}
      <Modal
        visible={regSuccessModalVisible && !user}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRegSuccessModalVisible(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <View style={styles.mailIconBadge}>
              <Ionicons name="mail-unread-outline" size={36} color="#D84315" />
            </View>
            <Text style={styles.confirmTitle}>Đăng Ký Thành Công</Text>
            <Text style={styles.confirmSubtitle}>
              Thông báo xác nhận đăng ký tài khoản đã được gửi tới địa chỉ Gmail:
            </Text>

            <View style={styles.emailHighlightBox}>
              <Ionicons name="logo-google" size={18} color="#EA4335" />
              <Text style={styles.emailHighlightText}>{registeredEmail || 'Gmail của bạn'}</Text>
            </View>

            <Text style={styles.confirmMailHint}>
              Vui lòng mở ứng dụng Gmail hoặc kiểm tra hộp thư (bao gồm cả mục Thư rác / Spam) để hoàn tất xác thực tài khoản.
            </Text>

            <TouchableOpacity
              style={styles.closeRegModalBtn}
              onPress={() => setRegSuccessModalVisible(false)}>
              <Text style={styles.closeRegModalBtnText}>Đã Hiểu & Kiểm Tra Gmail</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Unverified Email / Auth Error Custom UI Modal */}
      <Modal
        visible={unverifiedModalVisible && !user}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setUnverifiedModalVisible(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <View style={styles.mailIconBadge}>
              <Ionicons name="alert-circle-outline" size={36} color="#D84315" />
            </View>
            <Text style={styles.confirmTitle}>Thông Báo Tài Khoản</Text>
            <Text style={styles.confirmSubtitle}>
              {authErrorMessage || 'Tài khoản chưa được kích hoạt. Vui lòng mở hộp thư Gmail để bấm xác nhận tài khoản trước khi đăng nhập.'}
            </Text>

            {email ? (
              <View style={styles.emailHighlightBox}>
                <Ionicons name="logo-google" size={18} color="#EA4335" />
                <Text style={styles.emailHighlightText}>{email}</Text>
              </View>
            ) : null}

            <Text style={styles.confirmMailHint}>
              Vui lòng kiểm tra hộp thư Gmail (bao gồm cả mục Thư rác hoặc Spam) và nhấn vào nút Xác Nhận Tài Khoản.
            </Text>

            <TouchableOpacity
              style={styles.closeRegModalBtn}
              onPress={() => setUnverifiedModalVisible(false)}>
              <Text style={styles.closeRegModalBtnText}>Đã Hiểu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Forgot Password Custom UI Modal */}
      <Modal
        visible={forgotModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setForgotModalVisible(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <View style={styles.mailIconBadge}>
              <Ionicons name="key-outline" size={36} color="#D84315" />
            </View>
            <Text style={styles.confirmTitle}>Quên Mật Khẩu</Text>
            <Text style={styles.confirmSubtitle}>
              Nhập địa chỉ Gmail của bạn để nhận liên kết đặt lại mật khẩu mới.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Địa chỉ Gmail</Text>
              <TextInput
                style={styles.input}
                placeholder="email@example.com"
                placeholderTextColor="#A1887F"
                keyboardType="email-address"
                autoCapitalize="none"
                value={forgotEmail}
                onChangeText={setForgotEmail}
              />
            </View>

            <View style={styles.confirmActionsRow}>
              <TouchableOpacity
                style={styles.cancelActionBtn}
                onPress={() => setForgotModalVisible(false)}>
                <Text style={styles.cancelActionText}>Hủy bỏ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.logoutActionBtn}
                onPress={handleForgotPasswordSubmit}
                disabled={sendingForgot}>
                {sendingForgot ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.logoutActionText}>Gửi Yêu Cầu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Avatar Change Modal */}
      <Modal visible={avatarModalVisible} animationType="slide">
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAvatarModalVisible(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#3E2723" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Đổi Ảnh Đại Diện 🖼️</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* Current Avatar Preview */}
            <View style={styles.avatarPreviewBox}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.previewAvatarImg} />
              ) : (
                <View style={styles.previewAvatarCircle}>
                  <Text style={styles.previewAvatarLetter}>
                    {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
              )}
              <Text style={styles.previewAvatarLabel}>Ảnh đại diện hiện tại</Text>
            </View>

            {/* Device Photo Library Button */}
            <TouchableOpacity
              style={styles.pickLibraryBtn}
              onPress={pickImageFromLibrary}
              disabled={updatingProfile}>
              {updatingProfile ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="images" size={24} color="#FFFFFF" />
                  <Text style={styles.pickLibraryBtnText}>CHỌN ẢNH TỪ THƯ VIỆN THIẾT BỊ</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Account Info Modal */}
      <Modal visible={accountModalVisible} animationType="slide">
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAccountModalVisible(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#3E2723" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Thông Tin Tài Khoản 👤</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email (Không thể thay đổi)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: '#F5EBE6', color: '#8D6E63' }]}
                value={user?.email || ''}
                editable={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Họ và tên</Text>
              <TextInput
                style={styles.input}
                value={editFullName}
                onChangeText={setEditFullName}
                placeholder="Nhập họ tên"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Số điện thoại</Text>
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                placeholder="Nhập số điện thoại"
              />
            </View>

            {/* Change Password Card Section */}
            <View style={{ marginTop: 8, marginBottom: 16, borderTopWidth: 1, borderTopColor: '#F5EBE6', paddingTop: 16 }}>
              <TouchableOpacity
                onPress={() => setShowPasswordSection(!showPasswordSection)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#FFF3E0',
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#FFE0B2',
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="lock-closed" size={18} color="#D84315" style={{ marginRight: 8 }} />
                  <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#3E2723' }}>
                    Đổi Mật Khẩu
                  </Text>
                </View>
                <Ionicons
                  name={showPasswordSection ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#D84315"
                />
              </TouchableOpacity>

              {showPasswordSection && (
                <View style={{ backgroundColor: '#FAFAFA', padding: 14, borderRadius: 12, marginTop: 10, borderWidth: 1, borderColor: '#EEEEEE' }}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Mật khẩu hiện tại *</Text>
                    <TextInput
                      style={styles.input}
                      secureTextEntry
                      value={oldPassword}
                      onChangeText={setOldPassword}
                      placeholder="Nhập mật khẩu hiện tại"
                      placeholderTextColor="#A1887F"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Mật khẩu mới *</Text>
                    <TextInput
                      style={styles.input}
                      secureTextEntry
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                      placeholderTextColor="#A1887F"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Xác nhận mật khẩu mới *</Text>
                    <TextInput
                      style={styles.input}
                      secureTextEntry
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Nhập lại mật khẩu mới"
                      placeholderTextColor="#A1887F"
                    />
                  </View>

                  <TouchableOpacity
                    style={{
                      backgroundColor: '#3E2723',
                      paddingVertical: 12,
                      borderRadius: 10,
                      alignItems: 'center',
                      marginTop: 6,
                    }}
                    onPress={handleChangePassword}
                    disabled={changingPassword}>
                    {changingPassword ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>
                        CẬP NHẬT MẬT KHẨU
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.saveProfileBtn}
              onPress={() => handleUpdateProfile()}
              disabled={updatingProfile}>
              {updatingProfile ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveProfileText}>LƯU THAY ĐỔI</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Address Book Modal */}
      <Modal visible={addressModalVisible} animationType="slide">
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAddressModalVisible(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#3E2723" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Địa Chỉ Giao Hàng</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* Toggle Accordion Dropdown Button for Add/Edit Address */}
            <TouchableOpacity
              onPress={() => {
                if (showAddAddressForm) {
                  setShowAddAddressForm(false);
                  setEditingAddressId(null);
                  setNewAddressStreet('');
                  setSelectedProvince('');
                  setSelectedDistrict('');
                  setSelectedWard('');
                } else {
                  setShowAddAddressForm(true);
                }
              }}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: editingAddressId ? '#FBE9E7' : '#FFF3E0',
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: editingAddressId ? '#FFCCBC' : '#FFE0B2',
                marginBottom: 16,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons
                  name={editingAddressId ? 'pencil-sharp' : 'add-circle-sharp'}
                  size={20}
                  color="#D84315"
                  style={{ marginRight: 8 }}
                />
                <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#3E2723' }}>
                  {editingAddressId ? 'Đang chỉnh sửa địa chỉ' : 'Thêm địa chỉ giao hàng mới'}
                </Text>
              </View>
              <Ionicons
                name={showAddAddressForm ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#D84315"
              />
            </TouchableOpacity>

            {showAddAddressForm && (
              <View style={{ backgroundColor: '#FAFAFA', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#EEEEEE', marginBottom: 20 }}>
                {/* 1. Chọn Tỉnh / Thành phố Dropdown */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>1. Thành phố / Tỉnh *</Text>
                  {Platform.OS === 'web' ? (
                    <select
                      style={{
                        ...(styles.input as object),
                        cursor: 'pointer',
                        borderColor: selectedProvince ? '#D84315' : '#E0E0E0',
                        backgroundColor: '#FFFFFF',
                      }}
                      value={selectedProvince}
                      onChange={(e) => {
                        const prov = e.target.value;
                        setSelectedProvince(prov);
                        setSelectedDistrict('');
                        setSelectedWard('');
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
                          style={[styles.chipBtn, selectedProvince === prov && styles.chipBtnActive]}
                          onPress={() => {
                            setSelectedProvince(prov);
                            setSelectedDistrict('');
                            setSelectedWard('');
                          }}>
                          <Text style={[styles.chipText, selectedProvince === prov && styles.chipTextActive]}>
                            {prov}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* 2. Chọn Quận / Huyện Dropdown */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, !selectedProvince && { opacity: 0.5 }]}>
                    2. Quận / Huyện {!selectedProvince ? '(Vui lòng chọn Tỉnh trước)' : '*'}
                  </Text>
                  {Platform.OS === 'web' ? (
                    <select
                      disabled={!selectedProvince}
                      style={{
                        ...(styles.input as object),
                        cursor: !selectedProvince ? 'not-allowed' : 'pointer',
                        opacity: !selectedProvince ? 0.6 : 1,
                        backgroundColor: !selectedProvince ? '#F5F5F5' : '#FFFFFF',
                        borderColor: selectedDistrict ? '#D84315' : '#E0E0E0',
                      }}
                      value={selectedDistrict}
                      onChange={(e) => {
                        const dist = e.target.value;
                        setSelectedDistrict(dist);
                        setSelectedWard('');
                      }}>
                      <option value="" disabled>
                        {!selectedProvince ? '-- Vui lòng chọn Thành phố / Tỉnh trước --' : '-- Chọn Quận / Huyện --'}
                      </option>
                      {(VIETNAM_DISTRICTS[selectedProvince] || []).map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                      {(VIETNAM_DISTRICTS[selectedProvince] || []).map((dist) => (
                        <TouchableOpacity
                          key={dist}
                          disabled={!selectedProvince}
                          style={[styles.chipBtn, selectedDistrict === dist && styles.chipBtnActive]}
                          onPress={() => {
                            setSelectedDistrict(dist);
                            setSelectedWard('');
                          }}>
                          <Text style={[styles.chipText, selectedDistrict === dist && styles.chipTextActive]}>
                            {dist}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* 3. Chọn Phường / Xã Dropdown */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, !selectedDistrict && { opacity: 0.5 }]}>
                    3. Phường / Xã / Thị trấn {!selectedDistrict ? '(Vui lòng chọn Quận/Huyện trước)' : '*'}
                  </Text>
                  {Platform.OS === 'web' ? (
                    <select
                      disabled={!selectedDistrict}
                      style={{
                        ...(styles.input as object),
                        cursor: !selectedDistrict ? 'not-allowed' : 'pointer',
                        opacity: !selectedDistrict ? 0.6 : 1,
                        backgroundColor: !selectedDistrict ? '#F5F5F5' : '#FFFFFF',
                        borderColor: selectedWard ? '#D84315' : '#E0E0E0',
                      }}
                      value={selectedWard}
                      onChange={(e) => setSelectedWard(e.target.value)}>
                      <option value="" disabled>
                        {!selectedDistrict ? '-- Vui lòng chọn Quận / Huyện trước --' : '-- Chọn Phường / Xã / Thị trấn --'}
                      </option>
                      {(VIETNAM_WARDS[selectedDistrict] || []).map((ward) => (
                        <option key={ward} value={ward}>
                          {ward}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                      {(VIETNAM_WARDS[selectedDistrict] || []).map((ward) => (
                        <TouchableOpacity
                          key={ward}
                          disabled={!selectedDistrict}
                          style={[styles.chipBtn, selectedWard === ward && styles.chipBtnActive]}
                          onPress={() => setSelectedWard(ward)}>
                          <Text style={[styles.chipText, selectedWard === ward && styles.chipTextActive]}>
                            {ward}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>

                {/* 4. Nhập Địa chỉ cụ thể (Số nhà, Tên đường) */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, !selectedWard && { opacity: 0.5 }]}>
                    4. Số nhà / Tên đường chi tiết {!selectedWard ? '(Vui lòng chọn Phường/Xã trước)' : '*'}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      !selectedWard && { backgroundColor: '#F5F5F5', opacity: 0.6 },
                    ]}
                    editable={Boolean(selectedWard)}
                    value={newAddressStreet}
                    onChangeText={setNewAddressStreet}
                    placeholder={!selectedWard ? 'Vui lòng chọn Phường/Xã trước...' : 'Ví dụ: 16 Hào Nam'}
                    placeholderTextColor="#A1887F"
                  />
                </View>

                {/* Xem trước Địa chỉ Lọc Trùng Chuẩn */}
                {Boolean(selectedWard || selectedDistrict || selectedProvince || newAddressStreet) && (
                  <View style={{ backgroundColor: '#FFF3E0', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FFE0B2', marginBottom: 14 }}>
                    <Text style={{ fontSize: 11, color: '#D84315', fontWeight: 'bold', marginBottom: 2 }}>ĐỊA CHỈ XEM TRƯỚC:</Text>
                    <Text style={{ fontSize: 13, color: '#3E2723', fontWeight: '600' }}>
                      {[
                        cleanStreetDetail(newAddressStreet, selectedWard, selectedDistrict, selectedProvince),
                        selectedWard,
                        selectedDistrict,
                        selectedProvince,
                      ].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {editingAddressId && (
                    <TouchableOpacity
                      style={[styles.addAddrBtn, { flex: 1, backgroundColor: '#9E9E9E' }]}
                      onPress={() => {
                        setEditingAddressId(null);
                        setShowAddAddressForm(false);
                        setNewAddressStreet('');
                        setSelectedProvince('');
                        setSelectedDistrict('');
                        setSelectedWard('');
                      }}>
                      <Text style={styles.addAddrText}>HỦY SỬA</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.addAddrBtn, { flex: 1 }]}
                    onPress={handleAddAddress}
                    disabled={savingAddress}>
                    {savingAddress ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.addAddrText}>
                        {editingAddressId ? 'LƯU CẬP NHẬT' : 'THÊM ĐỊA CHỈ NÀY'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <Text style={[styles.modalSectionTitle, { marginTop: 8 }]}>
              Danh sách địa chỉ của bạn ({addresses.length})
            </Text>

            {addresses.length === 0 ? (
              <Text style={styles.emptyAddrText}>Chưa có địa chỉ nào được lưu trong hệ thống.</Text>
            ) : (
              addresses.map((addr: any, index: number) => (
                <View key={addr.id || index} style={styles.addressCard}>
                  <Ionicons name="location-sharp" size={22} color="#D84315" />
                  <View style={{ flex: 1, marginLeft: 10, marginRight: 8 }}>
                    <Text style={styles.addressStreet}>{addr.address || addr.street}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => handleEditAddressClick(addr)}
                      style={{ padding: 8, backgroundColor: '#FFF3E0', borderRadius: 8, borderWidth: 1, borderColor: '#FFE0B2' }}>
                      <Ionicons name="pencil" size={16} color="#D84315" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteAddress(addr.id)}
                      style={{ padding: 8, backgroundColor: '#FFEBEE', borderRadius: 8, borderWidth: 1, borderColor: '#FFCDD2' }}>
                      <Ionicons name="trash-outline" size={16} color="#E53935" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarTouchable: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarImg: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: '#D84315',
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#D84315',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#D84315',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  userEmail: {
    fontSize: 13,
    color: '#8D6E63',
    marginTop: 2,
  },
  pointsCard: {
    backgroundColor: '#3E2723',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pointsTitle: {
    color: '#FFB300',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  pointsVal: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 6,
  },
  pointsSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  menuGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EFEBE9',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EBE6',
    gap: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    color: '#3E2723',
    fontWeight: '500',
  },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 14,
    borderRadius: 16,
    gap: 8,
  },
  logoutText: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: 'bold',
  },
  authContainer: {
    paddingTop: 10,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  authBrandTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3E2723',
    marginTop: 8,
  },
  authBrandSub: {
    fontSize: 12,
    color: '#8D6E63',
    marginTop: 4,
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#EFEBE9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8D6E63',
  },
  tabTextActive: {
    color: '#D84315',
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    color: '#5D4037',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#3E2723',
    borderWidth: 1,
    borderColor: '#EFEBE9',
  },
  submitBtn: {
    backgroundColor: '#D84315',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    fontSize: 12,
    color: '#8D6E63',
    paddingHorizontal: 12,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 10,
    elevation: 1,
  },
  googleBtnText: {
    color: '#3C4043',
    fontSize: 14,
    fontWeight: '600',
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
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#3E2723',
    marginBottom: 10,
  },
  saveProfileBtn: {
    backgroundColor: '#D84315',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  saveProfileText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  addAddrBtn: {
    backgroundColor: '#3E2723',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  addAddrText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyAddrText: {
    fontSize: 13,
    color: '#8D6E63',
    fontStyle: 'italic',
    marginTop: 8,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EFEBE9',
  },
  addressStreet: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3E2723',
  },
  addressCity: {
    fontSize: 12,
    color: '#8D6E63',
    marginTop: 2,
  },
  avatarPreviewBox: {
    alignItems: 'center',
    marginVertical: 24,
  },
  previewAvatarImg: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#D84315',
    marginBottom: 10,
  },
  previewAvatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#D84315',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  previewAvatarLetter: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: 'bold',
  },
  previewAvatarLabel: {
    fontSize: 13,
    color: '#8D6E63',
  },
  pickLibraryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D84315',
    paddingVertical: 16,
    borderRadius: 18,
    gap: 10,
    elevation: 3,
    marginVertical: 10,
  },
  pickLibraryBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
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
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFDF9',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  confirmIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3E2723',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmSubtitle: {
    fontSize: 14,
    color: '#795548',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelActionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#616161',
  },
  logoutActionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#E53935',
    alignItems: 'center',
    elevation: 2,
  },
  logoutActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mailIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FBE9E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emailHighlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    gap: 8,
    marginVertical: 12,
    width: '100%',
    justifyContent: 'center',
  },
  emailHighlightText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#D84315',
  },
  confirmMailHint: {
    fontSize: 13,
    color: '#6D4C41',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  closeRegModalBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#D84315',
    alignItems: 'center',
    elevation: 2,
  },
  closeRegModalBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
