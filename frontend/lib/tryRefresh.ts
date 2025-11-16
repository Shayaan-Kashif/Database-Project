"use client";

import { useAuthStore } from "@/app/stores/useAuthStore";



export async function tryRefresh() {
  try {
    const res = await fetch("http://localhost:8080/api/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) return false;

    const data = await res.json();

    // ⭐ Update both values
    useAuthStore.getState().setToken(data.access_token);
    useAuthStore.getState().setRole(data.role);

    return true;
  } catch {
    return false;
  }
}

