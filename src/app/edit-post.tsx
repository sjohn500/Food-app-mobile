import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { supabase } from '@/lib/supabase';

const categories = [
  'Local Food',
  'Foreign Food',
  'Fruit',
  'Snack',
];

export default function EditPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [sellerName, setSellerName] = useState('');
  const [dishName, setDishName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    if (!id) {
      Alert.alert('Error', 'Post ID is missing.');
      router.back();
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(
          'Login required',
          'Please log in to edit your food.'
        );
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase
        .from('post')
        .select(
          'seller_name, dish_name, price, description, category'
        )
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) {
        throw error;
      }

      setSellerName(data.seller_name || '');
      setDishName(data.dish_name || '');
      setPrice(String(data.price || ''));
      setDescription(data.description || '');
      setCategory(data.category || '');
    } catch (error) {
      console.log('LOAD EDIT POST ERROR:', error);

      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Could not load this post.'
      );

      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!id) {
      Alert.alert('Error', 'Post ID is missing.');
      return;
    }

    if (
      !sellerName.trim() ||
      !dishName.trim() ||
      !price.trim() ||
      !category
    ) {
      Alert.alert(
        'Missing information',
        'Please fill in the seller name, dish name, price, and category.'
      );
      return;
    }

    const numericPrice = Number(
      price.replace(/,/g, '').trim()
    );

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      Alert.alert(
        'Invalid price',
        'Please enter a valid price.'
      );
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(
          'Login required',
          'Please log in to edit your food.'
        );

        router.replace('/login');
        return;
      }

      const { error } = await supabase
        .from('post')
        .update({
          seller_name: sellerName.trim(),
          dish_name: dishName.trim(),
          price: numericPrice,
          description: description.trim(),
          category: category,
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      Alert.alert(
        'Updated',
        'Your food post has been updated.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.log('UPDATE POST ERROR:', error);

      Alert.alert(
        'Update failed',
        error instanceof Error
          ? error.message
          : 'Could not update the post.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Loading post...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
        >
          <Text style={styles.backButton}>
            ← Back
          </Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          Edit Food
        </Text>

        <View style={styles.headerSpace} />
      </View>

      <Text style={styles.label}>
        Seller Name
      </Text>

      <TextInput
        style={styles.input}
        value={sellerName}
        onChangeText={setSellerName}
        placeholder="Seller name"
      />

      <Text style={styles.label}>
        Dish Name
      </Text>

      <TextInput
        style={styles.input}
        value={dishName}
        onChangeText={setDishName}
        placeholder="Dish name"
      />

      <Text style={styles.label}>
        Category
      </Text>

      <View style={styles.categoryContainer}>
        {categories.map((item) => {
          const selected = category === item;

          return (
            <TouchableOpacity
              key={item}
              style={[
                styles.categoryButton,
                selected &&
                  styles.categoryButtonSelected,
              ]}
              onPress={() => setCategory(item)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selected &&
                    styles.categoryTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>
        Price
      </Text>

      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        placeholder="Price"
        keyboardType="numeric"
      />

      <Text style={styles.label}>
        Description
      </Text>

      <TextInput
        style={[
          styles.input,
          styles.descriptionInput,
        ]}
        value={description}
        onChangeText={setDescription}
        placeholder="Description"
        multiline
      />

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleUpdate}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>
            Save Changes
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F7F5',
  },

  container: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F5',
  },

  loadingText: {
    marginTop: 12,
    color: '#666666',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },

  backButton: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111111',
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111111',
  },

  headerSpace: {
    width: 50,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 8,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    marginBottom: 20,
  },

  descriptionInput: {
    height: 110,
    textAlignVertical: 'top',
  },

  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },

  categoryButton: {
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  categoryButtonSelected: {
    backgroundColor: '#111111',
    borderColor: '#111111',
  },

  categoryText: {
    color: '#444444',
    fontSize: 13,
    fontWeight: '600',
  },

  categoryTextSelected: {
    color: '#FFFFFF',
  },

  saveButton: {
    height: 52,
    backgroundColor: '#111111',
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});