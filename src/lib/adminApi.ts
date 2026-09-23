import { api } from './api';
import { authHeader, refreshTokens, clearTokens } from './authApi';
import type { HeritageSite } from './api';

/**
 * Wrapper that retries once with a refreshed token if a 401 happens.
 */
async function authed<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    if (err?.response?.status === 401) {
      try {
        await refreshTokens();
        return await fn();
      } catch {
        clearTokens();
        throw err;
      }
    }
    throw err;
  }
}

// ---------- Users ----------

export interface UserRecord {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phone: string | null;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export async function adminListUsers() {
  return authed(async () => {
    const { data } = await api.get('/auth/users', { headers: authHeader() });
    return data.data as UserRecord[];
  });
}

export async function adminCreateUser(payload: {
  email: string;
  username: string;
  password: string;
  fullName: string;
  phone?: string | null;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';
}) {
  return authed(async () => {
    const { data } = await api.post('/auth/register', payload, {
      headers: authHeader(),
    });
    return data.data as UserRecord;
  });
}

export async function adminUpdateUser(
  id: string,
  payload: Partial<Pick<UserRecord, 'fullName' | 'phone' | 'role' | 'isActive'>>
) {
  return authed(async () => {
    const { data } = await api.put(`/auth/users/${id}`, payload, {
      headers: authHeader(),
    });
    return data.data as UserRecord;
  });
}

export async function adminDeleteUser(id: string) {
  return authed(async () => {
    await api.delete(`/auth/users/${id}`, { headers: authHeader() });
  });
}

// ---------- Sites ----------

export async function adminCreateSite(payload: Partial<HeritageSite>) {
  return authed(async () => {
    const { data } = await api.post('/sites', payload, { headers: authHeader() });
    return data.data as HeritageSite;
  });
}

export async function adminUpdateSite(id: string, payload: Partial<HeritageSite>) {
  return authed(async () => {
    const { data } = await api.put(`/sites/${id}`, payload, { headers: authHeader() });
    return data.data as HeritageSite;
  });
}

export async function adminDeleteSite(id: string) {
  return authed(async () => {
    await api.delete(`/sites/${id}`, { headers: authHeader() });
  });
}

// ---------- Routes ----------

export async function adminCreateRoute(payload: {
  slug: string;
  name: string;
  description: string;
  type: 'WALKING' | 'CYCLING' | 'DRIVING';
  estimatedMinutes: number;
  distanceKm: number;
  siteIds: string[];
}) {
  return authed(async () => {
    const { data } = await api.post('/routes', payload, { headers: authHeader() });
    return data.data;
  });
}

export async function adminUpdateRoute(
  id: string,
  payload: Partial<{
    slug: string;
    name: string;
    description: string;
    type: 'WALKING' | 'CYCLING' | 'DRIVING';
    estimatedMinutes: number;
    distanceKm: number;
    siteIds: string[];
  }>
) {
  return authed(async () => {
    const { data } = await api.put(`/routes/${id}`, payload, { headers: authHeader() });
    return data.data;
  });
}

export async function adminDeleteRoute(id: string) {
  return authed(async () => {
    await api.delete(`/routes/${id}`, { headers: authHeader() });
  });
}