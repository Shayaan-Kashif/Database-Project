"use client"

import * as React from "react"
import {
  IconTrendingUp,
  IconChevronDown,
  IconLayoutColumns,
  IconPlus,
} from "@tabler/icons-react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

// Type definitions
interface TopRatedLot {
  lotID: string
  lotName: string
  averageRating: number
  reviewCount: number
}

interface AvgTimeLot {
  lotID: string
  lotName: string
  avgTimeParked: string
  logCount: number
}

// Columns for Best Rated Lots
const ratedLotsColumns: ColumnDef<TopRatedLot>[] = [
  {
    accessorKey: "rank",
    header: "Rank",
    cell: ({ row }) => (
      <div className="font-medium">#{row.index + 1}</div>
    ),
  },
  {
    accessorKey: "lotName",
    header: "Parking Lot",
    cell: ({ row }) => (
      <div className="font-medium">{row.original.lotName}</div>
    ),
  },
  {
    accessorKey: "averageRating",
    header: "Average Rating",
    cell: ({ row }) => {
      const rating = Number(row.original.averageRating ?? 0)
      return (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            ⭐ {rating.toFixed(2)}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "reviewCount",
    header: "Number of Reviews",
    cell: ({ row }) => {
      const count = row.original.reviewCount ?? 0
      return (
        <div className="text-muted-foreground">
          {count} reviews
        </div>
      )
    },
  },
]

// Columns for Avg Time Parked
const avgTimeColumns: ColumnDef<AvgTimeLot>[] = [
  {
    accessorKey: "rank",
    header: "Rank",
    cell: ({ row }) => (
      <div className="font-medium">#{row.index + 1}</div>
    ),
  },
  {
    accessorKey: "lotName",
    header: "Parking Lot",
    cell: ({ row }) => (
      <div className="font-medium">{row.original.lotName}</div>
    ),
  },
  {
    accessorKey: "avgTimeParked",
    header: "Average Time Parked",
    cell: ({ row }) => (
      <Badge variant="outline" className="font-mono">
        {row.original.avgTimeParked}
      </Badge>
    ),
  },
  {
    accessorKey: "logCount",
    header: "Total Sessions",
    cell: ({ row }) => {
      const count = row.original.logCount ?? 0
      return (
        <div className="text-muted-foreground">
          {count} sessions
        </div>
      )
    },
  },
]

export function DataTable() {
  const [activeTab, setActiveTab] = React.useState("best-rated")
  const [topRatedLots, setTopRatedLots] = React.useState<TopRatedLot[]>([])
  const [avgTimeLots, setAvgTimeLots] = React.useState<AvgTimeLot[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Fetch Best Rated Lots
  React.useEffect(() => {
    const fetchTopRatedLots = async () => {
      try {
        setLoading(true)
        
        // First, get all parking lots
        const lotsResponse = await fetch("http://localhost:8080/api/parkingLots")
        if (!lotsResponse.ok) {
          throw new Error(`HTTP error! status: ${lotsResponse.status}`)
        }
        const lots = await lotsResponse.json()
        
        // Then, get review counts per lot
        const reviewCountsResponse = await fetch("http://localhost:8080/api/countOfReviewsPerLot")
        const reviewCounts = reviewCountsResponse.ok ? await reviewCountsResponse.json() : []
        
        // Fetch average rating for each lot
        const ratedLotsPromises = lots.map(async (lot: any) => {
          try {
            const ratingResponse = await fetch(
              `http://localhost:8080/api/averageLotRating/${lot.id}`
            )
            
            if (!ratingResponse.ok) {
              return null
            }
            
            const ratingData = await ratingResponse.json()
            
            // Find review count for this lot
            const reviewCount = reviewCounts.find((r: any) => 
              r.id === lot.id
            )
            
            return {
              lotID: lot.id,
              lotName: lot.name,
              averageRating: Number(ratingData.averageRating || ratingData.average_rating || 0),
              reviewCount: reviewCount?.totalReviews || 0,
            }
          } catch {
            return null
          }
        })
        
        const ratedLots = (await Promise.all(ratedLotsPromises))
          .filter((lot): lot is TopRatedLot => lot !== null)
          .sort((a, b) => b.averageRating - a.averageRating) // Sort by rating descending
        
        console.log("Top Rated Lots:", ratedLots)
        setTopRatedLots(ratedLots)
        setError(null)
      } catch (err) {
        console.error("Error fetching top rated lots:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    if (activeTab === "best-rated") {
      fetchTopRatedLots()
    }
  }, [activeTab])

  // Fetch Avg Time Parked by Lot
  React.useEffect(() => {
    const fetchAvgTimeData = async () => {
      try {
        setLoading(true)
        const response = await fetch("http://localhost:8080/api/countOfLogsPerLot")
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        
        // Transform the data to match our interface
        // Adjust based on actual API response structure
        const transformedData: AvgTimeLot[] = data.map((item: any) => ({
          lotID: item.lotID || item.id,
          lotName: item.lotName || item.name,
          avgTimeParked: item.avgTimeParked || "N/A",
          logCount: item.logCount || item.count || 0,
        }))
        
        setAvgTimeLots(transformedData)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    if (activeTab === "avg-time") {
      fetchAvgTimeData()
    }
  }, [activeTab])

  // Table configuration for Best Rated Lots
  const [ratedSorting, setRatedSorting] = React.useState<SortingState>([
    { id: "averageRating", desc: true }
  ])

  const ratedTable = useReactTable({
    data: topRatedLots,
    columns: ratedLotsColumns,
    state: {
      sorting: ratedSorting,
    },
    onSortingChange: setRatedSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  // Table configuration for Avg Time
  const [timeSorting, setTimeSorting] = React.useState<SortingState>([])

  const timeTable = useReactTable({
    data: avgTimeLots,
    columns: avgTimeColumns,
    state: {
      sorting: timeSorting,
    },
    onSortingChange: setTimeSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="best-rated">Best Rated Lots</SelectItem>
            <SelectItem value="avg-time">Avg Time Parked</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="hidden @4xl/main:flex">
          <TabsTrigger value="best-rated">
            Best Rated Lots
          </TabsTrigger>
          <TabsTrigger value="avg-time">
            Avg Time Parked by Lot
          </TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {(activeTab === "best-rated" ? ratedTable : timeTable)
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Best Rated Lots Tab */}
      <TabsContent
        value="best-rated"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-red-800 font-medium">Error loading data</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {ratedTable.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {ratedTable.getRowModel().rows?.length ? (
                  ratedTable.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={ratedLotsColumns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      {/* Avg Time Parked Tab */}
      <TabsContent
        value="avg-time"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-red-800 font-medium">Error loading data</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {timeTable.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {timeTable.getRowModel().rows?.length ? (
                  timeTable.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={avgTimeColumns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}