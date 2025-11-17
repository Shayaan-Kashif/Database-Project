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
import data from "./data.json"
import { useHydration } from "@/lib/useHydration"

export default function Page() {
  // ⭐ Only subscribe to token, not the whole store
  const hydrated = useHydration(); // ⭐ Prevents hydration race conditions
  const router = useRouter();

  // Subscribe correctly
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);

  useEffect(() => {
    if (!hydrated) return; // ⛔ Do nothing until hydration done

    async function verify() {
      // 1️⃣ After hydration—if no token—try to refresh
      if (!token) {
        const ok = await tryRefresh();
        if (!ok) {
          router.replace("/login");
          return;
        }
      }

      // 2️⃣ If token existed OR refresh succeeded → stay on dashboard
    }

    verify();
  }, [hydrated, token, router]);



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
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
