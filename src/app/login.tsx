import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

type LoginMethod = 'phone' | 'email';

export default function LoginScreen() {
  const [method, setMethod] = useState<LoginMethod>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    setLoading(true);
    try {
      if (method === 'phone') {
        const cleanPhone = phone.trim();
        if (!cleanPhone) {
          Alert.alert('Phone required', 'Enter your phone number.');
          return;
        }
        const { error } = await supabase.auth.signInWithOtp({ phone: cleanPhone });
        if (error) throw error;
      } else {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail) {
          Alert.alert('Email required', 'Enter your email address.');
          return;
        }
        const redirectTo = Linking.createURL('/');
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: { emailRedirectTo: redirectTo },
        });
        if (error) throw error;
      }
      setOtpSent(true);
      Alert.alert('OTP Sent', `Check your ${method === 'phone' ? 'phone' : 'email'} for the code.`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert('OTP required', 'Enter the verification code.');
      return;
    }
    setLoading(true);
    try {
      const { error } =
        method === 'phone'
          ? await supabase.auth.verifyOtp({ phone: phone.trim(), token: otp.trim(), type: 'sms' })
          : await supabase.auth.verifyOtp({ email: email.trim(), token: otp.trim(), type: 'email' });
      if (error) throw error;
      router.replace('/post-food');
    } catch (error) {
      Alert.alert('Verification failed', error instanceof Error ? error.message : 'Invalid code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>🍲</Text>
      <Text style={styles.title}>Welcome to ChopNow</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      {!otpSent && (
        <>
          <View style={styles.toggleBar}>
            <TouchableOpacity
              style={[styles.toggleButton, method === 'phone' && styles.toggleButtonActive]}
              onPress={() => setMethod('phone')}
            >
              <Text style={[styles.toggleText, method === 'phone' && styles.toggleTextActive]}>
                Phone
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, method === 'email' && styles.toggleButtonActive]}
              onPress={() => setMethod('email')}
            >
              <Text style={[styles.toggleText, method === 'email' && styles.toggleTextActive]}>
                Email
              </Text>
            </TouchableOpacity>
          </View>

          {method === 'phone' ? (
            <TextInput
              style={styles.input}
              placeholder="+2348001234567"
              placeholderTextColor="#B0AFAF"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          ) : (
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#B0AFAF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}

          {loading ? (
            <ActivityIndicator size="large" color="#D9480F" style={{ marginTop: 10 }} />
          ) : (
            <TouchableOpacity style={styles.primaryButton} onPress={sendOtp}>
              <Text style={styles.primaryButtonText}>Send OTP</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {otpSent && (
        <>
          <Text style={styles.sentText}>Enter the verification code sent to you.</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter OTP"
            placeholderTextColor="#B0AFAF"
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            maxLength={6}
          />
          {loading ? (
            <ActivityIndicator size="large" color="#D9480F" style={{ marginTop: 10 }} />
          ) : (
            <TouchableOpacity style={styles.primaryButton} onPress={verifyOtp}>
              <Text style={styles.primaryButtonText}>Verify & Continue</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    padding: 24,
    paddingTop: 80,
  },
  logo: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#D9480F',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#7A7A7A',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 30,
  },
  toggleBar: {
    flexDirection: 'row',
    backgroundColor: '#F0E4D8',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#D9480F',
  },
  toggleText: {
    color: '#D9480F',
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8D9CB',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#D9480F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sentText: {
    fontSize: 15,
    color: '#7A7A7A',
    marginBottom: 16,
  },
});