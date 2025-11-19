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
  const role = useAuthStore((s) => s.role);

  // user data
  const [user, setUser] = useState<any | null>(null);

  // dialog state
  const [openField, setOpenField] = useState<
    null | "name" | "email" | "password"
  >(null);

  // ===================================================
  // AUTH GUARD
  // ===================================================
  useEffect(() => {
    if (!hydrated) return;

    async function verify() {
      const stored = useAuthStore.getState().token;

      if (!stored) {
        const ok = await tryRefresh();
        if (!ok) {
          router.replace("/login");
          return;
        }
      }
    }

    verify();
  }, [hydrated, router]);

  // ===================================================
  // GET USER DATA
  // ===================================================
  useEffect(() => {
    if (!token) return;

    async function loadUser() {
      try {
        const res = await fetch("http://localhost:8080/api/user", {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("Failed:", data);
          return;
        }

        setUser(data);
      } catch (err) {
        console.error("User fetch error:", err);
      }
    }

    loadUser();
  }, [token]);

  if (!hydrated || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading account...</p>
      </div>
    );
  }

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

              {/* Name */}
              <AccountField
                label="Name"
                value={user.name}
                field="name"
                onOpen={setOpenField}
              />

              {/* Email */}
              <AccountField
                label="Email"
                value={user.email}
                field="email"
                onOpen={setOpenField}
              />

              {/* Role */}
              <div className="flex items-center justify-between py-4 border-b">
                <div>
                  <p className="font-medium text-lg">Role</p>
                  <p className="text-sm text-muted-foreground">
                    {user.role}
                  </p>
                </div>
              </div>

              {/* Parking Lot */}
              <div className="flex items-center justify-between py-4 border-b">
                <div>
                  <p className="font-medium text-lg">Parking Lot</p>
                  <p className="text-sm text-muted-foreground">
                    {user.parkingLotID?.String || "Not Parked"}
                  </p>
                </div>
              </div>

              {/* Dates */}
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
                <Button variant="destructive" className="w-full h-12 text-md">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* EDIT DIALOG */}
          <EditDialog
            openField={openField}
            setOpenField={setOpenField}
            reloadUser={() => window.location.reload()}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// ===================================================
// Reusable Account Field Block
// ===================================================
function AccountField({
  label,
  value,
  field,
  onOpen,
}: {
  label: string;
  value: string;
  field: "name" | "email";
  onOpen: (f: any) => void;
}) {
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
function EditDialog({
  openField,
  setOpenField,
  reloadUser,
}: {
  openField: "name" | "email" | "password" | null;
  setOpenField: (v: any) => void;
  reloadUser: () => void;
}) {
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

      alert("Updated!");

      setOpenField(null);
      setValue("");

      reloadUser(); // refresh the page data
    } catch (e) {
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
