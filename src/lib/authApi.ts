import { api } from './api';

export interface AuthUser {
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

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

const ACCESS_KEY = 'mth_access_token';
const REFRESH_KEY = 'mth_refresh_token';

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export async function login(identifier: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post('/auth/login', { identifier, password });
  const payload: LoginResponse = data.data;
  setTokens(payload.accessToken, payload.refreshToken);
  return payload;
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get('/auth/me', { headers: authHeader() });
  return data.data;
}

export async function refreshTokens(): Promise<{ accessToken: string; refreshToken: string }> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');
  const { data } = await api.post('/auth/refresh', { refreshToken });
  const tokens = data.data;
  setTokens(tokens.accessToken, tokens.refreshToken);
  return tokens;
}

export function logout() {
  clearTokens();
}

export function authHeader(): Record<string, string> {
  const t = getAccessToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}