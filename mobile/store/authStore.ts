import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  theme: 'light' | 'dark';
  onboardingComplete: boolean;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hydrated: boolean;
  login:  (user: User, access: string, refresh: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  updateUser: (partial: Partial<User>) => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user:            null,
  isAuthenticated: false,
  isLoading:       false,
  hydrated:        false,

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      const raw   = await SecureStore.getItemAsync('user');
      if (token && raw) {
        const user = JSON.parse(raw);
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
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    await SecureStore.deleteItemAsync('user');
    set({ user: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),

  updateUser: (partial) => {
    const next = get().user ? { ...get().user!, ...partial } : null;
    if (next) {
      SecureStore.setItemAsync('user', JSON.stringify(next)).catch(() => {});
      set({ user: next });
    }
  },
}));
