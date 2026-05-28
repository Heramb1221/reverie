import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  theme: 'light' | 'dark';
  onboardingComplete: boolean;
  notificationsEnabled: boolean;
  reminderFrequency: 'daily' | 'every3days' | 'weekly';
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  login: (user: User, access: string, refresh: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  updateUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  hydrated: false,

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const raw   = await SecureStore.getItemAsync('user_data');
      if (token && raw) {
        const user = JSON.parse(raw) as User;
        set({ user, isAuthenticated: true, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  login: async (user, access, refresh) => {
    await SecureStore.setItemAsync('access_token',  access);
    await SecureStore.setItemAsync('refresh_token', refresh);
    await SecureStore.setItemAsync('user_data',     JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('user_data');
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),

  updateUser: (partial) => {
    const current = get().user;
    if (!current) return;
    const next = { ...current, ...partial };
    SecureStore.setItemAsync('user_data', JSON.stringify(next)).catch(() => {});
    set({ user: next });
  },
}));
