import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';;

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Mobile-Client': '1',
  },
  timeout: 15000,
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let queue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

const processQueue = (err: unknown, token?: string) => {
  queue.forEach(p => err ? p.reject(err) : p.resolve(token!));
  queue = [];
};

api.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const orig = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !orig._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => queue.push({ resolve, reject }))
          .then(token => { 
            if (orig.headers) orig.headers.Authorization = `Bearer ${token}`; 
            return api(orig); 
          });
      }
      orig._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refresh_token');
        const { data } = await api.post('/auth/refresh', { refreshToken });
        const newAccess  = data.data.accessToken;
        const newRefresh = data.data.refreshToken;
        await SecureStore.setItemAsync('access_token',  newAccess);
        await SecureStore.setItemAsync('refresh_token', newRefresh);
        processQueue(null, newAccess);
        if (orig.headers) orig.headers.Authorization = `Bearer ${newAccess}`;
        return api(orig);
      } catch (e) {
        processQueue(e);
        await SecureStore.deleteItemAsync('access_token');
        await SecureStore.deleteItemAsync('refresh_token');
        return Promise.reject(e);
      } finally { isRefreshing = false; }
    }
    return Promise.reject(error);
  }
);

// Type Safety Payload Layouts
export interface JournalPayload {
  title: string;
  content: string;
  mood: string;
  images?: Array<{ url: string; publicId: string }>;
}

export interface CapsulePayload {
  title: string;
  content: string;
  mood: string;
  unlockDate: string;
  images?: Array<{ url: string; publicId: string }>;
  encryptedSessionKey?: string;
  iv?: string;
}

export const authApi = {
  signup:         (d: Record<string, unknown>) => api.post('/auth/signup', d),
  login:          (d: Record<string, unknown>) => api.post('/auth/login', d),
  logout:         ()                           => api.post('/auth/logout'),
  refresh:        (d: { refreshToken: string }) => api.post('/auth/refresh', d),
  forgotPassword: (d: { email: string })       => api.post('/auth/forgot-password', d),
  me:             ()                           => api.get('/auth/me'),
  onboarding:     ()                           => api.post('/auth/onboarding'),
};

export const journalApi = {
  list:     (p?: Record<string, unknown>) => api.get('/journal', { params: p }),
  get:      (id: string)                  => api.get(`/journal/${id}`),
  create:   (d: JournalPayload)           => api.post('/journal', d),
  update:   (id: string, d: Partial<JournalPayload>) => api.put(`/journal/${id}`, d),
  delete:   (id: string)                  => api.delete(`/journal/${id}`),
  stats:    ()                            => api.get('/journal/stats'),
  calendar: (y: number, m: number)        => api.get(`/journal/calendar/${y}/${m}`),
};

export const reflectionApi = {
  latest:   () => api.get('/reflection/latest'),
  list:     (p?: { page?: number; limit?: number }) => api.get('/reflection', { params: p }),
  generate: () => api.post('/reflection/generate'),
};

export const capsuleApi = {
  list:   (p?: { page?: number; limit?: number }) => api.get('/capsules', { params: p }),
  get:    (id: string)                            => api.get(`/capsules/${id}`),
  create: (d: CapsulePayload)                     => api.post('/capsules', d),
  delete: (id: string)                            => api.delete(`/capsules/${id}`),
};

export const uploadApi = {
  image: (fileUri: string, fileName: string) => {
    const form = new FormData();
    form.append('image', {
      uri: fileUri,
      type: 'image/jpeg',
      name: fileName || 'upload.jpg',
    } as any);
    return api.post('/upload/image', form, { 
      headers: { 'Content-Type': 'multipart/form-data' } 
    });
  },
};

export const searchApi = {
  search: (p: { keyword?: string; mood?: string; startDate?: string; endDate?: string }) => 
    api.get('/search', { params: p }),
};