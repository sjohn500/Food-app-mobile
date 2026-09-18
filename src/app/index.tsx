import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';

import { supabase } from '@/lib/supabase';

type FoodPost = {
  id: string;
  seller_name: string | null;
  dish_name: string | null;
  price: number | string | null;
  photo_url: string | null;
  category: string | null;
};

const categories = [
  'All',
  'Local Food',
  'Foreign Food',
  'Fruit',
  'Snack',
];

export default function HomeScreen() {
  const [posts, setPosts] = useState<FoodPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] =
    useState('All');

  useEffect(() => {
    loadFood();
  }, []);

  const loadFood = async () => {
    try {
      const { data, error } = await supabase
        .from('post')
        .select(
          'id, seller_name, dish_name, price, photo_url, category'
        )
        .order('created_at', {
          ascending: false,
        })
        .limit(8);

      if (error) {
        throw error;
      }

      setPosts(data || []);
    } catch (error) {
      console.log('HOME FOOD ERROR:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts =
    selectedCategory === 'All'
      ? posts
      : posts.filter(
          (post) =>
            post.category === selectedCategory
        );

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>
              ChopNow
            </Text>

            <Text style={styles.tagline}>
              Food from people around you
            </Text>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.profileInitial}>
              J
            </Text>
          </TouchableOpacity>
        </View>

        {/* HERO */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>
            Find your next meal.
          </Text>

          <Text style={styles.heroSubtitle}>
            Discover homemade meals, local dishes,
            snacks and more from independent sellers.
          </Text>

          <TouchableOpacity
            style={styles.searchBox}
            onPress={() => router.push('/explore')}
          >
            <Text style={styles.searchIcon}>
              Search
            </Text>

            <Text style={styles.searchText}>
              Search food or dishes
            </Text>
          </TouchableOpacity>
        </View>

        {/* CATEGORIES */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Browse categories
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/explore')}
          >
            <Text style={styles.seeAll}>
              View all
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {categories.map((category) => {
            const selected =
              selectedCategory === category;

            return (
              <TouchableOpacity
                key={category}
                onPress={() =>
                  setSelectedCategory(category)
                }
                style={[
                  styles.category,
                  selected &&
                    styles.categorySelected,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selected &&
                      styles.categoryTextSelected,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* FOOD */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Featured food
          </Text>

          <TouchableOpacity
            onPress={() => router.push('/explore')}
          >
            <Text style={styles.seeAll}>
              Explore
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator
            size="small"
            style={styles.loader}
          />
        ) : filteredPosts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              Nothing here yet
            </Text>

            <Text style={styles.emptyText}>
              Be the first seller to add food to
              ChopNow.
            </Text>

            <TouchableOpacity
              style={styles.postButton}
              onPress={() =>
                router.push('/post-food')
              }
            >
              <Text style={styles.postButtonText}>
                Add Food
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.foodGrid}>
            {filteredPosts
              .slice(0, 4)
              .map((post) => (
                <TouchableOpacity
                  key={post.id}
                  activeOpacity={0.9}
                  style={styles.foodCard}
                  onPress={() =>
                    router.push('/explore')
                  }
                >
                  {post.photo_url ? (
                    <Image
                      source={{
                        uri: post.photo_url,
                      }}
                      style={styles.foodImage}
                    />
                  ) : (
                    <View
                      style={styles.imagePlaceholder}
                    >
                      <Text
                        style={
                          styles.placeholderText
                        }
                      >
                        No image
                      </Text>
                    </View>
                  )}

                  <View style={styles.foodInfo}>
                    <Text
                      style={styles.foodName}
                      numberOfLines={1}
                    >
                      {post.dish_name ||
                        'Unnamed Food'}
                    </Text>

                    <Text
                      style={styles.seller}
                      numberOfLines={1}
                    >
                      {post.seller_name ||
                        'Unknown seller'}
                    </Text>

                    <View
                      style={styles.priceRow}
                    >
                      <Text
                        style={styles.price}
                      >
                        ₦
                        {Number(
                          post.price || 0
                        ).toLocaleString()}
                      </Text>

                      {post.category && (
                        <Text
                          style={
                            styles.categoryLabel
                          }
                        >
                          {post.category}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        )}

        {/* EXPLORE BUTTON */}
        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => router.push('/explore')}
          activeOpacity={0.85}
        >
          <Text style={styles.exploreButtonText}>
            Explore all food
          </Text>

          <Text style={styles.arrow}>
            →
          </Text>
        </TouchableOpacity>

        {/* SELLER SECTION */}
        <View style={styles.sellerCard}>
          <Text style={styles.sellerEyebrow}>
            FOR SELLERS
          </Text>

          <Text style={styles.sellerTitle}>
            Turn your food into a business.
          </Text>

          <Text style={styles.sellerText}>
            List your meals, reach new customers
            and manage your food posts from one
            place.
          </Text>

          <TouchableOpacity
            style={styles.sellButton}
            onPress={() =>
              router.push('/post-food')
            }
          >
            <Text style={styles.sellButtonText}>
              Post your food
            </Text>

            <Text style={styles.sellArrow}>
              →
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F7F5',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 55,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 36,
  },

  logo: {
    fontSize: 29,
    fontWeight: '800',
    letterSpacing: -1.2,
    color: '#111111',
  },

  tagline: {
    marginTop: 3,
    fontSize: 12,
    color: '#858585',
  },

  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileInitial: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  hero: {
    marginBottom: 34,
  },

  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1.5,
    lineHeight: 42,
    color: '#111111',
  },

  heroSubtitle: {
    fontSize: 14,
    color: '#6F6F6F',
    lineHeight: 21,
    marginTop: 10,
    maxWidth: 350,
  },

  searchBox: {
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },

  searchIcon: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555555',
    marginRight: 10,
  },

  searchText: {
    color: '#999999',
    fontSize: 14,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.4,
  },

  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555555',
  },

  categoryList: {
    paddingBottom: 30,
    gap: 8,
  },

  category: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E2E2',
  },

  categorySelected: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },

  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444444',
  },

  categoryTextSelected: {
    color: '#FFFFFF',
  },

  loader: {
    marginVertical: 45,
  },

  foodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },

  foodCard: {
    width: '48.2%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },

  foodImage: {
    width: '100%',
    height: 145,
  },

  imagePlaceholder: {
    width: '100%',
    height: 145,
    backgroundColor: '#EAEAE8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  placeholderText: {
    color: '#999999',
    fontSize: 12,
  },

  foodInfo: {
    padding: 12,
  },

  foodName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
  },

  seller: {
    color: '#858585',
    fontSize: 12,
    marginTop: 4,
  },

  priceRow: {
    marginTop: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  price: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111111',
  },

  categoryLabel: {
    fontSize: 9,
    color: '#777777',
    maxWidth: 65,
    textAlign: 'right',
  },

  empty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7E7E7',
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
  },

  emptyText: {
    color: '#777777',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },

  postButton: {
    marginTop: 18,
    backgroundColor: '#111111',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },

  postButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  exploreButton: {
    marginTop: 28,
    height: 54,
    borderRadius: 13,
    backgroundColor: '#111111',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  arrow: {
    color: '#FFFFFF',
    fontSize: 20,
    marginLeft: 10,
  },

  sellerCard: {
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  sellerEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#777777',
  },

  sellerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#111111',
    marginTop: 7,
    letterSpacing: -0.5,
  },

  sellerText: {
    color: '#707070',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
  },

  sellButton: {
    marginTop: 18,
    height: 45,
    paddingHorizontal: 17,
    borderRadius: 10,
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },

  sellButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  sellArrow: {
    color: '#FFFFFF',
    fontSize: 17,
    marginLeft: 8,
  },

  bottomSpace: {
    height: 45,
  },
});