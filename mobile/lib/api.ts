import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { storage } from './storage';

// Fix: use Constants instead of process.env
const BASE_URL =
  'http://10.163.190.246:5000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,

  headers: {
    'Content-Type':
      'application/json',

    ...(Platform.OS !== 'web' && {
      'X-Mobile-Client': '1',
    }),
  },

  withCredentials: true,
  timeout: 15000,
});

// Separate refresh client
const refreshClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Attach access token
api.interceptors.request.use(
  async (
    config: InternalAxiosRequestConfig
  ) => {
    const token =
      await storage.getItem(
        'access_token'
      );

    if (token) {
      config.headers =
        config.headers ?? {};

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  }
);

// Silent refresh
let isRefreshing = false;

let failedQueue: Array<{
  resolve: (t: string) => void;
  reject: (e: unknown) => void;
}> = [];

const processQueue = (
  err: unknown,
  token?: string
) => {
  failedQueue.forEach((p) =>
    err
      ? p.reject(err)
      : p.resolve(token!)
  );

  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,

  async (error: AxiosError) => {
    const orig =
      error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

    if (
      error.response?.status === 401 &&
      !orig._retry
    ) {
      if (isRefreshing) {
        return new Promise(
          (resolve, reject) =>
            failedQueue.push({
              resolve,
              reject,
            })
        ).then((token) => {
          orig.headers =
            orig.headers ?? {};

          orig.headers.Authorization =
            `Bearer ${token}`;

          return api(orig);
        });
      }

      orig._retry = true;
      isRefreshing = true;

      try {
        const refreshToken =
          await storage.getItem(
            'refresh_token'
          );

        const { data } =
          await refreshClient.post(
            '/auth/refresh',
            { refreshToken }
          );

        const newAccess =
          data.data.accessToken as string;

        const newRefresh =
          data.data.refreshToken as string;

        await storage.setItem(
          'access_token',
          newAccess
        );

        await storage.setItem(
          'refresh_token',
          newRefresh
        );

        processQueue(
          null,
          newAccess
        );

        orig.headers =
          orig.headers ?? {};

        orig.headers.Authorization =
          `Bearer ${newAccess}`;

        return api(orig);
      } catch (e) {
        processQueue(e);

        await storage.removeItem(
          'access_token'
        );

        await storage.removeItem(
          'refresh_token'
        );

        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  signup: (d: object) =>
    api.post('/auth/signup', d),

  login: (d: object) =>
    api.post('/auth/login', d),

  logout: (d: object) =>
    api.post('/auth/logout', d),

  refresh: (d: object) =>
    api.post('/auth/refresh', d),

  forgotPassword: (
    d: object
  ) =>
    api.post(
      '/auth/forgot-password',
      d
    ),

  me: () =>
    api.get('/auth/me'),

  onboarding: () =>
    api.post('/auth/onboarding'),
};

export const journalApi = {
  list: (p?: object) =>
    api.get('/journal', {
      params: p,
    }),

  get: (id: string) =>
    api.get(
      `/journal/${id}`
    ),

  create: (d: object) =>
    api.post('/journal', d),

  update: (
    id: string,
    d: object
  ) =>
    api.put(
      `/journal/${id}`,
      d
    ),

  delete: (id: string) =>
    api.delete(
      `/journal/${id}`
    ),

  stats: () =>
    api.get(
      '/journal/stats'
    ),

  calendar: (
    y: number,
    m: number
  ) =>
    api.get(
      `/journal/calendar/${y}/${m}`
    ),
};

export const reflectionApi = {
  latest: () =>
    api.get(
      '/reflection/latest'
    ),

  list: () =>
    api.get('/reflection'),

  generate: () =>
    api.post(
      '/reflection/generate'
    ),

  get: (id: string) =>
    api.get(
      `/reflection/${id}`
    ),
};

export const capsuleApi = {
  list: () =>
    api.get('/capsules'),

  get: (id: string) =>
    api.get(
      `/capsules/${id}`
    ),

  create: (d: object) =>
    api.post('/capsules', d),

  delete: (id: string) =>
    api.delete(
      `/capsules/${id}`
    ),
};

export const uploadApi = {
  image: (form: FormData) =>
    api.post(
      '/upload/image',
      form,
      {
        headers: {
          'Content-Type':
            'multipart/form-data',
        },
      }
    ),
};

export const searchApi = {
  search: (p: object) =>
    api.get('/search', {
      params: p,
    }),
};

export const userApi = {
  updateProfile: (
    d: object
  ) =>
    api.put(
      '/user/profile',
      d
    ),

  export: () =>
    api.get('/user/export'),

  deleteAccount: () =>
    api.delete(
      '/user/account'
    ),
};
