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
    };

    checkAuth();
  }, [router]);


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
