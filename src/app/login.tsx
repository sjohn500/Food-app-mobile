import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      Alert.alert('Missing info', 'Please enter both email and password.');
      return;
    }

    if (cleanPassword.length < 6) {
      Alert.alert('Password too short', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { error } = isSignUp
        ? await supabase.auth.signUp({ email: cleanEmail, password: cleanPassword })
        : await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPassword });

      if (error) {
        Alert.alert(isSignUp ? 'Sign up failed' : 'Sign in failed', error.message);
        return;
      }

      router.replace('/explore');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>🍲</Text>
      <Text style={styles.title}>Welcome to ChopNow</Text>
      <Text style={styles.subtitle}>
        {isSignUp ? 'Create an account to continue' : 'Sign in to continue'}
      </Text>

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

      <TextInput
        style={styles.input}
        placeholder="Password (min 6 characters)"
        placeholderTextColor="#B0AFAF"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#D9480F" style={{ marginTop: 10 }} />
      ) : (
        <TouchableOpacity style={styles.primaryButton} onPress={handleAuth}>
          <Text style={styles.primaryButtonText}>
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.switchButton} onPress={() => setIsSignUp(!isSignUp)}>
        <Text style={styles.switchButtonText}>
          {isSignUp ? 'Already have an account? Sign In' : "New here? Create Account"}
        </Text>
      </TouchableOpacity>
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
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#D9480F',
    fontWeight: '600',
  },
});