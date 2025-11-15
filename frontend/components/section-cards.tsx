"use client"

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// TypeScript interface for parking lot data
interface ParkingLot {
  id: string
  name: string
  slots: number
  ocupiedSlots: number
}

export function SectionCards() {
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchParkingLots = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/parkingLots")
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data: ParkingLot[] = await response.json()
        setParkingLots(data)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch parking lots")
        setLoading(false)
      }
    }

    fetchParkingLots()
    
    // Optional: Poll every 30 seconds for real-time updates
    const interval = setInterval(fetchParkingLots, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Calculate available spots
  const getAvailableSpots = (lot: ParkingLot) => {
    return lot.slots - lot.ocupiedSlots
  }

  // Calculate percentage change (you can customize this logic)
  const getPercentageChange = (lot: ParkingLot) => {
    // Example: Calculate based on occupancy rate
    const occupancyRate = (lot.ocupiedSlots / lot.slots) * 100
    
    if (occupancyRate < 30) return { value: 12.5, trending: "up" }
    if (occupancyRate < 60) return { value: 4.5, trending: "up" }
    if (occupancyRate < 80) return { value: 2.0, trending: "up" }
    return { value: 20, trending: "down" }
  }

  // Get status message based on availability
  const getStatusMessage = (lot: ParkingLot) => {
    const available = getAvailableSpots(lot)
    const occupancyRate = (lot.ocupiedSlots / lot.slots) * 100
    
    if (occupancyRate === 100) {
      return { title: "Lot is full", description: "No spots available" }
    } else if (occupancyRate > 80) {
      return { title: "Limited availability", description: "Very few spots remaining" }
    } else if (occupancyRate > 60) {
      return { title: "Filling up", description: "Moderate availability" }
    } else if (occupancyRate > 30) {
      return { title: "Good availability", description: "Plenty of spots available" }
    } else {
      return { title: "Excellent availability", description: "Most spots available" }
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="@container/card animate-pulse">
            <CardHeader>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-8 w-24 bg-gray-200 rounded mt-2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 lg:px-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading Parking Lots</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Filter to only show Founders lots (optional)
  const displayLots = parkingLots.filter(lot => 
    lot.name.toLowerCase().includes("founders")
  ).slice(0, 4)

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {displayLots.map((lot) => {
        const availableSpots = getAvailableSpots(lot)
        const percentageChange = getPercentageChange(lot)
        const status = getStatusMessage(lot)
        const isTrendingUp = percentageChange.trending === "up"

        return (
          <Card key={lot.id} className="@container/card">
            <CardHeader>
              <CardDescription>{lot.name} Available Spots</CardDescription>
              <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                {availableSpots}
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  {isTrendingUp ? <IconTrendingUp /> : <IconTrendingDown />}
                  {isTrendingUp ? "+" : "-"}{percentageChange.value}%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                {status.title} {isTrendingUp ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
              </div>
              <div className="text-muted-foreground">
                {status.description}
              </div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}