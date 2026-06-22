import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { auth } from './auth';
import type {
  Analytics, Brand, CarModel, City, Engine, Generation, Listing,
  Paginated, PartCategory, PartTypeAdmin, AdminReport, Synonym, User,
} from './types';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';


export const http = axios.create({ baseURL });

// Access tokenni qo'shish
http.interceptors.request.use((config) => {
  const token = auth.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 da bir marta refresh qilib, qaytadan urinish
let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const refreshToken = auth.getRefresh();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
    auth.setTokens(data.accessToken, data.refreshToken);
    return data.accessToken as string;
  } catch {
    auth.clear();
    return null;
  }
}

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      if (!refreshing) refreshing = doRefresh().finally(() => { refreshing = null; });
      const newToken = await refreshing;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return http(original);
      }
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Xato xabarini chiqarish
export function errMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    return (e.response?.data as { error?: string })?.error || e.message;
  }
  return e instanceof Error ? e.message : 'Xatolik';
}

// ---------- API methodlari ----------
export const api = {
  // Auth
  sendOtp: (phone: string) =>
    http.post<{ ok: boolean; devCode?: string }>('/auth/send-otp', { phone }).then((r) => r.data),
  verifyOtp: (phone: string, code: string) =>
    http.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/verify-otp', { phone, code }).then((r) => r.data),
  me: () => http.get<{ user: User }>('/auth/me').then((r) => r.data.user),

  // Analitika
  analytics: () => http.get<Analytics>('/admin/analytics').then((r) => r.data),

  // E'lonlar (moderatsiya)
  listings: (params: Record<string, unknown>) =>
    http.get<Paginated<Listing>>('/admin/listings', { params }).then((r) => r.data),
  moderate: (id: string, action: 'approve' | 'reject', reason?: string) =>
    http.patch<{ listing: Listing }>(`/admin/listings/${id}/moderate`, { action, reason }).then((r) => r.data.listing),

  // Foydalanuvchilar
  users: (params: Record<string, unknown>) =>
    http.get<Paginated<User>>('/admin/users', { params }).then((r) => r.data),
  updateUser: (id: string, body: Partial<{ role: string; verified: boolean; blocked: boolean }>) =>
    http.patch<{ user: User }>(`/admin/users/${id}`, body).then((r) => r.data.user),

  // Katalog — o'qish (ochiq endpointlar)
  categories: () => http.get<{ categories: PartCategory[] }>('/catalog/categories').then((r) => r.data.categories),
  brands: () => http.get<{ brands: Brand[] }>('/catalog/brands').then((r) => r.data.brands),
  cities: () => http.get<{ cities: City[] }>('/catalog/cities').then((r) => r.data.cities),

  // Katalog — yozish (admin CRUD)
  create: <T,>(resource: string, body: unknown) =>
    http.post<{ item: T }>(`/admin/${resource}`, body).then((r) => r.data.item),
  update: <T,>(resource: string, id: string, body: unknown) =>
    http.patch<{ item: T }>(`/admin/${resource}/${id}`, body).then((r) => r.data.item),
  remove: (resource: string, id: string) =>
    http.delete(`/admin/${resource}/${id}`).then((r) => r.data),

  // Admin ro'yxatlari (paginatsiyali)
  adminSynonyms: (params: Record<string, unknown>) =>
    http.get<Paginated<Synonym>>('/admin/synonyms', { params }).then((r) => r.data),
  adminPartTypes: (params: Record<string, unknown>) =>
    http.get<Paginated<PartTypeAdmin>>('/admin/part-types', { params }).then((r) => r.data),

  // Mashina ierarxiyasi (ochiq read endpointlar)
  brandModels: (brandId: string) =>
    http.get<{ models: CarModel[] }>(`/catalog/brands/${brandId}/models`).then((r) => r.data.models),
  modelGenerations: (modelId: string) =>
    http.get<{ generations: Generation[] }>(`/catalog/models/${modelId}/generations`).then((r) => r.data.generations),
  generationEngines: (generationId: string) =>
    http.get<{ engines: Engine[] }>(`/catalog/generations/${generationId}/engines`).then((r) => r.data.engines),

  // Shikoyatlar
  adminReports: (params: Record<string, unknown>) =>
    http.get<Paginated<AdminReport>>('/admin/reports', { params }).then((r) => r.data),
  resolveReport: (id: string, action: 'dismiss' | 'resolve' | 'reject_listing') =>
    http.patch(`/admin/reports/${id}`, { action }).then((r) => r.data),

  // Push broadcast
  broadcastNotification: (body: { title: string; body: string; role?: string }) =>
    http.post<{ sent: number; users: number }>('/admin/notifications/broadcast', body).then((r) => r.data),
};
