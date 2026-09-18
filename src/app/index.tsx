import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';

type FoodPost = {
  id: string;
  seller_name: string | null;
  dish_name: string | null;
  price: number | string | null;
  photo_url: string | null;
};

export default function HomeScreen() {
  const [posts, setPosts] = useState<FoodPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('post')
        .select(
          'id, seller_name, dish_name, price, photo_url'
        )
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.log('HOME POSTS ERROR:', error);
        return;
      }

      setPosts((data ?? []) as FoodPost[]);
    } catch (error) {
      console.log('HOME ERROR:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPosts();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            {/* Hero */}
            <View style={styles.hero}>
              <Text style={styles.logo}>🍲</Text>

              <Text style={styles.title}>
                ChopNow
              </Text>

              <Text style={styles.tagline}>
                Good food. Real people.
              </Text>

              <Text style={styles.subTagline}>
                Discover food around you.
              </Text>
            </View>

            {/* Section title */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Fresh food listings
              </Text>

              <TouchableOpacity
                onPress={() => router.push('/explore')}
              >
                <Text style={styles.seeAll}>
                  See all
                </Text>
              </TouchableOpacity>
            </View>

            {/* Loading */}
            {loading && (
              <View style={styles.loading}>
                <ActivityIndicator size="small" />
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.foodCard}
            activeOpacity={0.9}
            onPress={() => router.push('/explore')}
          >
            {item.photo_url ? (
              <Image
                source={{ uri: item.photo_url }}
                style={styles.foodImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.noImage}>
                <Text style={styles.noImageText}>
                  🍽️
                </Text>
              </View>
            )}

            <View style={styles.foodInfo}>
              <View style={styles.foodTop}>
                <Text
                  style={styles.dishName}
                  numberOfLines={1}
                >
                  {item.dish_name || 'Unnamed dish'}
                </Text>

                <Text style={styles.price}>
                  ₦
                  {Number(
                    item.price || 0
                  ).toLocaleString()}
                </Text>
              </View>

              <Text
                style={styles.seller}
                numberOfLines={1}
              >
                {item.seller_name || 'Unknown seller'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>
                🍽️
              </Text>

              <Text style={styles.emptyTitle}>
                Food is coming!
              </Text>

              <Text style={styles.emptyText}>
                Be the first to post something delicious.
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          <>
            {/* Value Section */}
            <View style={styles.valueSection}>
              <Text style={styles.valueTitle}>
                See it. Check it. Order it.
              </Text>

              <View style={styles.values}>
                <View style={styles.valueItem}>
                  <Text style={styles.valueIcon}>
                    📸
                  </Text>

                  <Text style={styles.valueText}>
                    See the food
                  </Text>
                </View>

                <View style={styles.valueItem}>
                  <Text style={styles.valueIcon}>
                    💰
                  </Text>

                  <Text style={styles.valueText}>
                    Know the price
                  </Text>
                </View>

                <View style={styles.valueItem}>
                  <Text style={styles.valueIcon}>
                    🤝
                  </Text>

                  <Text style={styles.valueText}>
                    Know the seller
                  </Text>
                </View>
              </View>
            </View>

            {/* Main CTA */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/explore')}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>
                Explore Food
              </Text>
            </TouchableOpacity>

            {/* Secondary CTA */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/post-food')}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryButtonText}>
                Post Your Food
              </Text>
            </TouchableOpacity>

            <View style={styles.bottomSpace} />
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  content: {
    paddingHorizontal: 20,
  },

  hero: {
    alignItems: 'center',
    paddingTop: 25,
    paddingBottom: 25,
  },

  logo: {
    fontSize: 42,
    marginBottom: 5,
  },

  title: {
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 5,
  },

  tagline: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },

  subTagline: {
    fontSize: 15,
    color: '#777',
    marginTop: 5,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: '700',
  },

  seeAll: {
    fontSize: 15,
    fontWeight: '600',
  },

  loading: {
    paddingVertical: 30,
  },

  foodCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },

  foodImage: {
    width: '100%',
    height: 180,
  },

  noImage: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
  },

  noImageText: {
    fontSize: 40,
  },

  foodInfo: {
    padding: 13,
  },

  foodTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },

  dishName: {
    flex: 1,
    fontSize: 19,
    fontWeight: '700',
  },

  price: {
    fontSize: 17,
    fontWeight: '700',
  },

  seller: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 35,
  },

  emptyEmoji: {
    fontSize: 40,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },

  emptyText: {
    color: '#777',
    marginTop: 5,
    textAlign: 'center',
  },

  valueSection: {
    marginTop: 15,
    marginBottom: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },

  valueTitle: {
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 18,
  },

  values: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  valueItem: {
    flex: 1,
    alignItems: 'center',
  },

  valueIcon: {
    fontSize: 25,
    marginBottom: 6,
  },

  valueText: {
    fontSize: 13,
    textAlign: 'center',
    color: '#555',
  },

  primaryButton: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#208AEF',
  },

  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },

  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#208AEF',
  },

  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  bottomSpace: {
    height: 25,
  },
});