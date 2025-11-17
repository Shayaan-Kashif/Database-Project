"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import SectionCardLots from "@/components/section-cards-lots";
import DataTableLots from "@/components/data-table-lots";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { tryRefresh } from "@/lib/tryRefresh";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { useHydration } from "@/lib/useHydration";

export default function Page() {

  // ----------------------
  // AUTH CHECK
  // ----------------------
  
  const hydrated = useHydration();
  const router = useRouter();

  // Zustand subscriptions (safe)
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);

  useEffect(() => {
    if (!hydrated) return; // ⛔ prevents hydration race-conditions

    async function verify() {
      // 1️⃣ Wait for hydration before checking anything
      if (!token) {
        const ok = await tryRefresh();
        if (!ok) {
          router.replace("/login");
          return;
        }
      }

      // 2️⃣ After refresh, wait one render for role to populate
      const newRole = useAuthStore.getState().role;
      if (!newRole) return;

      // 3️⃣ Role check
      if (newRole !== "admin") {
        router.replace("/dashboard");
      }
    }

    verify();
  }, [hydrated, token, role, router]);

  // ----------------------
  // LAYOUT
  // ----------------------
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

        {/* MAIN PAGE CONTENT */}
        <div className="flex flex-1 flex-col gap-6 py-6">

          {/* ⭐ Review/Lot Section Cards */}
          <SectionCardLots />

          {/* ⭐ Data Table (Lots / Reviews) */}
          <DataTableLots />

        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
