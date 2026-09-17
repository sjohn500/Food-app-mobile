import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';

import { supabase } from '@/lib/supabase';

type FoodPost = {
  id: number | string;
  seller_name: string | null;
  dish_name: string | null;
  price: number | string | null;
  description: string | null;
  photo_url: string | null;
};

export default function ExploreScreen() {
  const [posts, setPosts] = useState<FoodPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPosts = async () => {
    try {
      console.log('========== LOADING POSTS ==========');

      const { data, error } = await supabase
        .from('post')
        .select('*');

      console.log('SUPABASE DATA:', data);
      console.log('SUPABASE ERROR:', error);

      if (error) {
        Alert.alert('Supabase Error', error.message);
        return;
      }

      setPosts(data ?? []);
    } catch (error) {
      console.log('LOAD ERROR:', error);

      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Unknown error'
      );
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>
          Loading food...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Explore Food</Text>

      <FlatList
        data={posts}
        keyExtractor={(item, index) =>
          item.id ? String(item.id) : String(index)
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        contentContainerStyle={
          posts.length === 0
            ? styles.emptyContainer
            : styles.list
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.photo_url ? (
              <Image
                source={{ uri: item.photo_url }}
                style={styles.foodImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.noImage}>
                <Text>No image</Text>
              </View>
            )}

            <View style={styles.cardContent}>
              <Text style={styles.dishName}>
                {item.dish_name || 'Unnamed dish'}
              </Text>

              <Text style={styles.price}>
                ₦{Number(item.price || 0).toLocaleString()}
              </Text>

              <Text style={styles.seller}>
                Seller: {item.seller_name || 'Unknown'}
              </Text>

              {item.description ? (
                <Text style={styles.description}>
                  {item.description}
                </Text>
              ) : null}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              No food posts yet
            </Text>

            <Text style={styles.emptyText}>
              No posts were returned from Supabase.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 15,
  },

  list: {
    padding: 20,
    paddingTop: 5,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },

  foodImage: {
    width: '100%',
    height: 220,
  },

  noImage: {
    width: '100%',
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eee',
  },

  cardContent: {
    padding: 15,
  },

  dishName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  price: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  seller: {
    fontSize: 14,
    marginBottom: 8,
  },

  description: {
    fontSize: 15,
    lineHeight: 21,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
  },

  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  empty: {
    alignItems: 'center',
    padding: 30,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  emptyText: {
    marginTop: 10,
    textAlign: 'center',
  },
});