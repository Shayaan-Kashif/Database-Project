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

type ParkingLot = {
  id: string;
  name: string;
  slots: number;
  ocupiedSlots: number;
  totalLogs?: number;
};

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

  // LOAD LOTS & LOG COUNTS
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
        const logsData = await logsRes.json();

        const merged = lotsData.map((lot) => {
          const match = logsData.find((l: any) => l.id === lot.id);
          return {
            ...lot,
            totalLogs: match?.totalEntries ?? 0,
          };
        });

        setLots(merged);
      } catch (e) {
        console.error("Failed to load parking lots/logs:", e);
      }
    }

    loadLots();
  }, []);

  // LOAD LOGS
  async function loadLogs() {
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/parkingLogsAll", {
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

  function getLotName(id: string) {
    return lots.find((l) => l.id === id)?.name ?? "Unknown Lot";
  }

  return (
    <div className="p-4 flex flex-col gap-6">

      {/* SELECT MODE */}
      <div className="w-64">
        <Select
          value={mode}
          onValueChange={(v: "lots" | "logs") => {
            setMode(v);
            if (v === "logs") loadLogs();
          }}
        >
          <SelectTrigger className="dark:bg-neutral-900 dark:border-neutral-800 dark:text-gray-200">
            <SelectValue placeholder="Select View" />
          </SelectTrigger>

          <SelectContent className="dark:bg-neutral-900 dark:border-neutral-700 dark:text-gray-200">
            <SelectItem value="lots">All Parking Lots</SelectItem>
            <SelectItem value="logs">Parking Logs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* TABLE CONTAINER */}
      <div
        className="
          overflow-x-auto rounded-lg border shadow-sm
          bg-white 
          dark:bg-neutral-900 
          dark:border-neutral-800
        "
      >
        <Table className="text-sm [&_*]:px-3 [&_*]:py-2 dark:text-gray-200">
          <TableHeader className="bg-muted/50 dark:bg-neutral-800 dark:text-gray-300">
            <TableRow>
              {mode === "lots" ? (
                <>
                  <TableHead>Lot ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-center">Slots</TableHead>
                  <TableHead className="text-center">Available</TableHead>
                  <TableHead className="text-center">Logs Count</TableHead>
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
            {loading && (
              <TableRow>
                <TableCell colSpan={10}>Loading…</TableCell>
              </TableRow>
            )}

            {/* LOTS VIEW */}
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
                  <TableRow
                    key={lot.id}
                    className="dark:hover:bg-neutral-800 dark:border-neutral-700"
                  >
                    <TableCell>{lot.id}</TableCell>
                    <TableCell>{lot.name}</TableCell>
                    <TableCell className="text-center">{lot.slots}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={variant}
                        className="dark:bg-neutral-700 dark:text-white"
                      >
                        {available}/{lot.slots}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {lot.totalLogs}
                    </TableCell>
                  </TableRow>
                );
              })}

            {/* LOGS VIEW */}
            {mode === "logs" &&
              !loading &&
              logs.map((log) => (
                <TableRow
                  key={log.id}
                  className="dark:hover:bg-neutral-800 dark:border-neutral-700"
                >
                  <TableCell>{getLotName(log.parkingLotID)}</TableCell>
                  <TableCell>{log.userID}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        log.eventType === "entry" ? "outline" : "secondary"
                      }
                      className="dark:bg-neutral-700 dark:text-white"
                    >
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
