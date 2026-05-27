import * as ImagePicker from 'expo-image-picker';
import { uploadApi } from '../../lib/api';

export async function handleImagePickAndUpload() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission to access camera roll is required.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.7,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    const selectedAsset = result.assets[0];
    
    const response = await uploadApi.image(
      selectedAsset.uri, 
      selectedAsset.fileName || `upload-${Date.now()}.jpg`
    );
    
    return response.data;
  }
  
  return null;
}