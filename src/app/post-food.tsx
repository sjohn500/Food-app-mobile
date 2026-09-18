import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Image,
  Alert,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/cloudinary';

const categories = [
  'Local Food',
  'Foreign Food',
  'Fruit',
  'Snack',
];

export default function PostFoodScreen() {
  const [sellerName, setSellerName] = useState('');
  const [dishName, setDishName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'We need access to your photos.'
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    // 1. Validate form
    if (
      !sellerName.trim() ||
      !dishName.trim() ||
      !price.trim() ||
      !category ||
      !imageUri
    ) {
      Alert.alert(
        'Missing information',
        'Please fill in all fields, choose a category, and add a photo.'
      );
      return;
    }

    // 2. Validate price
    const numericPrice = Number(
      price.replace(/,/g, '').trim()
    );

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      Alert.alert(
        'Invalid price',
        'Please enter a valid price, for example 1500.'
      );
      return;
    }

    setUploading(true);

    try {
      // 3. Get the current Supabase session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      console.log('SESSION:', session);
      console.log('SESSION ERROR:', sessionError);

      if (sessionError) {
        throw sessionError;
      }

      // 4. Make sure the user is logged in
      if (!session?.user) {
        Alert.alert(
          'Login required',
          'You must sign in before you can post food.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Login',
              onPress: () => router.push('/login'),
            },
          ]
        );

        return;
      }

      const user = session.user;

      console.log('USER ID:', user.id);
      console.log('CATEGORY:', category);

      // 5. Upload image to Cloudinary
      const photoUrl = await uploadImage(imageUri);

      console.log('PHOTO URL:', photoUrl);

      // 6. Save post to Supabase
      const { data, error } = await supabase
        .from('post')
        .insert({
          user_id: user.id,
          seller_name: sellerName.trim(),
          dish_name: dishName.trim(),
          price: numericPrice,
          description: description.trim(),
          photo_url: photoUrl,
          category: category,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('POST CREATED:', data);

      // 7. Success
      Alert.alert(
        'Success',
        'Your food post is live!',
        [
          {
            text: 'View Food',
            onPress: () => router.replace('/explore'),
          },
        ]
      );

      // 8. Clear form
      setSellerName('');
      setDishName('');
      setPrice('');
      setDescription('');
      setCategory('');
      setImageUri(null);

    } catch (error) {
      console.log('POST FOOD ERROR:', error);

      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Something went wrong while creating the post.'
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Post Your Food
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Seller Name"
        value={sellerName}
        onChangeText={setSellerName}
      />

      <TextInput
        style={styles.input}
        placeholder="Dish Name"
        value={dishName}
        onChangeText={setDishName}
      />

      <Text style={styles.label}>
        Choose Category
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

      <TextInput
        style={styles.input}
        placeholder="Price (₦)"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />

      <TextInput
        style={[
          styles.input,
          styles.descriptionInput,
        ]}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Button
        title="Pick a Photo"
        onPress={pickImage}
      />

      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={styles.preview}
        />
      )}

      {uploading ? (
        <ActivityIndicator
          size="large"
          style={styles.loader}
        />
      ) : (
        <Button
          title="Post Food"
          onPress={handleSubmit}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },

  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },

  categoryButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },

  categoryButtonSelected: {
    backgroundColor: '#208AEF',
    borderColor: '#208AEF',
  },

  categoryText: {
    fontSize: 14,
  },

  categoryTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },

  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },

  preview: {
    width: '100%',
    height: 200,
    marginVertical: 12,
    borderRadius: 8,
  },

  loader: {
    marginTop: 20,
  },
});