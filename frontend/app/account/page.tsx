"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { tryRefresh } from "@/lib/tryRefresh";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { useHydration } from "@/lib/useHydration";

// UI components
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AccountPage() {
  const hydrated = useHydration();
  const router = useRouter();

  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);

  // ========================================================================
  // AUTH GUARD
  // ========================================================================
  useEffect(() => {
    if (!hydrated) return;

    // Delay 1: Let Zustand hydrate
    const t1 = setTimeout(() => {
      const restoredToken = useAuthStore.getState().token;

      if (restoredToken) {
        console.log("JWT present after hydration");
        return;
      }

      // Delay 2: give a chance to repopulate token
      const t2 = setTimeout(async () => {
        const latestToken = useAuthStore.getState().token;

        if (latestToken) {
          console.log("JWT restored during second delay");
          return;
        }

        // If no token → refresh
        const ok = await tryRefresh();
        if (!ok) router.replace("/login");
      }, 50);

      return () => clearTimeout(t2);
    }, 0);

    return () => clearTimeout(t1);
  }, [hydrated, router]);

  console.log("Store token:", token);
  console.log("Store role:", role);

  // ========================================================================
  // UI STATE
  // ========================================================================
  const [openField, setOpenField] = useState<null | "name" | "email" | "password">(null);

  // mock data
  const user = {
    name: "John Doe",
    email: "john@example.com",
  };

  // ========================================================================
  // RENDER
  // ========================================================================
  return (
    <SidebarProvider>
  <AppSidebar />

  <SidebarInset>
    <SiteHeader />

    <div className="px-8 py-10 max-w-5xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-8">Account</h1>

      <Card className="p-8 rounded-xl min-h-[450px] shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Account Settings</CardTitle>
        </CardHeader>

        <CardContent className="space-y-10 mt-4">
          
          {/* Name */}
          <div className="flex items-center justify-between py-4 border-b">
            <div>
              <p className="font-medium text-lg">Name</p>
              <p className="text-sm text-muted-foreground">{user.name}</p>
            </div>
            <Button variant="outline" onClick={() => setOpenField("name")}>
              Change
            </Button>
          </div>

          {/* Email */}
          <div className="flex items-center justify-between py-4 border-b">
            <div>
              <p className="font-medium text-lg">Email</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="outline" onClick={() => setOpenField("email")}>
              Change
            </Button>
          </div>

          {/* Change Password */}
          <div className="pt-6">
            <Button className="w-full h-12 text-md" onClick={() => setOpenField("password")}>
              Change Password
            </Button>
          </div>

          {/* Delete Account */}
          <div className="pt-2">
            <Button variant="destructive" className="w-full h-12 text-md">
              Delete Account
            </Button>
          </div>

        </CardContent>
      </Card>

      <EditDialog openField={openField} setOpenField={setOpenField} />
    </div>
  </SidebarInset>
</SidebarProvider>

  );
}



// ========================================================================
// EDIT DIALOG MODAL
// ========================================================================
function EditDialog({
  openField,
  setOpenField,
}: {
  openField: "name" | "email" | "password" | null;
  setOpenField: (v: any) => void;
}) {
  const labelMap: any = {
    name: "Change Name",
    email: "Change Email",
    password: "Change Password",
  };

  return (
    <Dialog open={!!openField} onOpenChange={() => setOpenField(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{openField ? labelMap[openField] : ""}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {openField !== "password" ? (
            <Input placeholder={`Enter new ${openField}`} />
          ) : (
            <>
              <Input type="password" placeholder="Current Password" />
              <Input type="password" placeholder="New Password" />
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpenField(null)}>
            Cancel
          </Button>
          <Button>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
