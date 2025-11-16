"use client";

import { useEffect, useState } from "react";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ParkingLot = {
  id: string;
  name: string;
  slots: number;
  ocupiedSlots: number; // your API version
};

export function SectionCards() {
  const [lots, setLots] = useState<ParkingLot[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:8080/api/parkingLots", {
          credentials: "include",
        });

        const data: ParkingLot[] = await res.json();

        // custom ordering
        const order = [
          "Founders 1",
          "Founders 2",
          "Founders 3",
          "Founders 4",
          "Founders 5",
          "Commencement",
        ];

        const ordered = data.sort((a, b) => {
          const indexA = order.indexOf(a.name);
          const indexB = order.indexOf(b.name);

          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return a.name.localeCompare(b.name);
        });

        setLots(ordered);
      } catch (e) {
        console.error("Failed to load lots:", e);
      }
    }

    load();
  }, []);

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex gap-4 px-4 min-w-max">
        {lots.map((lot) => {
          const available = lot.slots - lot.ocupiedSlots;
          const isUp = available > 0;

          return (
            <Card key={lot.id} className="@container/card w-64 shrink-0">
              <CardHeader>
                <CardDescription>{lot.name} Available Spots</CardDescription>

                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {available}
                </CardTitle>

                <CardAction>
                  <Badge variant="outline">
                    {isUp ? <IconTrendingUp /> : <IconTrendingDown />}
                    {isUp ? "+12.5%" : "-20%"}
                  </Badge>
                </CardAction>
              </CardHeader>

              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="flex gap-2 font-medium">
                  {isUp ? (
                    <>
                      Trending up <IconTrendingUp className="size-4" />
                    </>
                  ) : (
                    <>
                      Trending down <IconTrendingDown className="size-4" />
                    </>
                  )}
                </div>

                <div className="text-muted-foreground">
                  {isUp
                    ? "Visitors for the last 6 months"
                    : "Engagement needs attention"}
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
