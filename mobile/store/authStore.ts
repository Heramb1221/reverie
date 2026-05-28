import { create } from 'zustand';
import { storage } from '../lib/storage';

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

  login: (
    user: User,
    access: string,
    refresh: string
  ) => Promise<void>;

  logout: () => Promise<void>;

  setUser: (user: User) => void;

  updateUser: (
    partial: Partial<User>
  ) => void;
}

export const useAuthStore = create<AuthState>(
  (set, get) => ({
    user: null,

    isAuthenticated: false,

    hydrated: false,

    hydrate: async () => {
      try {
        const token =
          await storage.getItem(
            'access_token'
          );

        const raw =
          await storage.getItem(
            'user_data'
          );

        if (token && raw) {
          const user = JSON.parse(raw) as User;

          set({
            user,
            isAuthenticated: true,
            hydrated: true,
          });
        } else {
          set({
            hydrated: true,
          });
        }
      } catch (error) {
        console.log(
          'HYDRATE ERROR:',
          error
        );

        set({
          hydrated: true,
        });
      }
    },

    login: async (
      user,
      access,
      refresh
    ) => {
      await storage.setItem(
        'access_token',
        access
      );

      await storage.setItem(
        'refresh_token',
        refresh
      );

      await storage.setItem(
        'user_data',
        JSON.stringify(user)
      );

      set({
        user,
        isAuthenticated: true,
      });
    },

    logout: async () => {
      await storage.removeItem(
        'access_token'
      );

      await storage.removeItem(
        'refresh_token'
      );

      await storage.removeItem(
        'user_data'
      );

      set({
        user: null,
        isAuthenticated: false,
      });
    },

    setUser: (user) =>
      set({
        user,
      }),

    updateUser: (partial) => {
      const current = get().user;

      if (!current) return;

      const next = {
        ...current,
        ...partial,
      };

      storage
        .setItem(
          'user_data',
          JSON.stringify(next)
        )
        .catch(console.error);

      set({
        user: next,
      });
    },
  })
);
