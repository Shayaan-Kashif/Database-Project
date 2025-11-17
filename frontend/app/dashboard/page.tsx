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
import { useHydration } from "@/lib/useHydration"
import data from "./data.json"

export default function Page() {
  const hydrated = useHydration();
  const router = useRouter();

  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);

  useEffect(() => {
  if (!hydrated) return;

  // Delay 1: Allow Zustand to fully hydrate (token may still be null)
  const t1 = setTimeout(() => {
    const restoredToken = useAuthStore.getState().token;

    // If token exists after hydration → allow access
    if (restoredToken) {
      console.log("JWT present after hydration");
      return;
    }

    // Delay 2: Give time for token to repopulate before refreshing
    const t2 = setTimeout(async () => {
      const latestToken = useAuthStore.getState().token;

      // If token repopulated in the second delay → allow access
      if (latestToken) {
        console.log("JWT restored after double-delay");
        return;
      }

      // Final check → if still no token → try refresh
      const ok = await tryRefresh();
      if (!ok) router.replace("/login");
    }, 50); // 50ms is enough

    return () => clearTimeout(t2);
  }, 0);

  return () => clearTimeout(t1);
}, [hydrated, router]);

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
