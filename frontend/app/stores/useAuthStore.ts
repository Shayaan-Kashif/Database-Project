"use client";

import { create } from "zustand";

type AuthState = {
  token: string | null;
  name: string | null;
  role: string | null;
  setAuth: (data: { token: string | null; name: string | null; role: string | null }) => void;
  setToken: (token: string | null) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  name: null,
  role: null,

  setAuth: ({ token, name, role }) => {
    set({ token, name, role });
    sessionStorage.setItem("name", name ?? "");
    sessionStorage.setItem("role", role ?? "");
  },

  setToken: (token) => set({ token }),

  clearAuth: () => {
    sessionStorage.removeItem("name");
    sessionStorage.removeItem("role");
    set({ token: null, name: null, role: null });
  },
}));

// restore session data
if (typeof window !== "undefined") {
  const storedName = sessionStorage.getItem("name");
  const storedRole = sessionStorage.getItem("role");

  if (storedName || storedRole) {
    useAuthStore.setState({
      name: storedName ?? null,
      role: storedRole ?? null,
    });
  }
}
