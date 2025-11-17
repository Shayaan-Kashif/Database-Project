"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import DataTableUsers from "@/components/data-table-users";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { tryRefresh } from "@/lib/tryRefresh";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { useHydration } from "@/lib/useHydration";

export default function Page() {
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

        <div className="flex flex-1 flex-col p-6">
          <DataTableUsers />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
