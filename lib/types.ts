export interface I18nName { ru: string; uz?: string; en?: string }

export interface PartCategory {
  _id: string;
  name: I18nName;
  slug: string;
  icon: string;
  order: number;
}

export interface PartType {
  _id: string;
  name: string;
  slug: string;
  categoryId: string;
  subcategory: string | null;
  synonyms: string[];
}

export interface Synonym {
  _id: string;
  canonical: string;
  aliases: string[];
  ambiguous: boolean;
  note?: string;
  partTypeId?: string | null;
}

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  country: string;
  popular: boolean;
  order: number;
}

export interface City {
  _id: string;
  name: I18nName;
  slug: string;
  region: string;
  order: number;
}

export type Condition = 'new' | 'used' | 'contract' | 'original' | 'duplicate';
export type ListingStatus = 'draft' | 'pending' | 'active' | 'sold' | 'rejected' | 'archived';

export interface Listing {
  _id: string;
  title: string;
  description: string;
  oemNumbers: string[];
  condition: Condition;
  manufacturer: string;
  price: { amount: number; currency: string };
  photos: string[];
  city: string;
  status: ListingStatus;
  rejectionReason?: string;
  views: number;
  createdAt: string;
  partTypeId?: { _id: string; name: string; slug: string };
  sellerId?: { _id: string; name: string; phone: string };
}

export type Role = 'buyer' | 'seller' | 'admin' | 'superadmin';

export interface User {
  _id: string;
  phone: string;
  name: string;
  role: Role;
  sellerProfile?: { shopName: string; city: string; verified: boolean };
  blocked?: boolean;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface Analytics {
  users: { total: number; sellers: number };
  listings: { total: number; byStatus: Record<string, number> };
  topCategories: { category: I18nName; slug: string; count: number }[];
}

export interface CarModel {
  _id: string;
  brandId: string;
  name: string;
  slug: string;
  popular: boolean;
}

export interface Generation {
  _id: string;
  modelId: string;
  name: string;
  yearFrom?: number;
  yearTo?: number;
  bodyType: string;
  image?: string;
}

export type FuelType = 'petrol' | 'diesel' | 'hybrid' | 'electric' | 'gas';
export interface Engine {
  _id: string;
  generationId: string;
  name: string;
  volume?: number;
  fuelType: FuelType;
  power?: number;
}

// Admin ro'yxatida kategoriya populate qilingan holda keladi
export interface PartTypeAdmin {
  _id: string;
  name: string;
  slug: string;
  subcategory: string | null;
  synonyms: string[];
  categoryId: { _id: string; name: I18nName; slug: string } | null;
}

export interface AdminReport {
  _id: string;
  reason: string;
  comment: string;
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
  resolution: string;
  createdAt: string;
  reporterId: { _id: string; name: string; phone: string } | null;
  listingId: { _id: string; title: string; status: string; sellerId: string } | null;
}
