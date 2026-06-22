import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Narxni formatlash (UZS)
export function formatPrice(amount: number, currency = 'UZS') {
  return new Intl.NumberFormat('ru-RU').format(amount) + ' ' + currency;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export const CONDITION_LABELS: Record<string, string> = {
  new: 'Yangi',
  used: "B/u",
  contract: 'Kontrakt',
  original: 'Original',
  duplicate: 'Dublikat',
};

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Qoralama',
  pending: 'Kutilmoqda',
  active: 'Faol',
  sold: 'Sotilgan',
  rejected: 'Rad etilgan',
  archived: 'Arxiv',
};

export const ROLE_LABELS: Record<string, string> = {
  buyer: 'Xaridor',
  seller: 'Sotuvchi',
  admin: 'Admin',
  superadmin: 'Super admin',
};
