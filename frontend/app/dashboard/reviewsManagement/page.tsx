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

export default function Page() {
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);

  const router = useRouter();

  const [reviewData, setReviewData] = useState([]);

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
        <SiteHeader />

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
