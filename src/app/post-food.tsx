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
import * as ImagePicker from 'expo-image-picker';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cawultvpqgetqtctgvud.supabase.co',
  'sb_publishable_NuMW6LcXU5WFgOpse8topQ_r1LwAJAQ'
);

export default function PostFoodScreen() {
  const [sellerName, setSellerName] = useState('');
  const [dishName, setDishName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'We need access to your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const fileExt = uri.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('food-photos')
      .upload(fileName, blob, {
        contentType: `image/${fileExt}`,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('food-photos')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!sellerName || !dishName || !price || !imageUri) {
      Alert.alert('Missing info', 'Please fill in all fields and add a photo.');
      return;
    }

    setUploading(true);
    try {
      const photoUrl = await uploadImage(imageUri);

      const { error } = await supabase.from('post').insert({
        seller_name: sellerName,
        dish_name: dishName,
        price: parseFloat(price),
        description: description,
        photo_url: photoUrl,
      });

      if (error) throw error;

      Alert.alert('Success', 'Your food post is live!');
      setSellerName('');
      setDishName('');
      setPrice('');
      setDescription('');
      setImageUri(null);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Post Your Food</Text>

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
        style={[styles.input, { height: 80 }]}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Button title="Pick a Photo" onPress={pickImage} />
      {imageUri && (
        <Image source={{ uri: imageUri }} style={styles.preview} />
      )}

      {uploading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <Button title="Post Food" onPress={handleSubmit} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  preview: {
    width: '100%',
    height: 200,
    marginVertical: 12,
    borderRadius: 8,
  },
});