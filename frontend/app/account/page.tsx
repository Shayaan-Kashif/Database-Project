"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { tryRefresh } from "@/lib/tryRefresh";
import { useAuthStore } from "@/app/stores/useAuthStore";
import { useHydration } from "@/lib/useHydration";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// ===================================================
// Main Page
// ===================================================
export default function AccountPage() {
  const hydrated = useHydration();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  const [user, setUser] = useState<any | null>(null);
  const [lotMap, setLotMap] = useState<Record<string, string>>({});
  const [openField, setOpenField] = useState<null | "name" | "email" | "password">(null);

  // ===================================================
  // AUTH CHECK
  // ===================================================
  useEffect(() => {
    if (!hydrated) return;

    async function ensureAuth() {
      let storedToken = useAuthStore.getState().token;

      if (storedToken) return;

      const ok = await tryRefresh();

      if (!ok) {
        router.replace("/login");
        return;
      }

      storedToken = useAuthStore.getState().token;
    }

    ensureAuth();
  }, [hydrated, router]);

  // ===================================================
  // LOAD USER DATA
  // ===================================================
  async function fetchUser() {
    if (!token) return;

    try {
      const res = await fetch("http://localhost:8080/api/user", {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) setUser(data);
      else console.error("Load user failed:", data);
    } catch (err) {
      console.error("Fetch user error:", err);
    }
  }

  useEffect(() => {
    fetchUser();
  }, [token]);

  // ===================================================
  // LOAD PARKING LOTS
  // ===================================================
  useEffect(() => {
    async function loadLots() {
      try {
        const res = await fetch("http://localhost:8080/api/parkingLots", {
          credentials: "include",
        });

        const lots = await res.json();

        if (!res.ok) {
          console.error("Failed to load lots:", lots);
          return;
        }

        const map: Record<string, string> = {};
        lots.forEach((lot: any) => {
          map[lot.id] = lot.name;
        });

        setLotMap(map);
      } catch (err) {
        console.error("Lot fetch error:", err);
      }
    }

    loadLots();
  }, []);

  // ===================================================
  // DELETE ACCOUNT HANDLER
  // ===================================================
  async function handleDelete() {
    const token = useAuthStore.getState().token;
    if (!token) return alert("You are not logged in.");

    const confirmDelete = confirm("Are you sure you want to delete your account? This cannot be undone.");
    if (!confirmDelete) return;

    try {
      const res = await fetch("http://localhost:8080/api/user", {
        method: "DELETE",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        alert("Error: " + (data.error || "Failed to delete account"));
        return;
      }

      // clear JWT + session storage
      useAuthStore.getState().setToken(null);
      sessionStorage.removeItem("name");

      alert("Account deleted successfully.");

      router.replace("/login");
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  }

  if (!hydrated || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading account...</p>
      </div>
    );
  }

  const lotDisplay = user.parkingLotID
    ? lotMap[user.parkingLotID] || user.parkingLotID
    : "Not Parked";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader title=" " />

        <div className="px-8 py-10 max-w-5xl mx-auto w-full">
          <h1 className="text-3xl font-bold mb-8">Account</h1>

          <Card className="p-8 rounded-xl shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">
                Account Settings
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-10 mt-4">
              <AccountField
                label="Name"
                value={user.name}
                field="name"
                onOpen={setOpenField}
              />

              <AccountField
                label="Email"
                value={user.email}
                field="email"
                onOpen={setOpenField}
              />

              <div className="flex items-center justify-between py-4 border-b">
                <div>
                  <p className="font-medium text-lg">Role</p>
                  <p className="text-sm text-muted-foreground">{user.role}</p>
                </div>
              </div>

              <div className="flex items-center justify-between py-4 border-b">
                <div>
                  <p className="font-medium text-lg">Parking Lot</p>
                  <p className="text-sm text-muted-foreground">{lotDisplay}</p>
                </div>
              </div>

              <DateField label="Created At" value={user.createdAt} />
              <DateField label="Updated At" value={user.updatedAt} />

              <div className="pt-6">
                <Button
                  className="w-full h-12 text-md"
                  onClick={() => setOpenField("password")}
                >
                  Change Password
                </Button>
              </div>

              <div className="pt-2">
                <Button
                  variant="destructive"
                  className="w-full h-12 text-md"
                  onClick={handleDelete}
                >
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

// ===================================================
// Field Component
// ===================================================
function AccountField({ label, value, field, onOpen }: any) {
  return (
    <div className="flex items-center justify-between py-4 border-b">
      <div>
        <p className="font-medium text-lg">{label}</p>
        <p className="text-sm text-muted-foreground">{value}</p>
      </div>
      <Button variant="outline" onClick={() => onOpen(field)}>
        Change
      </Button>
    </div>
  );
}

// ===================================================
// Date Field
// ===================================================
function DateField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-4 border-b">
      <div>
        <p className="font-medium text-lg">{label}</p>
        <p className="text-sm text-muted-foreground">
          {new Date(value).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

// ===================================================
// Edit Dialog
// ===================================================
function EditDialog({ openField, setOpenField }: any) {
  const [value, setValue] = useState("");

  const titleMap: any = {
    name: "Change Name",
    email: "Change Email",
    password: "Change Password",
  };

  async function handleSave() {
    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      const res = await fetch("http://localhost:8080/api/user", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [openField!]: value }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert("Error: " + data.error);
        return;
      }

      if (openField === "name") {
        sessionStorage.setItem("name", value);
      }

      alert("Updated!");
      setOpenField(null);
      setValue("");

      window.location.reload();
    } catch (err) {
      alert("Network error");
    }
  }

  return (
    <Dialog open={!!openField} onOpenChange={() => setOpenField(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titleMap[openField!]}</DialogTitle>
        </DialogHeader>

        <Input
          type={openField === "password" ? "password" : "text"}
          placeholder={`Enter new ${openField}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />

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
