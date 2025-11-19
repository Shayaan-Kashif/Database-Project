"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import ReviewSectionCards from "@/components/review_section-cards";
import DataTableReviews from "@/components/data-table-reviews";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { tryRefresh } from "@/lib/tryRefresh";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { useHydration } from "@/lib/useHydration";

export default function Page() {


  const [reviewData, setReviewData] = useState([]);

  const hydrated = useHydration();
  const router = useRouter();

  // Zustand subscriptions (safe)
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);

  useEffect(() => {
  if (!hydrated) return;

  const timeout = setTimeout(async () => {
    const currentToken = useAuthStore.getState().token;

    // No token → try refresh token
    if (!currentToken) {
      const ok = await tryRefresh();
      if (!ok) {
        router.replace("/login");
        return;
      }
    }

    // After refresh, check role safely
    const roleNow = useAuthStore.getState().role;
    if (roleNow !== "admin") {
      router.replace("/dashboard");
    }
  }, 1000); // ⭐ 1 second delay to fully hydrate

  return () => clearTimeout(timeout);
}, [hydrated]);
  // ⭐ FIX: ensure data is loaded
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:8080/api/reviews/all", {
          credentials: "include",
        });
        const json = await res.json();

        setReviewData(Array.isArray(json) ? json : []);
      } catch (e) {
        console.error("Failed to load review data:", e);
        setReviewData([]); // prevent undefined
      }
    }

    load();
  }, []);

  console.log(token);

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
        <SiteHeader title="Reviews Management"/>

        <div className="flex flex-1 flex-col gap-6 py-6">
          {/* ⭐ Your custom cards for reviews */}
          <ReviewSectionCards />

          {/* ⭐ FIX: safe data passed to table */}
          <DataTableReviews data={reviewData} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
