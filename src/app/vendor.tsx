import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FoodItem {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  description: string | null;
  created_at: string;
}

export default function VendorDashboard() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vendorName, setVendorName] = useState('Vendor');

  const fetchVendorData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      setVendorName(user.user_metadata?.full_name || 'Vendor');

      // Fetch food items created by this vendor
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFoods(data || []);
    } catch (err) {
      console.error('Error fetching vendor foods:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVendorData();
  }, [fetchVendorData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVendorData();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const renderFoodItem = ({ item }: { item: FoodItem }) => (
    <View style={styles.card}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.placeholderImage]}>
          <Text style={{ fontSize: 30 }}>🍲</Text>
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <Text style={styles.cardPrice}>₦{item.price.toLocaleString()}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome, {vendorName} 👋</Text>
          <Text style={styles.headerTitle}>Vendor Dashboard 🏪</Text>
        </View>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Action: Post New Meal */}
      <TouchableOpacity
        style={styles.postMealBtn}
        onPress={() => router.push('/post-food')}
      >
        <Text style={styles.postMealBtnText}>+ Post New Meal</Text>
      </TouchableOpacity>

      {/* Menu Header */}
      <Text style={styles.sectionTitle}>Your Posted Meals ({foods.length})</Text>

      {/* Foods List */}
      {loading ? (
        <ActivityIndicator size="large" color="#D9480F" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={foods}
          keyExtractor={(item) => item.id}
          renderItem={renderFoodItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#D9480F']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🍽️</Text>
              <Text style={styles.emptyTitle}>No Meals Posted Yet</Text>
              <Text style={styles.emptySub}>
                Tap "+ Post New Meal" above to add your first menu item.
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 13,
    color: '#7A7A7A',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#D9480F',
  },
  signOutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFE8DF',
    borderRadius: 8,
  },
  signOutBtnText: {
    color: '#D9480F',
    fontWeight: '600',
    fontSize: 12,
  },
  postMealBtn: {
    backgroundColor: '#D9480F',
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#D9480F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  postMealBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A4A4A',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8D9CB',
  },
  cardImage: {
    width: 90,
    height: 90,
  },
  placeholderImage: {
    backgroundColor: '#FFE8DF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  cardDesc: {
    fontSize: 12,
    color: '#7A7A7A',
    marginTop: 2,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D9480F',
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A4A4A',
  },
  emptySub: {
    fontSize: 13,
    color: '#7A7A7A',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 30,
  },
});