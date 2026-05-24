import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  theme: 'light' | 'dark';
  onboardingComplete: boolean;
  notificationsEnabled: boolean;
  reminderFrequency:
    | 'daily'
    | 'every3days'
    | 'weekly';
  publicKey?: string;
  encryptedPrivateKey?: string;
  encryptionSalt?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  hydrated: boolean;

  setHydrated: (v: boolean) => void;

  setUser: (user: User) => void;

  setAccessToken: (
    token: string
  ) => void;

  login: (
    user: User,
    token: string
  ) => void;

  logout: () => void;

  updateUser: (
    partial: Partial<User>
  ) => void;
}

export const useAuthStore =
  create<AuthState>()(
    persist(
      (set) => ({
        user: null,
        accessToken: null,
        isAuthenticated: false,

        hydrated: false,

        setHydrated: (v) =>
          set({ hydrated: v }),

        setUser: (user) =>
          set({
            user,
            isAuthenticated: true,
          }),

        setAccessToken: (token) => {
          if (
            typeof window !==
            'undefined'
          ) {
            localStorage.setItem(
              'reverie_access_token',
              token
            );
          }

          set({
            accessToken: token,
          });
        },

        login: (user, token) => {
          if (
            typeof window !==
            'undefined'
          ) {
            localStorage.setItem(
              'reverie_access_token',
              token
            );
          }

          set({
            user,
            accessToken: token,
            isAuthenticated: true,
          });
        },

        logout: () => {
          if (
            typeof window !==
            'undefined'
          ) {
            localStorage.removeItem(
              'reverie_access_token'
            );
          }

          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
          });
        },

        updateUser: (partial) =>
          set((state) => ({
            user: state.user
              ? {
                  ...state.user,
                  ...partial,
                }
              : null,
          })),
      }),
      {
        name: 'reverie-auth',

        partialize: (state) => ({
          user: state.user,
          accessToken:
            state.accessToken,
          isAuthenticated:
            state.isAuthenticated,
        }),

        onRehydrateStorage:
          () => (state) => {
            state?.setHydrated(
              true
            );
          },
      }
    )
  );