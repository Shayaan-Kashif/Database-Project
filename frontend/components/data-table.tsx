"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

// -----------------------------
// Utility helpers
// -----------------------------
function getLotName(lot: any) {
  return lot.name ?? "Parking Lot";
}

function getLotRating(lot: any) {
  const n = Number(lot.avgScore);
  return Number.isFinite(n) ? n : "N/A";
}

function getLotCapacity(lot: any) {
  const n = Number(lot.slots);
  return Number.isFinite(n) ? n : null;
}

// -----------------------------
// MAIN COMPONENT
// -----------------------------
export function DataTable({ data }: { data: any[] }) {
  const [activeTab, setActiveTab] = React.useState<
    "available-lots" | "top-rated-lots" | "full-lots"
  >("available-lots");

  const [topRatedLots, setTopRatedLots] = React.useState<any[]>([]);
  const [fullLots, setFullLots] = React.useState<any[]>([]);
  const [availableLots, setAvailableLots] = React.useState<any[]>([]);

  const [loadingTopRated, setLoadingTopRated] = React.useState(false);
  const [loadingFullLots, setLoadingFullLots] = React.useState(false);
  const [loadingAvailableLots, setLoadingAvailableLots] = React.useState(false);

  const [errorTopRated, setErrorTopRated] = React.useState<string | null>(null);
  const [errorFullLots, setErrorFullLots] = React.useState<string | null>(null);
  const [errorAvailableLots, setErrorAvailableLots] =
    React.useState<string | null>(null);

  // -----------------------------
  // API Fetch Logic
  // -----------------------------
  React.useEffect(() => {
    async function fetchAvailable() {
      try {
        setLoadingAvailableLots(true);
        const res = await fetch("http://localhost:8080/api/parkingLots", {
          credentials: "include"
        });
        const json = await res.json();

        const list = json.map((lot: any) => ({
          ...lot,
          available: Number(lot.slots) - Number(lot.ocupiedSlots)
        }));

        setAvailableLots(list.filter((l: any) => l.available > 0));
      } catch (err) {
        setErrorAvailableLots(String(err));
      } finally {
        setLoadingAvailableLots(false);
      }
    }

    async function fetchTopRated() {
      try {
        setLoadingTopRated(true);
        const res = await fetch("http://localhost:8080/api/topRatedLots", {
          credentials: "include"
        });
        const json = await res.json();
        setTopRatedLots(json);
      } catch (err) {
        setErrorTopRated(String(err));
      } finally {
        setLoadingTopRated(false);
      }
    }

    async function fetchFull() {
      try {
        setLoadingFullLots(true);
        const res = await fetch("http://localhost:8080/api/fullLots", {
          credentials: "include"
        });
        const json = await res.json();
        setFullLots(json);
      } catch (err) {
        setErrorFullLots(String(err));
      } finally {
        setLoadingFullLots(false);
      }
    }

    if (activeTab === "available-lots" && availableLots.length === 0)
      fetchAvailable();

    if (activeTab === "top-rated-lots" && topRatedLots.length === 0)
      fetchTopRated();

    if (activeTab === "full-lots" && fullLots.length === 0)
      fetchFull();
  }, [activeTab]);

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) =>
        setActiveTab(
          v as "available-lots" | "top-rated-lots" | "full-lots"
        )
      }
      className="w-full flex-col gap-6"
    >
      {/* HEADER: SELECT + TABS */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        {/* MOBILE DROPDOWN */}
        <Select value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <SelectTrigger size="sm" className="w-fit @4xl/main:hidden">
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="available-lots">Available Lots</SelectItem>
            <SelectItem value="top-rated-lots">Top Rated Lots</SelectItem>
            <SelectItem value="full-lots">Full Lots</SelectItem>
          </SelectContent>
        </Select>

        {/* DESKTOP TABS */}
        <TabsList className="hidden @4xl/main:flex">
          <TabsTrigger value="available-lots">Available Lots</TabsTrigger>
          <TabsTrigger value="top-rated-lots">Top Rated Lots</TabsTrigger>
          <TabsTrigger value="full-lots">Full Lots</TabsTrigger>
        </TabsList>
      </div>

      {/* --------------------------- */}
      {/* AVAILABLE LOTS (DEFAULT) */}
      {/* --------------------------- */}
      <TabsContent value="available-lots" className="px-4 lg:px-6">
        {loadingAvailableLots && <div>Loading...</div>}
        {errorAvailableLots && (
          <div className="text-destructive">{errorAvailableLots}</div>
        )}

        {!loadingAvailableLots &&
          !errorAvailableLots &&
          availableLots.length === 0 && (
            <div>No available lots.</div>
          )}

        {!loadingAvailableLots &&
          !errorAvailableLots &&
          availableLots.length > 0 && (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead>Lot</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Total Slots</TableHead>
                    <TableHead>Occupied</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {availableLots
                    .sort((a, b) => b.available - a.available)
                    .map((lot: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>{lot.name}</TableCell>
                        <TableCell>{lot.available}</TableCell>
                        <TableCell>{lot.slots}</TableCell>
                        <TableCell>{lot.ocupiedSlots}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
      </TabsContent>

      {/* --------------------------- */}
      {/* TOP RATED LOTS */}
      {/* --------------------------- */}
      <TabsContent value="top-rated-lots" className="px-4 lg:px-6">
        {loadingTopRated && <div>Loading...</div>}
        {errorTopRated && <div className="text-destructive">{errorTopRated}</div>}
        {!loadingTopRated && topRatedLots.length === 0 && (
          <div>No top rated lots.</div>
        )}

        {!loadingTopRated && topRatedLots.length > 0 && (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Lot</TableHead>
                  <TableHead>Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topRatedLots.map((lot, i) => (
                  <TableRow key={i}>
                    <TableCell>{getLotName(lot)}</TableCell>
                    <TableCell>{getLotRating(lot)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      {/* --------------------------- */}
      {/* FULL LOTS */}
      {/* --------------------------- */}
      <TabsContent value="full-lots" className="px-4 lg:px-6">
        {loadingFullLots && <div>Loading...</div>}
        {errorFullLots && <div className="text-destructive">{errorFullLots}</div>}
        {!loadingFullLots && fullLots.length === 0 && (
          <div>No full lots.</div>
        )}

        {!loadingFullLots && fullLots.length > 0 && (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Lot</TableHead>
                  <TableHead>Capacity</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {fullLots.map((lot, i) => (
                  <TableRow key={i}>
                    <TableCell>{getLotName(lot)}</TableCell>
                    <TableCell>{getLotCapacity(lot)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
