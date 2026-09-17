import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
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
          Alert.alert(
            'Phone required',
            'Enter your phone number.'
          );
          return;
        }

        const { error } =
          await supabase.auth.signInWithOtp({
            phone: cleanPhone,
          });

        if (error) throw error;
      } else {
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanEmail) {
          Alert.alert(
            'Email required',
            'Enter your email address.'
          );
          return;
        }

        // Create the Expo app deep link
        const redirectTo = Linking.createURL('/');

        console.log(
          'Email redirect URL:',
          redirectTo
        );

        const { error } =
          await supabase.auth.signInWithOtp({
            email: cleanEmail,
            options: {
              emailRedirectTo: redirectTo,
            },
          });

        if (error) throw error;
      }

      setOtpSent(true);

      Alert.alert(
        'OTP Sent',
        `Check your ${
          method === 'phone' ? 'phone' : 'email'
        } for the verification code.`
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Could not send OTP.'
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert(
        'OTP required',
        'Enter the verification code.'
      );
      return;
    }

    setLoading(true);

    try {
      const { error } =
        method === 'phone'
          ? await supabase.auth.verifyOtp({
              phone: phone.trim(),
              token: otp.trim(),
              type: 'sms',
            })
          : await supabase.auth.verifyOtp({
              email: email.trim(),
              token: otp.trim(),
              type: 'email',
            });

      if (error) throw error;

      router.replace('/post-food');
    } catch (error) {
      Alert.alert(
        'Verification failed',
        error instanceof Error
          ? error.message
          : 'Invalid verification code.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Welcome to ChopNow
      </Text>

      <Text style={styles.subtitle}>
        Sign in to continue
      </Text>

      {!otpSent && (
        <>
          <View style={styles.methodButtons}>
            <Button
              title="Phone"
              onPress={() => setMethod('phone')}
            />

            <Button
              title="Email"
              onPress={() => setMethod('email')}
            />
          </View>

          {method === 'phone' ? (
            <TextInput
              style={styles.input}
              placeholder="+2348001234567"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          ) : (
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}

          {loading ? (
            <ActivityIndicator size="large" />
          ) : (
            <Button
              title="Send OTP"
              onPress={sendOtp}
            />
          )}
        </>
      )}

      {otpSent && (
        <>
          <Text style={styles.sentText}>
            Enter the verification code sent to you.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            maxLength={6}
          />

          {loading ? (
            <ActivityIndicator size="large" />
          ) : (
            <Button
              title="Verify & Continue"
              onPress={verifyOtp}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 100,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    marginBottom: 25,
  },

  methodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },

  sentText: {
    marginBottom: 15,
    fontSize: 16,
  },
});