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
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/cloudinary';

export default function PostFoodScreen() {
  const [sellerName, setSellerName] = useState('');
  const [dishName, setDishName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async (): Promise<void> => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'We need access to your photos.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (
      !sellerName.trim() ||
      !dishName.trim() ||
      !price.trim() ||
      !imageUri
    ) {
      Alert.alert(
        'Missing info',
        'Please fill in all fields and add a photo.'
      );
      return;
    }

    // Convert the price to a number.
    const numericPrice = Number(
      price.replace(/,/g, '').trim()
    );

    // Check that the price is valid.
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      Alert.alert(
        'Invalid price',
        'Please enter a valid price, for example 1500.'
      );
      return;
    }

    setUploading(true);

    try {
      // Upload image to Cloudinary.
      const photoUrl = await uploadImage(imageUri);

      // Save food information in Supabase.
      const { error } = await supabase
        .from('post')
        .insert({
          seller_name: sellerName.trim(),
          dish_name: dishName.trim(),
          price: numericPrice,
          description: description.trim(),
          photo_url: photoUrl,
        });

      if (error) {
        throw error;
      }

      Alert.alert(
        'Success',
        `Your food post is live at ₦${numericPrice.toLocaleString('en-NG')}!`,
        [
          {
            text: 'View Food',
            onPress: () => router.push('/explore'),
          },
        ]
      );

      // Clear the form.
      setSellerName('');
      setDishName('');
      setPrice('');
      setDescription('');
      setImageUri(null);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Something went wrong';

      Alert.alert('Error', message);
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

      <TextInput
        style={styles.input}
        placeholder="Price (₦)"
        value={price}
        onChangeText={setPrice}
        keyboardType="numeric"
      />

      <TextInput
        style={[styles.input, styles.descriptionInput]}
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
  },

  descriptionInput: {
    height: 80,
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