import { Reveal } from "@/lib/animation"
import React, { useState, useMemo } from "react"
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface ColumnDef<T> {
  id?: string
  header: string | React.ReactNode
  accessorKey?: keyof T
  cell?: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string
  mobileLabel?: string
  hideOnMobile?: boolean
}

export interface DataTableFilter<T> {
  label: string
  key: keyof T
  options: { label: string; value: any }[]
}

export interface RowAction<T> {
  label: string
  icon?: React.ReactNode
  onClick: (item: T) => void
  variant?: "default" | "destructive"
  separatorBefore?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  searchKey?: keyof T | ((item: T) => string)
  searchPlaceholder?: string
  filters?: DataTableFilter<T>[]
  rowActions?: RowAction<T>[] | ((item: T) => RowAction<T>[])
  isLoading?: boolean
  emptyMessage?: string
  pageSize?: number
  pageSizeOptions?: number[]
  keyExtractor?: (item: T, index: number) => string
  headerExtra?: React.ReactNode
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchKey,
  searchPlaceholder = "Search records...",
  filters = [],
  rowActions,
  isLoading = false,
  emptyMessage = "No records found matching your criteria.",
  pageSize: initialPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  keyExtractor = (item, idx) => item.id || `row-${idx}`,
  headerExtra,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null
    direction: "asc" | "desc" | null
  }>({
    key: null,
    direction: null,
  })
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)

  // 1. Filtering & Searching
  const filteredData = useMemo(() => {
    let result = [...data]

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter((item) => {
        if (typeof searchKey === "function") {
          return searchKey(item).toLowerCase().includes(q)
        } else if (searchKey && item[searchKey] !== undefined) {
          return String(item[searchKey]).toLowerCase().includes(q)
        } else {
          // Default: search through all primitive values
          return Object.values(item).some(
            (val) =>
              val !== null &&
              val !== undefined &&
              typeof val !== "object" &&
              String(val).toLowerCase().includes(q)
          )
        }
      })
    }

    // Secondary filters
    Object.entries(activeFilters).forEach(([key, val]) => {
      if (val !== undefined && val !== "" && val !== "all") {
        result = result.filter((item) => String(item[key]) === String(val))
      }
    })

    // Sorting
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key!]
        const valB = b[sortConfig.key!]

        if (valA === valB) return 0
        if (valA === undefined || valA === null) return 1
        if (valB === undefined || valB === null) return -1

        let comparison = 0
        if (typeof valA === "number" && typeof valB === "number") {
          comparison = valA - valB
        } else {
          comparison = String(valA).localeCompare(String(valB))
        }

        return sortConfig.direction === "asc" ? comparison : -comparison
      })
    }

    return result
  }, [data, searchQuery, searchKey, activeFilters, sortConfig])

  // Pagination calculation
  const totalItems = filteredData.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, currentPage, pageSize])

  // Reset to page 1 on search or filter change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const handleFilterChange = (key: string, val: any) => {
    setActiveFilters((prev) => ({ ...prev, [key]: val }))
    setCurrentPage(1)
  }

  const toggleSort = (colKey?: keyof T) => {
    if (!colKey) return
    setSortConfig((prev) => {
      if (prev.key !== colKey) {
        return { key: colKey, direction: "asc" }
      }
      if (prev.direction === "asc") {
        return { key: colKey, direction: "desc" }
      }
      return { key: null, direction: null }
    })
  }

  const getActionsForItem = (item: T): RowAction<T>[] => {
    if (!rowActions) return []
    if (typeof rowActions === "function") {
      return rowActions(item)
    }
    return rowActions
  }

  return (
    <div className="space-y-4">
      {/* Search Bar, Filters & Action Extra */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className="pl-9 pr-9 h-10 rounded-xl bg-card border-border text-xs focus:ring-1 focus:ring-editorial-navy dark:focus:ring-editorial-sand"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          {filters.map((f) => (
            <select
              key={String(f.key)}
              value={activeFilters[String(f.key)] || "all"}
              onChange={(e) => handleFilterChange(String(f.key), e.target.value)}
              className="h-10 px-3 rounded-xl border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-editorial-navy dark:focus:ring-editorial-sand"
            >
              <option value="all">All {f.label}</option>
              {f.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
        </div>

        {headerExtra && (
          <div className="flex items-center gap-2 justify-end">{headerExtra}</div>
        )}
      </div>

      {/* Desktop & Tablet Table View (Hidden on mobile < md) */}
      <div className="hidden md:block rounded-2xl border border-border bg-card overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase font-mono tracking-wider">
              <tr>
                {columns.map((col, idx) => {
                  const isSorted = col.accessorKey && sortConfig.key === col.accessorKey
                  return (
                    <th
                      key={col.id || idx}
                      onClick={() => col.sortable && toggleSort(col.accessorKey)}
                      className={cn(
                        "py-3 px-4 font-semibold select-none",
                        col.sortable && "cursor-pointer hover:text-foreground transition-colors",
                        col.className
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.header}</span>
                        {col.sortable && (
                          <span className="text-muted-foreground">
                            {isSorted ? (
                              sortConfig.direction === "asc" ? (
                                <ArrowUp className="w-3.5 h-3.5 text-editorial-terracotta" />
                              ) : (
                                <ArrowDown className="w-3.5 h-3.5 text-editorial-terracotta" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  )
                })}
                {rowActions && <th className="py-3 px-4 w-12 text-right">Actions</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                Array.from({ length: pageSize > 6 ? 6 : pageSize }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {columns.map((_, cIdx) => (
                      <td key={cIdx} className="py-3.5 px-4">
                        <Skeleton className="h-4 w-3/4 rounded" />
                      </td>
                    ))}
                    {rowActions && (
                      <td className="py-3.5 px-4 text-right">
                        <Skeleton className="h-7 w-7 rounded-lg ml-auto" />
                      </td>
                    )}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (rowActions ? 1 : 0)}
                    className="py-12 px-4 text-center text-muted-foreground"
                  >
                    <p className="font-serif text-sm">{emptyMessage}</p>
                    {searchQuery && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("")
                          setActiveFilters({})
                        }}
                        className="text-editorial-terracotta text-xs mt-1"
                      >
                        Reset filters
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, rowIdx) => {
                  const actions = getActionsForItem(item)
                  return (
                    <tr
                      key={keyExtractor(item, rowIdx)}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {columns.map((col, cIdx) => (
                        <td key={col.id || cIdx} className={cn("py-3.5 px-4", col.className)}>
                          {col.cell
                            ? col.cell(item)
                            : col.accessorKey
                            ? String(item[col.accessorKey] ?? "-")
                            : null}
                        </td>
                      ))}

                      {rowActions && (
                        <td className="py-3.5 px-4 text-right">
                          {actions.length > 0 && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 rounded-xl">
                                {actions.map((act, actIdx) => (
                                  <DropdownMenuItem
                                    key={actIdx}
                                    onClick={() => act.onClick(item)}
                                    className={cn(
                                      "text-xs cursor-pointer gap-2 py-2",
                                      act.variant === "destructive" &&
                                        "text-destructive focus:text-destructive focus:bg-destructive/10"
                                    )}
                                  >
                                    {act.icon}
                                    <span>{act.label}</span>
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Stacked Cards View (Shown only on small screens < md) */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-2xl border border-border bg-card space-y-2.5">
              <Skeleton className="h-5 w-1/2 rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-4 w-1/3 rounded" />
            </div>
          ))
        ) : paginatedData.length === 0 ? (
          <div className="p-8 text-center border border-dashed rounded-2xl bg-card text-muted-foreground text-xs font-serif">
            {emptyMessage}
          </div>
        ) : (
          paginatedData.map((item, rowIdx) => {
            const actions = getActionsForItem(item)
            return (
              <div
                key={keyExtractor(item, rowIdx)}
                className="p-4 rounded-2xl border border-border bg-card shadow-subtle space-y-3"
              >
                <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2.5">
                  <div className="flex-1">
                    {/* Primary column or first column content */}
                    {columns[0]?.cell ? columns[0].cell(item) : String(item[columns[0]?.accessorKey as any] ?? "")}
                  </div>
                  {actions.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg text-muted-foreground"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 rounded-xl">
                        {actions.map((act, actIdx) => (
                          <DropdownMenuItem
                            key={actIdx}
                            onClick={() => act.onClick(item)}
                            className={cn(
                              "text-xs cursor-pointer gap-2 py-2",
                              act.variant === "destructive" &&
                                "text-destructive focus:text-destructive focus:bg-destructive/10"
                            )}
                          >
                            {act.icon}
                            <span>{act.label}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Remaining columns as key-value pairs */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {columns.slice(1).map((col, cIdx) => {
                    if (col.hideOnMobile) return null
                    return (
                      <div key={col.id || cIdx} className="space-y-0.5">
                        <span className="text-[10px] uppercase font-mono text-muted-foreground block">
                          {col.mobileLabel || (typeof col.header === "string" ? col.header : `Field ${cIdx + 1}`)}
                        </span>
                        <div className="text-foreground font-medium">
                          {col.cell
                            ? col.cell(item)
                            : col.accessorKey
                            ? String(item[col.accessorKey] ?? "-")
                            : "-"}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground pt-1">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="h-8 px-2 rounded-lg border border-border bg-card text-foreground focus:outline-none"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span className="ml-2 font-mono">
            {totalItems === 0
              ? "0 of 0"
              : `${(currentPage - 1) * pageSize + 1}-${Math.min(
                  currentPage * pageSize,
                  totalItems
                )} of ${totalItems}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1 || isLoading}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="h-8 px-2.5 rounded-lg text-xs"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
            Prev
          </Button>

          <span className="px-2 text-xs font-mono">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages || isLoading}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="h-8 px-2.5 rounded-lg text-xs"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
