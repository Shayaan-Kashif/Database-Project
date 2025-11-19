"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type ParkingLot = {
  id: string;
  name: string;
  slots: number;
  ocupiedSlots: number;
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

          return (
            <Card
              key={lot.id}
              className="w-64 h-40 flex flex-col justify-center items-center text-center"
            >
              <CardHeader className="flex flex-col items-center text-center p-2">
    
                {/* Lot name on one line */}
                <div className="text-lg font-semibold whitespace-nowrap">
                  {lot.name}
                </div>

                {/* Number (smaller + less bold) */}
                <div className="text-2xl font-medium mt-1">
                  {available}
                </div>

                <div className="text-sm text-muted-foreground">
                  Available Spots
                </div>

              </CardHeader>
            </Card>


          );
        })}
      </div>
    </div>
  );
}
