import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, SafeAreaView, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../services/apiClient';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleResetPassword = async () => {
    if (!token) {
      setErrorMsg('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setErrorMsg('Vui lòng nhập đầy đủ mật khẩu mới và xác nhận mật khẩu.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await apiFetch(`/auth/reset-password?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        body: JSON.stringify({ password: newPassword, confirmPassword }),
      });
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Không thể đặt lại mật khẩu. Liên kết có thể đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {success ? (
            <View style={styles.resultBox}>
              <View style={styles.successIconBadge}>
                <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
              </View>
              <Text style={styles.title}>Đặt Lại Mật Khẩu Thành Công</Text>
              <Text style={styles.subtitle}>
                Mật khẩu tài khoản của bạn đã được cập nhật. Bạn có thể sử dụng mật khẩu mới để đăng nhập ngay bây giờ.
              </Text>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.replace('/profile')}>
                <Text style={styles.actionBtnText}>ĐĂNG NHẬP NGAY</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formBox}>
              <View style={styles.headerIconBadge}>
                <Ionicons name="key-outline" size={36} color="#D84315" />
              </View>
              <Text style={styles.title}>Đặt Lại Mật Khẩu Mới</Text>
              <Text style={styles.subtitle}>Vui lòng nhập mật khẩu mới cho tài khoản của bạn.</Text>

              {errorMsg ? (
                <View style={styles.errorAlertBox}>
                  <Ionicons name="alert-circle-outline" size={18} color="#D32F2F" />
                  <Text style={styles.errorAlertText}>{errorMsg}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mật khẩu mới</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  placeholderTextColor="#A1887F"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Xác nhận mật khẩu mới</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập lại mật khẩu mới"
                  placeholderTextColor="#A1887F"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleResetPassword}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.actionBtnText}>CẬP NHẬT MẬT KHẨU</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => router.replace('/profile')}>
                <Text style={styles.backBtnText}>Quay Về Trang Đăng Nhập</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFDF9',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  formBox: {
    width: '100%',
    alignItems: 'center',
  },
  resultBox: {
    alignItems: 'center',
    width: '100%',
  },
  headerIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FBE9E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successIconBadge: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3E2723',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6D4C41',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  errorAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 20,
    width: '100%',
  },
  errorAlertText: {
    color: '#D32F2F',
    fontSize: 13,
    flex: 1,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5D4037',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0D6D3',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#3E2723',
  },
  actionBtn: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: '#D84315',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    marginTop: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  backBtn: {
    marginTop: 16,
    paddingVertical: 8,
  },
  backBtnText: {
    color: '#8D6E63',
    fontSize: 14,
    fontWeight: '600',
  },
});
