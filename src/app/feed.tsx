import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

type Post = {
  seller_name: string;
  dish_name: string;
  price: number;
  description: string | null;
  photo_url: string | null;
  created_at: string;
};

export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('post')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('Feed fetch result:', JSON.stringify({ data, error }));

    if (!error && data) {
      setPosts(data as Post[]);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#D9480F" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>What's cooking 🍲</Text>
      <FlatList
        data={posts}
        keyExtractor={(_, index) => index.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={styles.empty}>No food posted yet. Be the first!</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.photo_url && (
              <Image source={{ uri: item.photo_url }} style={styles.image} />
            )}
            <View style={styles.cardBody}>
              <Text style={styles.dishName}>{item.dish_name}</Text>
              <Text style={styles.seller}>by {item.seller_name}</Text>
              {item.description ? (
                <Text style={styles.description}>{item.description}</Text>
              ) : null}
              <Text style={styles.price}>₦{item.price.toLocaleString()}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0', paddingHorizontal: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8F0' },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#D9480F',
    marginTop: 16,
    marginBottom: 16,
  },
  empty: {
    textAlign: 'center',
    color: '#7A7A7A',
    marginTop: 60,
    fontSize: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0E4D8',
  },
  image: {
    width: '100%',
    height: 180,
  },
  cardBody: {
    padding: 14,
  },
  dishName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2B2B2B',
  },
  seller: {
    fontSize: 13,
    color: '#7A7A7A',
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: '#4A4A4A',
    marginTop: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D9480F',
    marginTop: 10,
  },
});