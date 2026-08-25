import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../services/apiClient';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const doVerify = async () => {
      if (!token) {
        setLoading(false);
        setSuccess(false);
        setMessage('Mã xác thực không tồn tại hoặc đã hết hạn.');
        return;
      }

      try {
        const res = await apiFetch(`/auth/verify-email?token=${encodeURIComponent(token)}`);
        setSuccess(true);
        setMessage(res?.message || 'Email của bạn đã được xác thực thành công. Bạn có thể đăng nhập ngay!');
      } catch (err: any) {
        setSuccess(false);
        setMessage(err?.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn.');
      } finally {
        setLoading(false);
      }
    };

    doVerify();
  }, [token]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#D84315" />
            <Text style={styles.loadingText}>Đang xác thực tài khoản của bạn...</Text>
          </View>
        ) : success ? (
          <View style={styles.resultBox}>
            <View style={styles.successIconBadge}>
              <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            </View>
            <Text style={styles.title}>Xác Thực Thành Công</Text>
            <Text style={styles.subtitle}>{message}</Text>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.replace('/profile')}>
              <Text style={styles.actionBtnText}>ĐĂNG NHẬP NGAY</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.resultBox}>
            <View style={styles.errorIconBadge}>
              <Ionicons name="alert-circle" size={64} color="#E53935" />
            </View>
            <Text style={styles.title}>Xác Thực Thất Bại</Text>
            <Text style={styles.subtitle}>{message}</Text>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#5D4037' }]}
              onPress={() => router.replace('/profile')}>
              <Text style={styles.actionBtnText}>VỀ TRANG ĐĂNG KÝ</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
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
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: '#5D4037',
    fontWeight: '500',
  },
  resultBox: {
    alignItems: 'center',
    width: '100%',
  },
  successIconBadge: {
    marginBottom: 16,
  },
  errorIconBadge: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3E2723',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6D4C41',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  actionBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    backgroundColor: '#D84315',
    alignItems: 'center',
    elevation: 3,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
