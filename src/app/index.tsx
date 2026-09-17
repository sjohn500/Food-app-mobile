import { router } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>🍲</Text>
        <Text style={styles.title}>ChopNow</Text>
        <Text style={styles.subtitle}>Real food, from real people near you</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/post-food')}
        >
          <Text style={styles.primaryButtonText}>Post Food</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/feed')}
        >
          <Text style={styles.secondaryButtonText}>Browse Feed</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    fontSize: 56,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#D9480F',
  },
  subtitle: {
    fontSize: 15,
    color: '#7A7A7A',
    marginTop: 8,
    textAlign: 'center',
  },
  actions: {
    gap: 14,
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
  secondaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9480F',
  },
  secondaryButtonText: {
    color: '#D9480F',
    fontSize: 16,
    fontWeight: '600',
  },
});