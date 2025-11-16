"use client"

import * as React from "react"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconLayoutColumns,
  IconRefresh,
  IconStar,
  IconStarFilled,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { z } from "zod"

// Schemas for different data types
const ratingSchema = z.object({
  id: z.string(),
  name: z.string(),
  avgScore: z.string(),
  totalReviews: z.number().optional(),
})

const usageSchema = z.object({
  id: z.string(),
  name: z.string(),
  totalEntries: z.number(),
})

type Rating = z.infer<typeof ratingSchema>
type Usage = z.infer<typeof usageSchema>

// Star Rating Component
function StarRating({ rating }: { rating: number }) {
  const stars = []
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(
        <IconStarFilled
          key={i}
          className="size-4 fill-yellow-400 text-yellow-400"
        />
      )
    } else if (i === fullStars && hasHalfStar) {
      stars.push(
        <IconStar
          key={i}
          className="size-4 fill-yellow-400/50 text-yellow-400"
        />
      )
    } else {
      stars.push(
        <IconStar key={i} className="size-4 text-gray-300" />
      )
    }
  }

  return <div className="flex gap-0.5">{stars}</div>
}

// Rank Badge Component
function RankBadge({ rank }: { rank: number }) {
  const colors = {
    1: "bg-yellow-100 text-yellow-800 border-yellow-300",
    2: "bg-gray-100 text-gray-800 border-gray-300",
    3: "bg-orange-100 text-orange-800 border-orange-300",
  }

  const color = colors[rank as keyof typeof colors] || "bg-blue-100 text-blue-800 border-blue-300"

  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full border-2 font-bold ${color}`}>
      {rank}
    </span>
  )
}

// Column definitions for Ratings
const ratingsColumns: ColumnDef<Rating & { rank: number }>[] = [
  {
    accessorKey: "rank",
    header: "Rank",
    cell: ({ row }) => (
      <div className="flex justify-center">
        <RankBadge rank={row.original.rank} />
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: "Parking Lot Name",
    cell: ({ row }) => (
      <div className="font-medium">{row.original.name}</div>
    ),
  },
  {
    accessorKey: "avgScore",
    header: "Average Rating",
    cell: ({ row }) => {
      const score = parseFloat(row.original.avgScore)
      return (
        <div className="flex items-center gap-3">
          <StarRating rating={score} />
          <span className="font-semibold">{score.toFixed(2)}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "totalReviews",
    header: "Total Reviews",
    cell: ({ row }) => (
      <div className="text-center">{row.original.totalReviews || 0}</div>
    ),
  },
]

// Column definitions for Usage
const usageColumns: ColumnDef<Usage & { rank: number; percentage: number }>[] = [
  {
    accessorKey: "rank",
    header: "Rank",
    cell: ({ row }) => (
      <div className="flex justify-center">
        <RankBadge rank={row.original.rank} />
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: "Parking Lot Name",
    cell: ({ row }) => (
      <div className="font-medium">{row.original.name}</div>
    ),
  },
  {
    accessorKey: "totalEntries",
    header: "Total Entries",
    cell: ({ row }) => (
      <div className="text-center font-semibold">{row.original.totalEntries}</div>
    ),
  },
  {
    id: "percentage",
    header: "Usage Share",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${row.original.percentage}%` }}
          />
        </div>
        <span className="text-sm font-medium min-w-[45px]">
          {row.original.percentage.toFixed(1)}%
        </span>
      </div>
    ),
  },
]

export function DataTable() {
  const [ratings, setRatings] = React.useState<Rating[]>([])
  const [usage, setUsage] = React.useState<Usage[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState("ratings")

  const [sortingRatings, setSortingRatings] = React.useState<SortingState>([
    { id: "avgScore", desc: true }
  ])
  const [sortingUsage, setSortingUsage] = React.useState<SortingState>([
    { id: "totalEntries", desc: true }
  ])

  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [paginationRatings, setPaginationRatings] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [paginationUsage, setPaginationUsage] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch all parking lots first
      const lotsResponse = await fetch("http://localhost:8080/api/parkingLots")
      if (!lotsResponse.ok) throw new Error("Failed to fetch parking lots")
      const lotsData = await lotsResponse.json()
      
      // Fetch review counts for all lots
      const reviewsResponse = await fetch("http://localhost:8080/api/countOfReviewsPerLot")
      if (!reviewsResponse.ok) throw new Error("Failed to fetch review counts")
      const reviewsData = await reviewsResponse.json()

      // Fetch average rating for each lot
      const ratingsPromises = lotsData.map(async (lot: any) => {
        try {
          const ratingResponse = await fetch(`http://localhost:8080/api/averageLotRating/${lot.id}`)
          if (!ratingResponse.ok) {
            return {
              id: lot.id,
              name: lot.name,
              avgScore: "0",
              totalReviews: 0
            }
          }
          const ratingData = await ratingResponse.json()
          const reviewInfo = reviewsData.find((r: any) => r.id === lot.id)
          
          return {
            id: lot.id,
            name: lot.name,
            avgScore: ratingData.averageRating || "0",
            totalReviews: reviewInfo?.totalReviews || 0
          }
        } catch {
          return {
            id: lot.id,
            name: lot.name,
            avgScore: "0",
            totalReviews: 0
          }
        }
      })

      const allRatings = await Promise.all(ratingsPromises)
      setRatings(allRatings)

      // Fetch usage data
      const usageResponse = await fetch("http://localhost:8080/api/countOfLogsPerLot")
      if (!usageResponse.ok) throw new Error("Failed to fetch usage data")
      const usageData = await usageResponse.json()
      setUsage(usageData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // Prepare data with rankings and percentages
  const ratingsWithRank = React.useMemo(() => {
    return ratings
      .sort((a, b) => parseFloat(b.avgScore) - parseFloat(a.avgScore))
      .map((item, index) => ({ ...item, rank: index + 1 }))
  }, [ratings])

  const usageWithRank = React.useMemo(() => {
    const totalEntries = usage.reduce((sum, item) => sum + item.totalEntries, 0)
    return usage
      .sort((a, b) => b.totalEntries - a.totalEntries)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        percentage: totalEntries > 0 ? (item.totalEntries / totalEntries) * 100 : 0,
      }))
  }, [usage])

  // Tables
  const ratingsTable = useReactTable({
    data: ratingsWithRank,
    columns: ratingsColumns,
    state: {
      sorting: sortingRatings,
      columnVisibility,
      pagination: paginationRatings,
    },
    onSortingChange: setSortingRatings,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPaginationRatings,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const usageTable = useReactTable({
    data: usageWithRank,
    columns: usageColumns,
    state: {
      sorting: sortingUsage,
      columnVisibility,
      pagination: paginationUsage,
    },
    onSortingChange: setSortingUsage,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPaginationUsage,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const currentTable = 
    activeTab === "ratings" ? ratingsTable :
    usageTable

  const currentPagination = 
    activeTab === "ratings" ? paginationRatings :
    paginationUsage

  const setPagination = 
    activeTab === "ratings" ? setPaginationRatings :
    setPaginationUsage

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading parking data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("ratings")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "ratings"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Ratings ({ratings.length})
          </button>
          <button
            onClick={() => setActiveTab("usage")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "usage"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Usage ({usage.length})
          </button>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <IconRefresh className="size-4" />
          Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              {currentTable.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentTable.getRowModel().rows?.length ? (
                currentTable.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={currentTable.getAllColumns().length}
                    className="h-24 text-center text-gray-500"
                  >
                    No data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between px-4">
        <div className="text-sm text-gray-700">
          Showing {currentTable.getRowModel().rows.length} of{" "}
          {currentTable.getFilteredRowModel().rows.length} results
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => currentTable.setPageIndex(0)}
            disabled={!currentTable.getCanPreviousPage()}
            className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            <IconChevronsLeft className="size-4" />
          </button>
          <button
            onClick={() => currentTable.previousPage()}
            disabled={!currentTable.getCanPreviousPage()}
            className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            <IconChevronLeft className="size-4" />
          </button>
          <span className="text-sm">
            Page {currentPagination.pageIndex + 1} of{" "}
            {currentTable.getPageCount()}
          </span>
          <button
            onClick={() => currentTable.nextPage()}
            disabled={!currentTable.getCanNextPage()}
            className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            <IconChevronRight className="size-4" />
          </button>
          <button
            onClick={() => currentTable.setPageIndex(currentTable.getPageCount() - 1)}
            disabled={!currentTable.getCanNextPage()}
            className="p-2 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            <IconChevronsRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
