"use client";

import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { tryRefresh } from "@/lib/tryRefresh"
import { useAuthStore } from "@/app/stores/useAuthStore"


export default function Page() {
  // ⭐ Only subscribe to token, not the whole store
const token = useAuthStore((state) => state.token);
const role = useAuthStore((state) => state.role);
const router = useRouter();

useEffect(() => {
  const checkAuth = async () => {
    // 1️⃣ If no token, try refreshing
    if (!token) {
      const ok = await tryRefresh();
      if (!ok) {
        router.push("/login");
        return;
      }
    }

    // 2️⃣ After login OR refresh, check admin role
    const currentRole = useAuthStore.getState().role;
    if (currentRole !== "admin") {
      router.push("/dashboard");
      return;
    }
  };

  checkAuth();
}, [token, role, router]);

console.log("Store token:", token);
console.log("Store role:", role);


  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">


        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
