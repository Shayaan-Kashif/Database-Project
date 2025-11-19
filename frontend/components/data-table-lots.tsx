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
  totalLogs?: number; // Logs count per lot
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

  // -------------------------------
  // LOAD PARKING LOTS AND LOG COUNTS
  // -------------------------------
  useEffect(() => {
    async function loadLots() {
      try {
        const [lotsRes, logsRes] = await Promise.all([
          fetch("http://localhost:8080/api/parkingLots", {
            credentials: "include",
          }),
          fetch("http://localhost:8080/api/countOfLogsPerLot", {
            credentials: "include",
          }),
        ]);

        const lotsData: ParkingLot[] = await lotsRes.json();
        const logsData = await logsRes.json(); // {id, totalEntries}

        // Merge log counts into lots
        const merged = lotsData.map((lot) => {
          const match = logsData.find((l: any) => l.id === lot.id);
          return {
            ...lot,
            totalLogs: match?.totalEntries ?? 0,
          };
        });

        setLots(merged);
      } catch (e) {
        console.error("Failed to load parking lots or logs:", e);
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
        headers: { Authorization: `Bearer ${token}` },
      });

      let data = await res.json();

      if (Array.isArray(data)) {
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
                // LOTS TABLE HEADERS
                [
                  <TableHead key="id">Lot ID</TableHead>,
                  <TableHead key="name">Name</TableHead>,
                  <TableHead key="slots" className="text-center">Slots</TableHead>,
                  <TableHead key="available" className="text-center">Available</TableHead>,
                  <TableHead key="logs" className="text-center">Logs Count</TableHead>,
                ]
              ) : (
                // LOGS TABLE HEADERS
                [
                  <TableHead key="lot">Lot</TableHead>,
                  <TableHead key="user">User</TableHead>,
                  <TableHead key="event">Event</TableHead>,
                  <TableHead key="time">Time</TableHead>,
                ]
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
                    <TableCell className="text-center">{lot.totalLogs}</TableCell>
                  </TableRow>
                );
              })}

            {/* LOGS TABLE */}
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
