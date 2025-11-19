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

// ========================================================================
// MAIN PAGE
// ========================================================================
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

      if (restoredToken) return;

      // Delay 2: Allow token to repopulate
      const t2 = setTimeout(async () => {
        const latest = useAuthStore.getState().token;

        if (latest) return;

        // Final attempt: Refresh
        const ok = await tryRefresh();
        if (!ok) router.replace("/login");
      }, 50);

      return () => clearTimeout(t2);
    }, 0);

    return () => clearTimeout(t1);
  }, [hydrated, router]);

  // mock user data for UI
  const user = {
    name: "John Doe",
    email: "john@example.com",
  };

  const [openField, setOpenField] = useState<null | "name" | "email" | "password">(null);

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
// EDIT DIALOG (PATCH /api/user WITH BEARER TOKEN)
// ========================================================================
function EditDialog({
  openField,
  setOpenField,
}: {
  openField: "name" | "email" | "password" | null;
  setOpenField: (v: any) => void;
}) {
  const [value, setValue] = useState("");

  const labelMap: any = {
    name: "Change Name",
    email: "Change Email",
    password: "Change Password",
  };

  async function handleSave() {
    if (!openField) return;

    const token = useAuthStore.getState().token;

    if (!token) {
      alert("No token available. Please log in again.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/user", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          [openField]: value,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert("Error: " + (data.error ?? "Failed to update user"));
        return;
      }

      alert("User updated successfully!");
      sessionStorage.setItem("name", value);

      setOpenField(null);
      setValue("");

    } catch (e: any) {
      alert("Network error: " + e.message);
    }
  }

  return (
    <Dialog open={!!openField} onOpenChange={() => setOpenField(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{openField ? labelMap[openField] : ""}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Input
            type={openField === "password" ? "password" : "text"}
            placeholder={
              openField === "password"
                ? "Enter new password"
                : openField === "email"
                ? "Enter new email"
                : "Enter new name"
            }
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpenField(null)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
