"use client";

import { useEffect, useState } from "react";
import { IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ReviewCount = {
  id: string;
  name: string;
  totalReviews: number;
};

function SectionCardLots() {
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
      style={{
        WebkitOverflowScrolling: "touch", // smooth mobile scrolling
      }}
    >
      {/* Inner scrolling row — ensures only this part scrolls */}
      <div className="inline-flex gap-4 px-4">
        {lots.map((lot) => {
          const count = lot.totalReviews ?? 0;
          const isUp = count > 0;

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

                <CardAction>
                  <Badge variant="outline">
                    {isUp ? <IconTrendingUp /> : <IconTrendingDown />}
                    {isUp ? "+3.2%" : "0%"}
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
                      No reviews yet <IconTrendingDown className="size-4" />
                    </>
                  )}
                </div>

                <div className="text-muted-foreground">
                  {isUp
                    ? "User review activity detected"
                    : "This lot currently has no reviews"}
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default SectionCardLots;
