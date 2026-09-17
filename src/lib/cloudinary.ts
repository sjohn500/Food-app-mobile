import { fetch } from 'expo/fetch';
import { File } from 'expo-file-system';

const CLOUD_NAME = 'odwy8nj5';
const UPLOAD_PRESET = 'food_app';

export const uploadImage = async (imageUri: string): Promise<string> => {
  const file = new File(imageUri);

  const formData = new FormData();

  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary upload failed: ${errorText}`);
  }

  const result = await response.json();

  return result.secure_url;
};