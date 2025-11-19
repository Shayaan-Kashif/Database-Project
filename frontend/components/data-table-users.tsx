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
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/app/stores/useAuthStore";

type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  parkingLotID: string | null;
  createdAt: string;
  updatedAt: string;
  totalReviews?: number; 
  totalLogs?: number;    
};

export default function DataTableUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);

      try {
        const [usersRes, reviewsRes, logsRes] = await Promise.all([
          fetch("http://localhost:8080/api/users", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
          }),
          fetch("http://localhost:8080/api/countOfReviewsPerUser", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
          }),
          fetch("http://localhost:8080/api/countOfLogsPerUser", {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
          }),
        ]);

        const usersData = await usersRes.json();
        const reviewsData = await reviewsRes.json();
        const logsData = await logsRes.json();     

        const merged = usersData.map((u: User) => {
          const reviewMatch = reviewsData.find((r: any) => r.id === u.id);
          const logMatch = logsData.find((l: any) => l.id === u.id);

          return {
            ...u,
            totalReviews: reviewMatch?.totalReviews ?? 0,
            totalLogs: logMatch?.totalEntries ?? 0,
          };
        });

        setUsers(merged);
      } catch (e) {
        console.error("Failed to load users:", e);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }

    if (token) loadUsers();
  }, [token]);

  return (
    <div className="p-4 flex flex-col gap-6">
      <h2 className="text-xl font-semibold">All Users</h2>

      <div className="overflow-x-auto rounded-lg border shadow-sm bg-white">
        <Table className="text-sm [&_*]:px-3 [&_*]:py-2">
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-center">Role</TableHead>
              <TableHead className="text-center">Parking Lot</TableHead>
              <TableHead className="text-center">Number of Reviews</TableHead>
              <TableHead className="text-center">Number of Logs</TableHead>
              <TableHead className="text-center">Created</TableHead>
              <TableHead className="text-center">Updated</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={10}>Loading…</TableCell>
              </TableRow>
            )}

            {!loading &&
              users.map((u) => (
                <TableRow key={u.id} className="hover:bg-muted/30">
                  <TableCell>{u.id}</TableCell>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>

                  <TableCell className="text-center">
                    <Badge variant={u.role === "admin" ? "secondary" : "outline"}>
                      {u.role}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-center">
                    {u.parkingLotID ?? "N/A"}
                  </TableCell>

                  {/* Display review count */}
                  <TableCell className="text-center">{u.totalReviews}</TableCell>

                  {/* Display log count */}
                  <TableCell className="text-center">{u.totalLogs}</TableCell>

                  <TableCell className="text-center">
                    {new Date(u.createdAt).toLocaleString()}
                  </TableCell>

                  <TableCell className="text-center">
                    {new Date(u.updatedAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}

            {!loading && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-4 text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
