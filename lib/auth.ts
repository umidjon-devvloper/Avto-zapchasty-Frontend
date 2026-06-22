import type { User } from './types';

const ACCESS = 'ap_access';
const REFRESH = 'ap_refresh';
const USER = 'ap_user';

const isBrowser = typeof window !== 'undefined';

export const auth = {
  getAccess: () => (isBrowser ? localStorage.getItem(ACCESS) : null),
  getRefresh: () => (isBrowser ? localStorage.getItem(REFRESH) : null),
  getUser: (): User | null => {
    if (!isBrowser) return null;
    const raw = localStorage.getItem(USER);
    return raw ? (JSON.parse(raw) as User) : null;
  },
  setSession: (accessToken: string, refreshToken: string, user: User) => {
    if (!isBrowser) return;
    localStorage.setItem(ACCESS, accessToken);
    localStorage.setItem(REFRESH, refreshToken);
    localStorage.setItem(USER, JSON.stringify(user));
  },
  setTokens: (accessToken: string, refreshToken: string) => {
    if (!isBrowser) return;
    localStorage.setItem(ACCESS, accessToken);
    localStorage.setItem(REFRESH, refreshToken);
  },
  clear: () => {
    if (!isBrowser) return;
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    localStorage.removeItem(USER);
  },
  isAdmin: (): boolean => {
    const u = auth.getUser();
    return !!u && (u.role === 'admin' || u.role === 'superadmin');
  },
};
