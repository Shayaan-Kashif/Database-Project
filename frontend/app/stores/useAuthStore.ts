"use client";

import { create } from "zustand";

interface AuthState {
  token: string | null;
  role: string | null;
  name: string | null;

  setAuth: (data: { token?: string | null; role?: string | null; name?: string | null }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  role: null,
  name: null,

  setAuth: ({ token, role, name }) =>
    set((state) => ({
      token: token ?? state.token,
      role: role ?? state.role,
      name: name ?? state.name,
    })),

  clearAuth: () =>
    set({
      token: null,
      role: null,
      name: null,
    }),
}));
