"use client";

import { useEffect, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/app/stores/useAuthStore";

// Parking Lots
type ParkingLot = {
  id: string;
  name: string;
  slots: number;
  ocupiedSlots: number;
};

// Parking Logs
type ParkingLog = {
  id: string;
  userID: string;
  parkingLotID: string;
  eventType: "entry" | "exit";
  time: string;
};

export default function DataTableLotsAndLogs() {
  const [mode, setMode] = useState<"lots" | "logs">("lots");

  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [logs, setLogs] = useState<ParkingLog[]>([]);
  const [loading, setLoading] = useState(false);

  const token = useAuthStore((s) => s.token);
  console.log("TOKEN:", token);

  // -------------------------------
  // LOAD PARKING LOTS
  // -------------------------------
  useEffect(() => {
    async function loadLots() {
      try {
        const res = await fetch("http://localhost:8080/api/parkingLots", {
          credentials: "include",
        });

        const data: ParkingLot[] = await res.json();
        setLots(data);
      } catch (e) {
        console.error("Failed to load parking lots:", e);
      }
    }

    loadLots();
  }, []);

  // -------------------------------
  // LOAD PARKING LOGS (sorted newest → oldest)
  // -------------------------------
  async function loadLogs() {
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/parkingLogsAll", {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let data = await res.json();

      if (Array.isArray(data)) {
        // ⭐ Sort by time DESC (latest first)
        data.sort(
          (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
        );

        setLogs(data);
      } else {
        setLogs([]);
      }
    } catch (e) {
      console.error("Failed to load logs:", e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------
  // Helper: lot name
  // -------------------------------
  function getLotName(id: string) {
    return lots.find((l) => l.id === id)?.name ?? "Unknown Lot";
  }

  // -------------------------------
  // RENDER UI
  // -------------------------------
  return (
    <div className="p-4 flex flex-col gap-6">
      {/* MODE SELECT */}
      <div className="w-64">
        <Select
          value={mode}
          onValueChange={(v: "lots" | "logs") => {
            setMode(v);
            if (v === "logs") loadLogs();
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select View" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="lots">All Parking Lots</SelectItem>
            <SelectItem value="logs">Parking Logs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto rounded-lg border shadow-sm bg-white">
        <Table className="text-sm [&_*]:px-3 [&_*]:py-2">
          <TableHeader className="bg-muted/50">
            <TableRow>
              {mode === "lots" ? (
                <>
                  <TableHead>Lot ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-center">Slots</TableHead>
                  <TableHead className="text-center">Available</TableHead>
                </>
              ) : (
                <>
                  <TableHead>Lot</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Time</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* Loading */}
            {loading && (
              <TableRow>
                <TableCell colSpan={10}>Loading…</TableCell>
              </TableRow>
            )}

            {/* LOTS TABLE */}
            {mode === "lots" &&
              !loading &&
              lots.map((lot) => {
                const available = Math.max(lot.slots - lot.ocupiedSlots, 0);

                const variant =
                  available === 0
                    ? "destructive"
                    : available <= Math.ceil(lot.slots * 0.2)
                    ? "secondary"
                    : "outline";

                return (
                  <TableRow key={lot.id}>
                    <TableCell>{lot.id}</TableCell>
                    <TableCell>{lot.name}</TableCell>
                    <TableCell className="text-center">{lot.slots}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={variant}>
                        {available}/{lot.slots}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}

            {/* LOGS TABLE (sorted) */}
            {mode === "logs" &&
              !loading &&
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{getLotName(log.parkingLotID)}</TableCell>
                  <TableCell>{log.userID}</TableCell>

                  <TableCell>
                    <Badge variant={log.eventType === "entry" ? "outline" : "secondary"}>
                      {log.eventType.toUpperCase()}
                    </Badge>
                  </TableCell>

                  <TableCell>{new Date(log.time).toLocaleString()}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
