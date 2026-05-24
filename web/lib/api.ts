import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── REQUEST INTERCEPTOR: attach access token ──
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('reverie_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── RESPONSE INTERCEPTOR: silent refresh on 401 ──
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown, token?: string) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token!));
  failedQueue = [];
};

api.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry && original.url !== '/auth/refresh') {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh');
        const newToken = data.data.accessToken;
        localStorage.setItem('reverie_access_token', newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr);
        localStorage.removeItem('reverie_access_token');
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// ── TYPED API HELPERS ──
export const authApi = {
  signup:           (d: object) => api.post('/auth/signup', d),
  login:            (d: object) => api.post('/auth/login', d),
  logout:           ()          => api.post('/auth/logout'),
  refresh:          ()          => api.post('/auth/refresh'),
  forgotPassword:   (d: object) => api.post('/auth/forgot-password', d),
  resetPassword:    (d: object) => api.post('/auth/reset-password', d),
  me:               ()          => api.get('/auth/me'),
  onboarding:       ()          => api.post('/auth/onboarding'),
};

export const journalApi = {
  list:     (p?: object) => api.get('/journal', { params: p }),
  get:      (id: string) => api.get(`/journal/${id}`),
  create:   (d: object)  => api.post('/journal', d),
  update:   (id: string, d: object) => api.put(`/journal/${id}`, d),
  delete:   (id: string) => api.delete(`/journal/${id}`),
  stats:    ()           => api.get('/journal/stats'),
  calendar: (y: number, m: number) => api.get(`/journal/calendar/${y}/${m}`),
};

export const reflectionApi = {
  list:     (p?: object) => api.get('/reflection', { params: p }),
  latest:   ()           => api.get('/reflection/latest'),
  get:      (id: string) => api.get(`/reflection/${id}`),
  generate: ()           => api.post('/reflection/generate'),
};

export const capsuleApi = {
  list:   ()             => api.get('/capsules'),
  get:    (id: string)   => api.get(`/capsules/${id}`),
  create: (d: object)    => api.post('/capsules', d),
  delete: (id: string)   => api.delete(`/capsules/${id}`),
};

export const uploadApi = {
  image:  (form: FormData) => api.post('/upload/image', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (publicId: string) => api.delete(`/upload/${encodeURIComponent(publicId)}`),
};

export const userApi = {
  updateProfile: (d: object)  => api.put('/user/profile', d),
  export:        ()            => api.get('/user/export'),
  deleteAccount: ()            => api.delete('/user/account'),
};

export const searchApi = {
  search: (p: object) => api.get('/search', { params: p }),
};
