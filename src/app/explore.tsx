import { supabase } from '@/lib/supabase';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FoodPost = {
  id: string;
  user_id: string | null;
  seller_name: string | null;
  dish_name: string | null;
  price: number | string | null;
  description: string | null;
  photo_url: string | null;
};

export default function ExploreScreen() {
  const [posts, setPosts] = useState<FoodPost[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<FoodPost | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      const { data, error } = await supabase
        .from('post')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        Alert.alert('Supabase Error', error.message);
        return;
      }

      setPosts((data ?? []) as FoodPost[]);
    } catch (err) {
      console.log('LOAD ERROR:', err);
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not load food.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
  };

  const openOrderModal = (post: FoodPost) => {
    const price = Number(post.price);
    if (!Number.isFinite(price) || price <= 0) {
      Alert.alert('Invalid price', 'This food has an invalid price.');
      return;
    }
    setSelectedPost(post);
    setQuantity('1');
    setModalVisible(true);
  };

  const submitOrder = async () => {
    if (!selectedPost) return;

    if (!phoneNumber.trim() || !deliveryAddress.trim()) {
      Alert.alert('Required fields', 'Please enter your phone number and delivery address.');
      return;
    }

    const parsedQuantity = Number(quantity.trim() || '1');
    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      Alert.alert('Invalid quantity', 'Please enter a whole number greater than 0.');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setModalVisible(false);
        Alert.alert('Login required', 'Please sign in before placing an order.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/login') },
        ]);
        return;
      }

      if (!selectedPost.user_id) {
        Alert.alert('Unavailable', 'This food cannot be ordered because the seller is not linked to the post.');
        return;
      }

      if (selectedPost.user_id === user.id) {
        Alert.alert('Your own food', 'You cannot order your own food.');
        return;
      }

      const price = Number(selectedPost.price);
      const totalPrice = price * parsedQuantity;

      setSubmitting(true);

      const transactionRef = `order-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const { error } = await supabase.rpc('place_order', {
        p_buyer_id: user.id,
        p_seller_id: selectedPost.user_id,
        p_post_id: selectedPost.id,
        p_quantity: parsedQuantity,
        p_total_price: totalPrice,
        p_transaction_ref: transactionRef,
        p_phone_number: phoneNumber.trim(),
        p_delivery_address: deliveryAddress.trim(),
        p_landmark: landmark.trim() || null,
      });

      if (error) {
        if (error.message.includes('INSUFFICIENT_FUNDS')) {
          Alert.alert('Insufficient funds', 'Please top up your wallet before ordering.');
        } else if (error.message.includes('WALLET_NOT_FOUND')) {
          Alert.alert('No wallet found', "Your account doesn't have a wallet set up yet.");
        } else if (error.message.includes('DUPLICATE_TRANSACTION')) {
          Alert.alert('Already placed', 'This order was already submitted.');
        } else {
          throw error;
        }
        return;
      }

      setModalVisible(false);
      setPhoneNumber('');
      setDeliveryAddress('');
      setLandmark('');

      Alert.alert(
        'Order placed!',
        `${parsedQuantity} × ${selectedPost.dish_name || 'Food'}\nTotal: ₦${totalPrice.toLocaleString()}\n\nWaiting for the seller to confirm.`
      );
    } catch (err) {
      console.log('ORDER ERROR:', err);
      Alert.alert('Order failed', err instanceof Error ? err.message : 'Could not place the order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#D9480F" />
        <Text style={styles.loadingText}>Loading food...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Explore Food</Text>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={posts.length === 0 ? styles.emptyContainer : styles.list}
        renderItem={({ item }) => {
          const isOwner = currentUserId !== null && item.user_id === currentUserId;

          return (
            <View style={styles.card}>
              {item.photo_url ? (
                <Image source={{ uri: item.photo_url }} style={styles.foodImage} />
              ) : (
                <View style={styles.noImage}>
                  <Text style={styles.noImageText}>🍽️</Text>
                </View>
              )}

              <View style={styles.cardContent}>
                <View style={styles.foodHeader}>
                  <Text style={styles.dishName} numberOfLines={1}>
                    {item.dish_name || 'Unnamed dish'}
                  </Text>
                  <Text style={styles.price}>₦{Number(item.price || 0).toLocaleString()}</Text>
                </View>

                <Text style={styles.seller}>
                  Seller: {item.seller_name || 'Unknown'}{isOwner ? ' (You)' : ''}
                </Text>

                {item.description ? <Text style={styles.description}>{item.description}</Text> : null}

                {!isOwner && item.user_id && (
                  <TouchableOpacity style={styles.orderButton} onPress={() => openOrderModal(item)}>
                    <Text style={styles.orderButtonText}>Order Food</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🍽️</Text>
            <Text style={styles.emptyTitle}>No food here yet</Text>
            <Text style={styles.emptyText}>Check back soon, or post something yourself.</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delivery Details</Text>
            <Text style={styles.modalSubtitle}>Ordering: {selectedPost?.dish_name || 'Food'}</Text>

            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={quantity}
              onChangeText={setQuantity}
              placeholder="1"
            />

            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="e.g. 08012345678"
            />

            <Text style={styles.label}>Delivery Address *</Text>
            <TextInput
              style={styles.input}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              placeholder="e.g. 12 Main Street, Apt 4B"
            />

            <Text style={styles.label}>Landmark (Optional)</Text>
            <TextInput
              style={styles.input}
              value={landmark}
              onChangeText={setLandmark}
              placeholder="e.g. Opposite Central Bank"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={submitOrder}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirm Order</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8F0' },
  loadingText: { marginTop: 10, color: '#7A7A7A' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#D9480F', paddingHorizontal: 20, marginTop: 16, marginBottom: 16 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  emptyContainer: { flexGrow: 1 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0E4D8',
  },
  foodImage: { width: '100%', height: 180 },
  noImage: { width: '100%', height: 180, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee' },
  noImageText: { fontSize: 40 },
  cardContent: { padding: 14 },
  foodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dishName: { flex: 1, fontSize: 18, fontWeight: '700', color: '#2B2B2B' },
  price: { fontSize: 16, fontWeight: '700', color: '#D9480F' },
  seller: { fontSize: 13, color: '#7A7A7A', marginTop: 2 },
  description: { fontSize: 14, color: '#4A4A4A', marginTop: 8 },
  orderButton: {
    backgroundColor: '#D9480F',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  orderButtonText: { color: '#fff', fontWeight: '600' },
  empty: { alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  emptyText: { marginTop: 6, textAlign: 'center', color: '#7A7A7A' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, color: '#666', marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 10, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#eee' },
  cancelBtnText: { color: '#333', fontWeight: '600' },
  confirmBtn: { backgroundColor: '#D9480F' },
  confirmBtnText: { color: '#fff', fontWeight: 'bold' },
});