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
              className="
                w-64 
                shrink-0 
                snap-start
              "
            >
              <CardHeader>
                <CardDescription>{lot.name} Reviews</CardDescription>

                <CardTitle className="text-2xl font-semibold">
                  {count}
                </CardTitle>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default ReviewSectionCards;
