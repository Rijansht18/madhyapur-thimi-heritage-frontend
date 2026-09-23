import { create } from 'zustand';
import {
  fetchMe,
  login as apiLogin,
  logout as apiLogout,
  getAccessToken,
  type AuthUser,
} from '../lib/authApi';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;

  init: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,
  error: null,

  async init() {
    if (!getAccessToken()) {
      set({ initialized: true });
      return;
    }
    set({ loading: true });
    try {
      const user = await fetchMe();
      set({ user });
    } catch {
      apiLogout();
      set({ user: null });
    } finally {
      set({ loading: false, initialized: true });
    }
  },

  async login(identifier, password) {
    set({ loading: true, error: null });
    try {
      const { user } = await apiLogin(identifier, password);
      set({ user });
    } catch (e: any) {
      set({ error: e?.response?.data?.error ?? 'Login failed' });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  logout() {
    apiLogout();
    set({ user: null });
  },
}));