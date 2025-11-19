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

type Lot = {
  id: string;
  name: string;
  totalReviews?: number;
};

// ---------------------
// Component
// ---------------------
export default function DataTableReviews() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [selectedLot, setSelectedLot] = useState<string>(
    "f51d8400-a620-4167-af9a-eca19e564919"
  );
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  const token = useAuthStore((state) => state.token);

  // ---------------------
  // Load lots
  // ---------------------
  useEffect(() => {
    async function loadLots() {
      try {
        const res = await fetch("http://localhost:8080/api/countOfReviewsPerLot", {
          credentials: "include",
        });

        const data: Lot[] = await res.json();

        const order = [
          "Founders 1",
          "Founders 2",
          "Founders 3",
          "Founders 4",
          "Founders 5",
          "Commencement"
        ];

        const sorted = data.sort((a, b) => {
          const indexA = order.indexOf(a.name);
          const indexB = order.indexOf(b.name);
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return a.name.localeCompare(b.name);
        });

        setLots(sorted);
      } catch (err) {
        console.error("Failed to load lots:", err);
      }
    }

    loadLots();
  }, []);

  // ---------------------
  // Load reviews
  // ---------------------
  async function loadReviews() {
    setLoading(true);

    try {
      const res = await fetch(`http://localhost:8080/api/reviews/${selectedLot}`, {
        credentials: "include",
      });

      const data: Review[] = await res.json();
      setReviews(data);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedLot) return;

    const t = setTimeout(() => {
      loadReviews();
    }, 400);

    return () => clearTimeout(t);
  }, [selectedLot]);

  // ---------------------
  // Delete Review
  // ---------------------
  async function deleteReview(userID: string, lotID: string) {
    const ok = confirm("Are you sure you want to delete this review?");
    if (!ok) return;

    if (!token) {
      alert("Missing token. Please log in again.");
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/reviews", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ userID, lotID }),
      });

      if (!res.ok) {
        alert("Delete failed: " + (await res.text()));
        return;
      }

      await res.json();
      loadReviews();
    } catch (e) {
      console.error("Delete error:", e);
      alert("Failed to delete review.");
    }
  }

  // ---------------------
  // Render
  // ---------------------
  return (
    <div className="p-4 flex flex-col gap-6">

      {/* Lot Dropdown */}
      <div className="w-64">
        <Select value={selectedLot} onValueChange={setSelectedLot}>
          <SelectTrigger>
            <SelectValue placeholder="Select Lot" />
          </SelectTrigger>
          <SelectContent>
            {lots.map((lot) => (
              <SelectItem key={lot.id} value={lot.id}>
                {lot.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto overflow-y-hidden rounded-lg border w-full">
        <Table
          className="
            text-sm
            [& th]:px-2 [& td]:px-2 
            [& th]:py-1 [& td]:py-1

            /* Title column narrower */
            [& th:nth-child(2)]:w-[90px]
            [& td:nth-child(2)]:w-[90px]

            /* DESCRIPTION — FIXED WIDTH + MULTILINE + SCROLLABLE */
            [& th:nth-child(3)]:w-[220px]
            [& td:nth-child(3)]:w-[220px]
            [& td:nth-child(3)]:max-h-[85px]
            [& td:nth-child(3)]:overflow-y-auto
            [& td:nth-child(3)]:whitespace-pre-wrap
            [& td:nth-child(3)]:break-words

            /* CreatedAt & Delete tighter */
            [& th:nth-last-child(2)]:w-[110px]
            [& th:last-child]:w-[60px]

            [& td:nth-last-child(2)]:whitespace-nowrap
            [& td:last-child]:text-center
          "
        >
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Delete</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6}>Loading...</TableCell>
              </TableRow>
            )}

            {!loading && reviews.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>No reviews found.</TableCell>
              </TableRow>
            )}

            {!loading &&
              reviews.length > 0 &&
              reviews.map((r) => (
                <TableRow key={`${r.userID}-${r.lotID}`}>
                  <TableCell>{r.username}</TableCell>
                  <TableCell>{r.title}</TableCell>

                  {/* DESCRIPTION SCROLL BOX */}
                  <TableCell>
                    <div className="max-h-[85px] overflow-y-auto whitespace-pre-wrap break-words pr-1">
                      {r.description?.String || ""}
                    </div>
                  </TableCell>

                  <TableCell>{r.score}</TableCell>
                  <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>

                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="px-2 py-1"
                      onClick={() => deleteReview(r.userID, r.lotID)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

          </TableBody>
        </Table>
      </div>
    </div>
  );
}
