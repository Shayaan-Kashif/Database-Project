"use client"

import * as React from "react"
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconRefresh,
  IconStar,
  IconStarFilled,
  IconCar,
  IconParking,
  IconTrendingUp,
  IconTrendingDown,
} from "@tabler/icons-react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"

// Types
interface ParkingLot {
  id: string
  name: string
  slots: number
  ocupiedSlots: number
}

interface Rating {
  id: string
  name: string
  avgScore: string
  totalReviews: number
}

interface Usage {
  id: string
  name: string
  totalEntries: number
}

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
  const colors: Record<number, string> = {
    1: "bg-yellow-100 text-yellow-800 border-yellow-300",
    2: "bg-gray-100 text-gray-800 border-gray-300",
    3: "bg-orange-100 text-orange-800 border-orange-300",
  }

  const color = colors[rank] || "bg-blue-100 text-blue-800 border-blue-300"

  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full border-2 font-bold text-sm ${color}`}>
      {rank}
    </span>
  )
}

// Stats Card Component
function StatsCard({ title, value, subtitle, icon: Icon, trend }: {
  title: string
  value: string | number
  subtitle: string
  icon: any
  trend?: { value: string; positive: boolean }
}) {
  return (
    <div className="bg-white rounded-lg border p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <Icon className="size-6 text-blue-600" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1">
          {trend.positive ? (
            <IconTrendingUp className="size-4 text-green-600" />
          ) : (
            <IconTrendingDown className="size-4 text-red-600" />
          )}
          <span className={`text-sm font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.value}
          </span>
          <span className="text-sm text-gray-500">vs last period</span>
        </div>
      )}
    </div>
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
      <div className="font-medium text-gray-900">{row.original.name}</div>
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
          <span className="font-semibold text-gray-900">{score.toFixed(2)}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "totalReviews",
    header: "Total Reviews",
    cell: ({ row }) => (
      <div className="text-center text-gray-700">{row.original.totalReviews || 0}</div>
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
      <div className="font-medium text-gray-900">{row.original.name}</div>
    ),
  },
  {
    accessorKey: "totalEntries",
    header: "Total Entries",
    cell: ({ row }) => (
      <div className="text-center font-semibold text-gray-900">{row.original.totalEntries}</div>
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
        <span className="text-sm font-medium min-w-[45px] text-gray-700">
          {row.original.percentage.toFixed(1)}%
        </span>
      </div>
    ),
  },
]

export default function ParkingLotsManagement() {
  const [parkingLots, setParkingLots] = React.useState<ParkingLot[]>([])
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
      setParkingLots(lotsData)
      
      // Fetch review counts for all lots
      const reviewsResponse = await fetch("http://localhost:8080/api/countOfReviewsPerLot")
      if (!reviewsResponse.ok) throw new Error("Failed to fetch review counts")
      const reviewsData = await reviewsResponse.json()

      // Fetch average rating for each lot
      const ratingsPromises = lotsData.map(async (lot: ParkingLot) => {
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

  // Calculate stats
  const totalSpots = parkingLots.reduce((sum, lot) => sum + lot.slots, 0)
  const totalOccupied = parkingLots.reduce((sum, lot) => sum + lot.ocupiedSlots, 0)
  const occupancyRate = totalSpots > 0 ? ((totalOccupied / totalSpots) * 100).toFixed(1) : "0"
  const totalReviews = ratings.reduce((sum, r) => sum + (r.totalReviews || 0), 0)
  const avgRating = ratings.length > 0 
    ? (ratings.reduce((sum, r) => sum + parseFloat(r.avgScore), 0) / ratings.length).toFixed(2)
    : "0.00"

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
  })

  const currentTable = activeTab === "ratings" ? ratingsTable : usageTable
  const currentPagination = activeTab === "ratings" ? paginationRatings : paginationUsage

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading parking data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-red-50 rounded-full p-4 inline-flex mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Parking Lots Management</h1>
              <p className="text-gray-600 mt-1">Monitor and analyze parking lot performance</p>
            </div>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <IconRefresh className="size-5" />
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Parking Lots"
            value={parkingLots.length}
            subtitle="Active locations"
            icon={IconParking}
          />
          <StatsCard
            title="Total Capacity"
            value={totalSpots.toLocaleString()}
            subtitle="Available parking spots"
            icon={IconCar}
          />
          <StatsCard
            title="Average Rating"
            value={avgRating}
            subtitle={`Based on ${totalReviews} reviews`}
            icon={IconStarFilled}
          />
          <StatsCard
            title="Occupancy Rate"
            value={`${occupancyRate}%`}
            subtitle={`${totalOccupied} / ${totalSpots} occupied`}
            icon={IconTrendingUp}
          />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b px-6 py-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("ratings")}
                className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                  activeTab === "ratings"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <IconStarFilled className="size-4" />
                  Ratings
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-sm">
                    {ratings.length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab("usage")}
                className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                  activeTab === "usage"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <IconCar className="size-4" />
                  Usage Statistics
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-sm">
                    {usage.length}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                {currentTable.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
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
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
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
                      className="h-32 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <IconParking className="size-12 text-gray-300" />
                        <p>No data available</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="border-t px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{currentTable.getRowModel().rows.length}</span> of{" "}
                <span className="font-medium">{currentTable.getFilteredRowModel().rows.length}</span> results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => currentTable.setPageIndex(0)}
                  disabled={!currentTable.getCanPreviousPage()}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <IconChevronsLeft className="size-5" />
                </button>
                <button
                  onClick={() => currentTable.previousPage()}
                  disabled={!currentTable.getCanPreviousPage()}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <IconChevronLeft className="size-5" />
                </button>
                <span className="text-sm font-medium px-4">
                  Page {currentPagination.pageIndex + 1} of{" "}
                  {currentTable.getPageCount()}
                </span>
                <button
                  onClick={() => currentTable.nextPage()}
                  disabled={!currentTable.getCanNextPage()}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <IconChevronRight className="size-5" />
                </button>
                <button
                  onClick={() => currentTable.setPageIndex(currentTable.getPageCount() - 1)}
                  disabled={!currentTable.getCanNextPage()}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <IconChevronsRight className="size-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
