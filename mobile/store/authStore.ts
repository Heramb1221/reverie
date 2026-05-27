import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  email: string;
  onboardingComplete: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  hydrated: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

const isWeb = Platform.OS === 'web';

const setStorageItem = async (key: string, value: string) => {
  if (isWeb) {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const getStorageItem = async (key: string): Promise<string | null> => {
  if (isWeb) {
    return await AsyncStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

const removeStorageItem = async (key: string) => {
  if (isWeb) {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  hydrated: false,

  login: async (user, accessToken, refreshToken) => {
    try {
      await setStorageItem('access_token', accessToken);
      await setStorageItem('refresh_token', refreshToken);
      await setStorageItem('user_session', JSON.stringify(user));
      set({ user, token: accessToken });
    } catch (e) {
      console.error('Failed to store auth session securely:', e);
    }
  },

  logout: async () => {
    try {
      await removeStorageItem('access_token');
      await removeStorageItem('refresh_token');
      await removeStorageItem('user_session');
      set({ user: null, token: null });
    } catch (e) {
      console.error('Failed to clear secure store:', e);
    }
  },

  hydrate: async () => {
    try {
      const accessToken = await getStorageItem('access_token');
      const userSession = await getStorageItem('user_session');

      if (accessToken && userSession) {
        set({ token: accessToken, user: JSON.parse(userSession) });
      }
    } catch (e) {
      console.error('Failed to restore secure auth state:', e);
    } finally {
      set({ hydrated: true });
    }
  },
}));