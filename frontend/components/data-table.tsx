"use client"

import * as React from "react"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconTrendingUp,
  IconTrendingDown
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
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"

import { z } from "zod"
import { toast } from "sonner"
import { useIsMobile } from "@/hooks/use-mobile"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// -----------------------------
// ZOD SCHEMA
// -----------------------------
export const schema = z.object({
  id: z.number(),
  header: z.string(),
  type: z.string(),
  status: z.string(),
  target: z.string(),
  limit: z.string(),
  reviewer: z.string(),
})

// -----------------------------
// DRAG HANDLE
// -----------------------------
function DragHandle({ id: _id }: { id: number }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

// -----------------------------
// TABLE COLUMNS
// -----------------------------
const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
        />
      </div>
    ),
  },
  {
    accessorKey: "header",
    header: "Header",
    cell: ({ row }) => <TableCellViewer item={row.original} />,
  },
  {
    accessorKey: "type",
    header: "Section Type",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {row.original.type}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {row.original.status === "Done" ? (
          <IconCircleCheckFilled className="fill-green-500" />
        ) : (
          <IconLoader />
        )}
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "target",
    header: () => <div className="text-right">Target</div>,
    cell: ({ row }) => (
      <Input
        defaultValue={row.original.target}
        className="h-8 w-16 bg-transparent text-right"
      />
    ),
  },
  {
    accessorKey: "limit",
    header: () => <div className="text-right">Limit</div>,
    cell: ({ row }) => (
      <Input
        defaultValue={row.original.limit}
        className="h-8 w-16 bg-transparent text-right"
      />
    ),
  },
  {
    accessorKey: "reviewer",
    header: "Reviewer",
    cell: ({ row }) => row.original.reviewer,
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <IconDotsVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Make a copy</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

// -----------------------------
// DRAGGABLE ROW
// -----------------------------
function DraggableRow({ row }: { row: Row<any> }) {
  return (
    <TableRow data-state={row.getIsSelected() && "selected"}>
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

// -----------------------------
// LOT HELPERS
// -----------------------------
type Lot = Record<string, any>

function getLotName(lot: Lot) {
  return lot.name ?? lot.lot_name ?? "Parking Lot"
}
function getLotRating(lot: Lot) {
  const n = Number(lot.avgScore)
  return Number.isFinite(n) ? n : null
}
function getLotCapacity(lot: Lot) {
  const n = Number(lot.slots)
  return Number.isFinite(n) ? n : null
}

// -----------------------------
// MAIN COMPONENT
// -----------------------------
export function DataTable({ data: initialData }: { data: any[] }) {
  const isMobile = useIsMobile()
  const data = initialData

  const [activeTab, setActiveTab] = React.useState<
    "outline" | "top-rated-lots" | "full-lots" | "available-lots"
  >("outline")

  const [topRatedLots, setTopRatedLots] = React.useState<Lot[]>([])
  const [fullLots, setFullLots] = React.useState<Lot[]>([])
  const [availableLots, setAvailableLots] = React.useState<Lot[]>([])

  const [loadingTopRated, setLoadingTopRated] = React.useState(false)
  const [loadingFullLots, setLoadingFullLots] = React.useState(false)
  const [loadingAvailableLots, setLoadingAvailableLots] = React.useState(false)

  const [errorTopRated, setErrorTopRated] = React.useState<string | null>(null)
  const [errorFullLots, setErrorFullLots] = React.useState<string | null>(null)
  const [errorAvailableLots, setErrorAvailableLots] =
    React.useState<string | null>(null)

  // -----------------------------
  // FETCHES
  // -----------------------------
  React.useEffect(() => {
    async function fetchTopRated() {
      try {
        setLoadingTopRated(true)
        const res = await fetch("http://localhost:8080/api/topRatedLots", {
          credentials: "include",
        })
        const json = await res.json()
        setTopRatedLots(json)
      } catch (err) {
        setErrorTopRated(String(err))
      } finally {
        setLoadingTopRated(false)
      }
    }

    async function fetchFull() {
      try {
        setLoadingFullLots(true)
        const res = await fetch("http://localhost:8080/api/fullLots", {
          credentials: "include",
        })
        const json = await res.json()
        setFullLots(json)
      } catch (err) {
        setErrorFullLots(String(err))
      } finally {
        setLoadingFullLots(false)
      }
    }

    async function fetchAvailable() {
      try {
        setLoadingAvailableLots(true)
        const res = await fetch("http://localhost:8080/api/parkingLots", {
          credentials: "include",
        })
        const json = await res.json()

        const withAvailable = json.map((lot: any) => ({
          ...lot,
          available: Number(lot.slots) - Number(lot.ocupiedSlots),
        }))

        const filtered = withAvailable.filter((lot: any) => lot.available > 0)
        setAvailableLots(filtered)
      } catch (err) {
        setErrorAvailableLots(String(err))
      } finally {
        setLoadingAvailableLots(false)
      }
    }

    if (activeTab === "top-rated-lots" && topRatedLots.length === 0)
      fetchTopRated()

    if (activeTab === "full-lots" && fullLots.length === 0)
      fetchFull()

    if (activeTab === "available-lots" && availableLots.length === 0)
      fetchAvailable()
  }, [activeTab])

  // -----------------------------
  // TABLE INSTANCE
  // -----------------------------
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  // -----------------------------
  // UI: TABS WRAPPER (FIXED)
  // -----------------------------
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) =>
        setActiveTab(
          value as "outline" | "top-rated-lots" | "full-lots" | "available-lots"
        )
      }
      className="w-full flex-col gap-6"
    >
      {/* -------------------- HEADER -------------------- */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Select value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <SelectTrigger size="sm" className="w-fit @4xl/main:hidden">
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outline">Outline</SelectItem>
            <SelectItem value="top-rated-lots">Top Rated Lots</SelectItem>
            <SelectItem value="full-lots">Full Lots</SelectItem>
            <SelectItem value="available-lots">Available Lots</SelectItem>
          </SelectContent>
        </Select>

        <TabsList className="hidden @4xl/main:flex">
          <TabsTrigger value="outline">Outline</TabsTrigger>
          <TabsTrigger value="top-rated-lots">Top Rated Lots</TabsTrigger>
          <TabsTrigger value="full-lots">Full Lots</TabsTrigger>
          <TabsTrigger value="available-lots">Available Lots</TabsTrigger>
        </TabsList>
      </div>

      {/* -------------------------------------------------- */}
      {/* OUTLINE TAB */}
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <DraggableRow key={row.id} row={row} />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length}>No results.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      {/* -------------------------------------------------- */}
      {/* TOP RATED LOTS */}
      <TabsContent value="top-rated-lots" className="px-4 lg:px-6">
        {loadingTopRated && <div>Loading top rated lots...</div>}
        {errorTopRated && <div className="text-destructive">{errorTopRated}</div>}

        {!loadingTopRated && !errorTopRated && topRatedLots.length === 0 && (
          <div>No top rated lots found.</div>
        )}

        {!loadingTopRated && !errorTopRated && topRatedLots.length > 0 && (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                <TableRow>
                  <TableHead>Lot</TableHead>
                  <TableHead>Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topRatedLots.map((lot, i) => (
                  <TableRow key={i}>
                    <TableCell>{getLotName(lot)}</TableCell>
                    <TableCell>{getLotRating(lot) ?? "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      {/* -------------------------------------------------- */}
      {/* FULL LOTS */}
      <TabsContent value="full-lots" className="px-4 lg:px-6">
        {loadingFullLots && <div>Loading full lots...</div>}
        {errorFullLots && <div className="text-destructive">{errorFullLots}</div>}

        {!loadingFullLots && !errorFullLots && fullLots.length === 0 && (
          <div>No full lots found.</div>
        )}

        {!loadingFullLots && !errorFullLots && fullLots.length > 0 && (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                <TableRow>
                  <TableHead>Lot</TableHead>
                  <TableHead>Capacity</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {fullLots.map((lot, i) => (
                  <TableRow key={i}>
                    <TableCell>{getLotName(lot)}</TableCell>
                    <TableCell>{getLotCapacity(lot)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>

      {/* -------------------------------------------------- */}
      {/* AVAILABLE LOTS */}
      <TabsContent value="available-lots" className="px-4 lg:px-6">
        {loadingAvailableLots && <div>Loading available lots...</div>}
        {errorAvailableLots && (
          <div className="text-destructive">{errorAvailableLots}</div>
        )}

        {!loadingAvailableLots &&
          !errorAvailableLots &&
          availableLots.length === 0 && <div>No available lots found.</div>}

        {!loadingAvailableLots &&
          !errorAvailableLots &&
          availableLots.length > 0 && (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  <TableRow>
                    <TableHead>Lot</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Total Slots</TableHead>
                    <TableHead>Occupied</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {availableLots
                    .sort((a, b) => b.available - a.available)
                    .map((lot: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>{lot.name}</TableCell>
                        <TableCell>{lot.available}</TableCell>
                        <TableCell>{lot.slots}</TableCell>
                        <TableCell>{lot.ocupiedSlots}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
      </TabsContent>
    </Tabs>
  )
}

// -----------------------------
// Drawer Viewer Component
// -----------------------------
function TableCellViewer({ item }: { item: z.infer<typeof schema> }) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground px-0">
          {item.header}
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{item.header}</DrawerTitle>
          <DrawerDescription>Showing visitors trend</DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6 text-sm">
          <Separator />
          <form className="flex flex-col gap-4 mt-4">
            <Label>Header</Label>
            <Input defaultValue={item.header} />
          </form>
        </div>

        <DrawerFooter>
          <Button>Save</Button>
          <DrawerClose asChild>
            <Button variant="outline">Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
