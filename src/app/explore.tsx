import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { supabase } from '@/lib/supabase';

type Category =
  | 'All'
  | 'Local Food'
  | 'Foreign Food'
  | 'Fruit'
  | 'Snack';

type FoodPost = {
  id: string;
  user_id: string | null;
  seller_name: string | null;
  dish_name: string | null;
  price: number | string | null;
  description: string | null;
  photo_url: string | null;
  category: string | null;
};

const categories: {
  name: Category;
  icon: string;
}[] = [
  { name: 'All', icon: '🍽️' },
  { name: 'Local Food', icon: '🍲' },
  { name: 'Foreign Food', icon: '🌍' },
  { name: 'Fruit', icon: '🍎' },
  { name: 'Snack', icon: '🍪' },
];

export default function ExploreScreen() {
  const [posts, setPosts] = useState<FoodPost[]>([]);
  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] =
    useState<Category>('All');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [orderingPostId, setOrderingPostId] =
    useState<string | null>(null);

  const loadPosts = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUserId(user?.id ?? null);

      const { data, error } = await supabase
        .from('post')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        Alert.alert(
          'Supabase Error',
          error.message
        );
        return;
      }

      setPosts((data ?? []) as FoodPost[]);
    } catch (error) {
      console.log('LOAD ERROR:', error);

      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Could not load food.'
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

  const handleOrder = (post: FoodPost) => {
    const price = Number(post.price);

    if (!Number.isFinite(price) || price <= 0) {
      Alert.alert(
        'Invalid price',
        'This food has an invalid price.'
      );
      return;
    }

    Alert.prompt(
      `Order ${post.dish_name || 'Food'}`,
      'How many do you want?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Order',
          onPress: (value?: string) =>
            createOrder(post, value),
        },
      ],
      'plain-text',
      '1'
    );
  };

  const createOrder = async (
    post: FoodPost,
    quantityText?: string
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(
          'Login required',
          'Please sign in before placing an order.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Login',
              onPress: () =>
                router.push('/login'),
            },
          ]
        );

        return;
      }

      if (!post.user_id) {
        Alert.alert(
          'Unavailable',
          'This food cannot be ordered because the seller is not linked to the post.'
        );
        return;
      }

      if (post.user_id === user.id) {
        Alert.alert(
          'Your own food',
          'You cannot order your own food.'
        );
        return;
      }

      const quantity = Number(
        quantityText?.trim() || '1'
      );

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        Alert.alert(
          'Invalid quantity',
          'Please enter a whole number greater than 0.'
        );
        return;
      }

      const price = Number(post.price);

      if (!Number.isFinite(price) || price <= 0) {
        Alert.alert(
          'Invalid price',
          'This food has an invalid price.'
        );
        return;
      }

      const totalPrice = price * quantity;

      setOrderingPostId(post.id);

      // Client generates its own idempotency ticket before the network call,
      // so a retry after a dropped connection always reuses the same reference.
      const transactionRef = `order-${user.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const { error } = await supabase.rpc('place_order', {
        p_buyer_id: user.id,
        p_seller_id: post.user_id,
        p_post_id: post.id,
        p_quantity: quantity,
        p_total_price: totalPrice,
        p_transaction_ref: transactionRef,
      });

      if (error) {
        if (error.message.includes('INSUFFICIENT_FUNDS')) {
          Alert.alert(
            'Insufficient funds',
            'Please top up your wallet before ordering.'
          );
        } else if (error.message.includes('WALLET_NOT_FOUND')) {
          Alert.alert(
            'No wallet found',
            'Your account doesn\'t have a wallet set up yet.'
          );
        } else if (error.message.includes('DUPLICATE_TRANSACTION')) {
          Alert.alert(
            'Already placed',
            'This order was already submitted.'
          );
        } else {
          throw error;
        }
        return;
      }

      Alert.alert(
        'Order placed!',
        `${quantity} × ${
          post.dish_name || 'Food'
        }\nTotal: ₦${totalPrice.toLocaleString()}\n\nWaiting for the seller to confirm.`
      );
    } catch (error) {
      console.log('ORDER ERROR:', error);

      Alert.alert(
        'Order failed',
        error instanceof Error
          ? error.message
          : 'Could not place the order.'
      );
    } finally {
      setOrderingPostId(null);
    }
  };

  const handleDelete = (postId: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this food post?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deletePost(postId),
        },
      ]
    );
  };

  const deletePost = async (postId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(
          'Login required',
          'Please sign in first.'
        );

        router.replace('/login');
        return;
      }

      const { error } = await supabase
        .from('post')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      setPosts((currentPosts) =>
        currentPosts.filter(
          (post) => post.id !== postId
        )
      );

      Alert.alert(
        'Deleted',
        'Your food post has been deleted.'
      );
    } catch (error) {
      Alert.alert(
        'Delete failed',
        error instanceof Error
          ? error.message
          : 'Could not delete the post.'
      );
    }
  };

  const handleEdit = (postId: string) => {
    router.push({
      pathname: '/edit-post',
      params: {
        id: postId,
      },
    });
  };

  const filteredPosts =
    selectedCategory === 'All'
      ? posts
      : posts.filter(
          (post) =>
            post.category === selectedCategory
        );

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
      <Text style={styles.title}>
        Explore Food
      </Text>

      {/* Categories */}
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => {
          const selected =
            selectedCategory === item.name;

          return (
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selected &&
                  styles.categoryButtonSelected,
              ]}
              onPress={() =>
                setSelectedCategory(item.name)
              }
            >
              <Text style={styles.categoryIcon}>
                {item.icon}
              </Text>

              <Text
                style={[
                  styles.categoryText,
                  selected &&
                    styles.categoryTextSelected,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Food */}
      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        contentContainerStyle={
          filteredPosts.length === 0
            ? styles.emptyContainer
            : styles.list
        }
        renderItem={({ item }) => {
          const isOwner =
            currentUserId !== null &&
            item.user_id === currentUserId;

          const isOrdering =
            orderingPostId === item.id;

          return (
            <View style={styles.card}>
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

              <View style={styles.cardContent}>
                <View style={styles.foodHeader}>
                  <Text
                    style={styles.dishName}
                    numberOfLines={1}
                  >
                    {item.dish_name ||
                      'Unnamed dish'}
                  </Text>

                  <Text style={styles.price}>
                    ₦
                    {Number(
                      item.price || 0
                    ).toLocaleString()}
                  </Text>
                </View>

                <Text style={styles.seller}>
                  Seller:{' '}
                  {item.seller_name ||
                    'Unknown'}
                </Text>

                {item.description ? (
                  <Text style={styles.description}>
                    {item.description}
                  </Text>
                ) : null}

                {item.category ? (
                  <View style={styles.categoryTag}>
                    <Text
                      style={styles.categoryTagText}
                    >
                      {item.category}
                    </Text>
                  </View>
                ) : null}

                {/* Order button */}
                {!isOwner && item.user_id && (
                  <TouchableOpacity
                    style={styles.orderButton}
                    onPress={() =>
                      handleOrder(item)
                    }
                    disabled={isOrdering}
                  >
                    {isOrdering ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text
                        style={
                          styles.orderButtonText
                        }
                      >
                        Order Food
                      </Text>
                    )}
                  </TouchableOpacity>
                )}

                {/* Owner controls */}
                {isOwner && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() =>
                        handleEdit(item.id)
                      }
                    >
                      <Text style={styles.buttonText}>
                        Edit
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() =>
                        handleDelete(item.id)
                      }
                    >
                      <Text style={styles.buttonText}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>
              🍽️
            </Text>

            <Text style={styles.emptyTitle}>
              No food here yet
            </Text>

            <Text style={styles.emptyText}>
              Try another category or post
              something delicious.
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
    marginBottom: 12,
  },

  categoryList: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    gap: 10,
  },

  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },

  categoryButtonSelected: {
    backgroundColor: '#208AEF',
    borderColor: '#208AEF',
  },

  categoryIcon: {
    fontSize: 17,
    marginRight: 5,
  },

  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },

  categoryTextSelected: {
    color: '#fff',
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

  noImageText: {
    fontSize: 40,
  },

  cardContent: {
    padding: 15,
  },

  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },

  dishName: {
    flex: 1,
    fontSize: 21,
    fontWeight: 'bold',
  },

  price: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  seller: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
  },

  description: {
    fontSize: 15,
    lineHeight: 21,
    marginTop: 8,
  },

  categoryTag: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#f1f1f1',
  },

  categoryTagText: {
    fontSize: 12,
    fontWeight: '600',
  },

  orderButton: {
    marginTop: 15,
    paddingVertical: 13,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#208AEF',
  },

  orderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  actions: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },

  editButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#208AEF',
  },

  deleteButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#D32F2F',
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
  },

  empty: {
    alignItems: 'center',
    padding: 30,
  },

  emptyEmoji: {
    fontSize: 40,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },

  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#777',
  },
});