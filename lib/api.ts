import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { auth } from './auth';
import type {
  Analytics, Brand, CarModel, City, Engine, Generation, Listing,
  Paginated, PartCategory, PartTypeAdmin, AdminReport, Synonym, User,
  ImportAnalysis, ImportBatch, ImportColumns, ImportDefaults, ImportItem, ImportReference,
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
  login: (phone: string, password: string) =>
    http.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', { phone, password }).then((r) => r.data),
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
  // Admin uchun BARCHA kategoriyalar (level 1 + 2, populate qilingan parentId)
  adminCategories: (params?: Record<string, unknown>) =>
    http.get<{ items: PartCategory[] }>('/admin/categories', { params }).then((r) => r.data.items),
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
    http
      .post<{ sent: number; registeredUsers: number; guestDevices: number }>('/admin/notifications/broadcast', body)
      .then((r) => r.data),

  // ---------- Excel import ----------
  // Faylni tahlil qilish (bazaga yozilmaydi)
  importAnalyze: (
    file: File,
    opts?: { sheet?: string; dataStart?: number; columns?: Partial<ImportColumns>; currency?: string }
  ) => {
    const form = new FormData();
    form.append('file', file);
    if (opts?.sheet) form.append('sheet', opts.sheet);
    if (opts?.dataStart !== undefined) form.append('dataStart', String(opts.dataStart));
    if (opts?.columns) form.append('columns', JSON.stringify(opts.columns));
    if (opts?.currency) form.append('currency', opts.currency);
    return http
      .post<ImportAnalysis>('/admin/import/analyze', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  // Tasdiqlangan qatorlarni bazaga yozish
  importCommit: (body: {
    sellerId: string;
    fileName?: string;
    sheet?: string;
    columns?: Partial<ImportColumns>;
    defaults: ImportDefaults;
    items: ImportItem[];
    note?: string;
  }) =>
    http
      .post<{ batchId: string; created: number; skipped: { row: number; reason: string }[]; skippedTotal: number }>(
        '/admin/import/commit',
        body
      )
      .then((r) => r.data),

  // Qatorni qo'lda tuzatish uchun to'liq ro'yxatlar
  importReference: () => http.get<ImportReference>('/admin/import/reference').then((r) => r.data),

  // Partiyalar tarixi
  importBatches: (params: Record<string, unknown>) =>
    http.get<Paginated<ImportBatch>>('/admin/import/batches', { params }).then((r) => r.data),

  // Partiyani butunlay qaytarib olish
  importRollback: (id: string) =>
    http.delete<{ ok: boolean; deleted: number }>(`/admin/import/batches/${id}`).then((r) => r.data),
};
