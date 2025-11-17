"use client";

import { useEffect, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/app/stores/useAuthStore";

// ---------------------
// Types
// ---------------------

// Review format (same as before)
type Review = {
  userID: string;
  username: string;
  lotID: string;
  lotName: string;
  title: string;
  description: { String: string; Valid: boolean };
  score: number;
  createdAt: string;
  updatedAt: string;
};

// Parking Lot names (ALL lots)
type ParkingLot = {
  id: string;
  name: string;
};

// Parking Log entries
type ParkingLog = {
  id: string;
  lotID: string;
  lotName: string;
  timeEntered: string;
  timeExited: string | null;
  userID: string | null;
};

// ---------------------
// Component
// ---------------------
export default function DataTableLotsAndLogs() {
  const [mode, setMode] = useState<string>("lots");  
  // "lots" or "logs"

  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [logs, setLogs] = useState<ParkingLog[]>([]);
  const [loading, setLoading] = useState(false);

  const token = useAuthStore((state) => state.token);

  // ---------------------
  // LOAD ALL PARKING LOTS
  // ---------------------
  useEffect(() => {
    async function loadLots() {
      try {
        const res = await fetch("http://localhost:8080/api/parkingLots", {
          credentials: "include",
        });
        const data = await res.json();
        setLots(data);
      } catch (e) {
        console.error("Failed to load lots:", e);
      }
    }
    loadLots();
  }, []);

  // ---------------------
  // LOAD PARKING LOGS
  // ---------------------
  async function loadLogs() {
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/parkingLogsAll", {
        credentials: "include",
      });
      const data = await res.json();
      setLogs(data);
    } catch (e) {
      console.error("Failed to load parking logs:", e);
    } finally {
      setLoading(false);
    }
  }

  // ---------------------
  // LOAD REVIEWS (when lots mode)
  // ---------------------
  async function loadReviews(lotID: string) {
    setLoading(true);

    try {
      const res = await fetch(
        `http://localhost:8080/api/reviews/${lotID}`,
        { credentials: "include" }
      );
      const data: Review[] = await res.json();
      setReviews(data);
    } catch (e) {
      console.error("Failed to load reviews:", e);
    } finally {
      setLoading(false);
    }
  }

  // ---------------------
  // DELETE Review
  // ---------------------
  async function deleteReview(userID: string, lotID: string) {
    const ok = confirm("Are you sure?");
    if (!ok) return;

    try {
      const res = await fetch("http://localhost:8080/api/reviews", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userID,
          lotID,
        }),
      });

      if (!res.ok) {
        alert("Delete failed.");
        return;
      }

      loadReviews(lotID);
    } catch (e) {
      alert("Delete error.");
    }
  }

  // ---------------------
  // RENDER
  // ---------------------
  return (
    <div className="p-4 flex flex-col gap-6">

      {/* DROPDOWN */}
      <div className="w-64">
        <Select
          value={mode}
          onValueChange={(v) => {
            setMode(v);
            if (v === "logs") {
              loadLogs();
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select View" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="lots">All Lots (Reviews)</SelectItem>
            <SelectItem value="logs">Parking Logs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* MAIN TABLE */}
      <div className="overflow-x-auto rounded-lg border">
        <Table className="text-sm [&_*]:px-3 [&_*]:py-1">
          <TableHeader>
            <TableRow>
              {mode === "lots" ? (
                <>
                  <TableHead>User</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Delete</TableHead>
                </>
              ) : (
                <>
                  <TableHead>Lot</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Entered</TableHead>
                  <TableHead>Exited</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6}>Loading...</TableCell>
              </TableRow>
            )}

            {/* --- LOT REVIEWS MODE --- */}
            {mode === "lots" &&
              !loading &&
              reviews.map((r) => (
                <TableRow key={r.userID + r.lotID}>
                  <TableCell>{r.username}</TableCell>
                  <TableCell>{r.title}</TableCell>
                  <TableCell>{r.description?.String}</TableCell>
                  <TableCell>{r.score}</TableCell>
                  <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteReview(r.userID, r.lotID)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

            {/* --- PARKING LOGS MODE --- */}
            {mode === "logs" &&
              !loading &&
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.lotName}</TableCell>
                  <TableCell>{log.userID || "N/A"}</TableCell>
                  <TableCell>{new Date(log.timeEntered).toLocaleString()}</TableCell>
                  <TableCell>
                    {log.timeExited
                      ? new Date(log.timeExited).toLocaleString()
                      : "Still Parked"}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
