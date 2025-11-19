"use client";

import { useEffect, useState } from "react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ReviewCount = {
  id: string;
  name: string;
  totalReviews: number;
};

function ReviewSectionCards() {
  const [lots, setLots] = useState<ReviewCount[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://localhost:8080/api/countOfReviewsPerLot", {
          credentials: "include",
        });

        const apiData: ReviewCount[] = await res.json();

        const order = [
          "Founders 1",
          "Founders 2",
          "Founders 3",
          "Founders 4",
          "Founders 5",
          "Commencement",
        ];

        const completeList: ReviewCount[] = order.map((name) => {
          const found = apiData.find((lot) => lot.name === name);
          return (
            found || {
              id: crypto.randomUUID(),
              name,
              totalReviews: 0,
            }
          );
        });

        setLots(completeList);
      } catch (e) {
        console.error("Failed to load review counts:", e);
      }
    }

    load();
  }, []);

  return (
    <div
      className="
        w-full 
        overflow-x-auto 
        overflow-y-hidden 
        pb-4 
        whitespace-nowrap 
        snap-x 
        snap-mandatory 
        scrollbar-thin 
        scrollbar-thumb-muted-foreground/30 
        scrollbar-track-transparent
      "
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div className="inline-flex gap-4 px-4">
        {lots.map((lot) => {
          const count = lot.totalReviews ?? 0;

          return (
            <Card
              key={lot.id}
              className="w-64 shrink-0 snap-start flex flex-col justify-center items-center text-center"
            >
              <CardHeader className="flex flex-col items-center text-center p-2">

                {/* Lot name – bigger + single-line */}
                <div className="text-lg font-semibold whitespace-nowrap">
                  {lot.name} Reviews
                </div>

                {/* Count – smaller + less bold */}
                <div className="text-2xl font-medium mt-1">
                  {count}
                </div>

              </CardHeader>
            </Card>

          );
        })}
      </div>
    </div>
  );
}

export default ReviewSectionCards;
