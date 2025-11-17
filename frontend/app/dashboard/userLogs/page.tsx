"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import DataTableUsers from "@/components/data-table-users";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { tryRefresh } from "@/lib/tryRefresh";
import { useAuthStore } from "@/app/stores/useAuthStore";

export default function Page() {
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        const ok = await tryRefresh();
        if (!ok) {
          router.push("/login");
          return;
        }
      }

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

        <div className="flex flex-1 flex-col p-6">
          <DataTableUsers />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
