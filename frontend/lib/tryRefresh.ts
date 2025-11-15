"use client";

import { useAuthStore } from "@/app/stores/useAuthStore";



export async function tryRefresh() {
  try {
    const res = await fetch("http://localhost:8080/api/refresh", {
      method: "POST",
      credentials: "include", // sends the HttpOnly refresh cookie
    });

    if (!res.ok) return false;

    const data = await res.json();

    // Update only the token in Zustand
    useAuthStore.getState().setToken(data.access_token);

    return true;
  } catch (err) {
    return false;
  }
}
