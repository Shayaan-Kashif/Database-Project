"use client";

import { create } from "zustand";

type AuthState = {
  token: string | null;
  name: string | null;
  role: string | null;

  setAuth: (data: Partial<AuthState>) => void;
  setToken: (token: string | null) => void;
  setRole: (role: string | null) => void;

  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  name: null,
  role: null,

  // ⭐ merge updates, and sync name to sessionStorage
  setAuth: (data) =>
    set((state) => {
      if (data.name !== undefined) {
        sessionStorage.setItem("name", data.name ?? "");
      }
      // role stays in memory only
      return { ...state, ...data };
    }),

  setToken: (token) =>
    set((state) => ({
      ...state,
      token,
    })),

  setRole: (role) =>
    set((state) => ({
      ...state,
      role,
    })),

  clearAuth: () => {
    sessionStorage.removeItem("name");
    set({
      token: null,
      name: null,
      role: null,
    });
  },
}));

// ⭐ Restore name from sessionStorage on page load
if (typeof window !== "undefined") {
  const storedName = sessionStorage.getItem("name");

  if (storedName) {
    useAuthStore.setState({
      name: storedName,
    });
  }
}
