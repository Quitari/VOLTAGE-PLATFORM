import { create } from "zustand";
import type { User } from "../types";
import { authApi } from "../api/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (login: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  hasPermission: (codename: string) => boolean;
  userLevel: () => number;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (login, password) => {
    const { data } = await authApi.login({ login, password });
    localStorage.setItem("access_token", data.tokens.access);
    localStorage.setItem("refresh_token", data.tokens.refresh);
    set({ user: data.user, isAuthenticated: true });
  },

  register: async (formData) => {
    const { data } = await authApi.register(formData);
    localStorage.setItem("access_token", data.tokens.access);
    localStorage.setItem("refresh_token", data.tokens.refresh);
    set({ user: data.user, isAuthenticated: true });
  },

  logout: async () => {
    const refresh = localStorage.getItem("refresh_token");
    if (refresh) {
      try {
        await authApi.logout(refresh);
      } catch {}
    }
    localStorage.clear();
    set({ user: null, isAuthenticated: false });
  },

  loadUser: async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const { data } = await authApi.me();
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.clear();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  hasPermission: (codename) => {
    const { user } = get();
    if (!user) return false;
    return user.permissions.includes(codename);
  },

  userLevel: () => {
    const { user } = get();
    if (!user || !user.roles.length) return 0;
    return Math.max(...user.roles.map((r) => r.role.level));
  },
}));
