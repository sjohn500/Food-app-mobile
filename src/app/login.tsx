import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot Password State
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const routeUserByRole = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Profile lookup warning:', error.message);
        router.replace('/explore');
        return;
      }

      if (profile?.role === 'vendor') {
        router.replace('/vendor');
      } else {
        router.replace('/explore');
      }
    } catch (err) {
      console.error('Role routing error:', err);
      router.replace('/explore');
    }
  };

  const handleLogin = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await routeUserByRole(data.user.id);
      }
    } catch (err) {
      Alert.alert('Login Failed', err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      if (error) throw error;

      if (data.user) {
        Alert.alert('Account created!', 'You are now signed in.');
        await routeUserByRole(data.user.id);
      }
    } catch (err) {
      Alert.alert('Sign Up Failed', err instanceof Error ? err.message : 'Could not create account');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const cleanResetEmail = resetEmail.trim();
    if (!cleanResetEmail) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanResetEmail);
      if (error) throw error;

      Alert.alert(
        'Check Your Email 📩',
        'We sent you a link to reset your password.'
      );
      setResetModalVisible(false);
      setResetEmail('');
    } catch (err) {
      Alert.alert('Reset Failed', err instanceof Error ? err.message : 'Could not send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>ChopNow 🍲</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="your@email.com"
          placeholderTextColor="#B0AFAF"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="••••••••"
            placeholderTextColor="#B0AFAF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword((prev) => !prev)}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        </View>

        {/* Forgot Password Button */}
        <TouchableOpacity
          style={styles.forgotBtn}
          onPress={() => {
            setResetEmail(email); // Pre-fill with entered email if available
            setResetModalVisible(true);
          }}
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#D9480F" style={{ marginTop: 20 }} />
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
        )}

        {/* Create Account */}
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>New here? </Text>
          <TouchableOpacity onPress={handleSignUp} disabled={loading}>
            <Text style={styles.signupLink}>Create account</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Forgot Password Modal */}
      <Modal
        visible={resetModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setResetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSubtitle}>
              Enter your registered email and we will send you a reset link.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor="#B0AFAF"
              value={resetEmail}
              onChangeText={setResetEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            {resetLoading ? (
              <ActivityIndicator size="small" color="#D9480F" style={{ marginTop: 10 }} />
            ) : (
              <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
                <Text style={styles.buttonText}>Send Reset Link</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setResetModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    justifyContent: 'center',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D9480F',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7A7A7A',
    textAlign: 'center',
    marginBottom: 32,
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A4A4A',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8D9CB',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    color: '#000',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8D9CB',
    borderRadius: 10,
    marginBottom: 8,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#000',
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  eyeIcon: {
    fontSize: 18,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotText: {
    color: '#D9480F',
    fontSize: 14,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#D9480F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  signupText: {
    color: '#7A7A7A',
    fontSize: 14,
  },
  signupLink: {
    color: '#D9480F',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D9480F',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#7A7A7A',
    marginBottom: 16,
  },
  cancelBtn: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelText: {
    color: '#7A7A7A',
    fontSize: 14,
    fontWeight: '600',
  },
});