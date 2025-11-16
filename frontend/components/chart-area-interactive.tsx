"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ----------------------------
// LOTS AVAILABLE
// ----------------------------
const lots = [
  { id: "f51d8400-a620-4167-af9a-eca19e564919", name: "Founders 1" },
  { id: "ee871905-7ee7-45d2-97de-fcecb181f53a", name: "Founders 2" },
  { id: "836cca80-9a37-4e19-9209-f039676dcedc", name: "Founders 3" },
  { id: "41061519-b640-4921-b02a-0e886a48eb60", name: "Founders 4" },
  { id: "dc8b34f8-5822-4391-b7ef-13061fb7d0ee", name: "Founders 5" },
  { id: "3cb5c1f0-40ea-4aad-b265-3af01fc1e9b4", name: "Commencement" },
]

// ----------------------------
// CHART CONFIG (same)
// ----------------------------
const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
} satisfies ChartConfig

// ----------------------------
// MAIN COMPONENT
// ----------------------------
export function ChartAreaInteractive() {
  const isMobile = useIsMobile()

  const [selectedLot, setSelectedLot] = React.useState(lots[0].id)
  const [history, setHistory] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // ----------------------------
  // FETCH LOT HISTORY ON CHANGE
  // ----------------------------
  React.useEffect(() => {
    async function fetchHistory() {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(
          `http://localhost:8080/api/parkingHistory/${selectedLot}`,
          { credentials: "include" }
        );

        if (!res.ok) {
          throw new Error(`Failed: ${res.status}`)
        }

        const data = await res.json()

        // EXPECTED FORMAT:
        // { date: "...", desktop: X, mobile: Y }
        setHistory(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(String(err))
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [selectedLot])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Parking Lot History</CardTitle>
        <CardDescription>Select a parking lot to view history</CardDescription>

        {/* ---------------------------- */}
        {/* LOT DROPDOWN MENU            */}
        {/* ---------------------------- */}
        <CardAction>
          <Select value={selectedLot} onValueChange={setSelectedLot}>
            <SelectTrigger className="w-60" size="sm">
              <SelectValue placeholder="Choose a Lot" />
            </SelectTrigger>
            <SelectContent>
              {lots.map((lot) => (
                <SelectItem
                  key={lot.id}
                  value={lot.id}
                  className="rounded-lg"
                >
                  {lot.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading && (
          <div className="text-muted-foreground text-sm">
            Loading history...
          </div>
        )}

        {error && (
          <div className="text-destructive text-sm">
            Failed to load history: {error}
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <div className="text-muted-foreground text-sm">
            No history found for this lot.
          </div>
        )}

        {!loading && !error && history.length > 0 && (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={history}>
              <defs>
                <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-desktop)" stopOpacity={1} />
                  <stop offset="95%" stopColor="var(--color-desktop)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-mobile)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-mobile)" stopOpacity={0.1} />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} />

              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />

              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                    indicator="dot"
                  />
                }
              />

              <Area
                dataKey="mobile"
                type="natural"
                fill="url(#fillMobile)"
                stroke="var(--color-mobile)"
                stackId="a"
              />
              <Area
                dataKey="desktop"
                type="natural"
                fill="url(#fillDesktop)"
                stroke="var(--color-desktop)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
