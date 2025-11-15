"use client";

import { create } from "zustand";

export const useAuthStore = create((set, get) => ({
  token: null as string | null,
  name: null as string | null,
  role: null as string | null,

  // Store everything in Zustand and put name+role in session
  setAuth: ({ token, name, role }: any) => {
    set({ token, name, role });

    sessionStorage.setItem("name", name);
    sessionStorage.setItem("role", role);
  },

  // Only token changes during refresh
  setToken: (token: string | null) => set({ token }),

  // Full logout
  clearAuth: () => {
    sessionStorage.removeItem("name");
    sessionStorage.removeItem("role");
    set({ token: null, name: null, role: null });
  },
}));

// ⭐ Auto-restore name + role from sessionStorage after reload
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
