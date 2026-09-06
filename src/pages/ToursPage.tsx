import { Reveal } from "@/lib/animation"
import React, { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  Filter,
  SlidersHorizontal,
  RotateCcw,
  Star,
  MapPin,
  Calendar,
  Compass,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Tour, Destination } from "@/types/database"
import { formatPKR } from "@/lib/utils"
import { TourCard } from "@/components/tours/TourCard"
import { LoadingState } from "@/components/shared/LoadingState"
import { EmptyState } from "@/components/shared/EmptyState"
import { ErrorState } from "@/components/shared/ErrorState"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const CATEGORIES = [
  "Northern Areas",
  "Trekking & Adventure",
  "Family Tour",
  "Honeymoon",
  "Religious Tourism",
]

const ITEMS_PER_PAGE = 6

export function ToursPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Master Data
  const [tours, setTours] = useState<Tour[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Filters State synced with URL search params
  const destinationParam = searchParams.getAll("destination")
  const categoryParam = searchParams.getAll("category")
  const minPriceParam = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : 40000
  const maxPriceParam = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : 450000
  const maxDurationParam = searchParams.get("maxDuration") ? Number(searchParams.get("maxDuration")) : 15
  const minRatingParam = searchParams.get("minRating") ? Number(searchParams.get("minRating")) : 0
  const sortParam = searchParams.get("sort") || "rating_desc"
  const pageParam = searchParams.get("page") ? Number(searchParams.get("page")) : 1

  // Local state for interactive sliders before debounce/trigger
  const [priceRange, setPriceRange] = useState<number[]>([minPriceParam, maxPriceParam])
  const [maxDuration, setMaxDuration] = useState<number>(maxDurationParam)

  // Load destinations for the multi-select filter
  useEffect(() => {
    async function loadDestinations() {
      const { data } = await supabase
        .from("destinations")
        .select("*")
        .order("name", { ascending: true })
      if (data) setDestinations(data)
    }
    loadDestinations()
  }, [])

  // Execute Real Supabase Queries with Filters, Sorting, and Pagination
  useEffect(() => {
    async function fetchFilteredTours() {
      try {
        setIsLoading(true)
        setError(null)

        // Base query with count
        let query = supabase
          .from("tours")
          .select(`*, destination:destinations(*)`, { count: "exact" })
          .eq("is_active", true)

        // 1. Destination Filter
        if (destinationParam.length > 0) {
          // If destination names provided in params, filter by matching destination
          const selectedDestIds = destinations
            .filter((d) => destinationParam.includes(d.name))
            .map((d) => d.id)
          if (selectedDestIds.length > 0) {
            query = query.in("destination_id", selectedDestIds)
          }
        }

        // 2. Category Filter
        if (categoryParam.length > 0) {
          query = query.in("category", categoryParam)
        }

        // 3. Price Filter (PKR)
        query = query.gte("price", priceRange[0]).lte("price", priceRange[1])

        // 4. Duration Filter (Days)
        query = query.lte("duration_days", maxDuration)

        // 5. Rating Minimum Filter
        if (minRatingParam > 0) {
          query = query.gte("rating_avg", minRatingParam)
        }

        // 6. Sorting Order
        switch (sortParam) {
          case "price_asc":
            query = query.order("price", { ascending: true })
            break
          case "price_desc":
            query = query.order("price", { ascending: false })
            break
          case "duration_asc":
            query = query.order("duration_days", { ascending: true })
            break
          case "duration_desc":
            query = query.order("duration_days", { ascending: false })
            break
          case "rating_desc":
          default:
            query = query.order("rating_avg", { ascending: false })
            break
        }

        // 7. Pagination (Range Query in Supabase)
        const from = (pageParam - 1) * ITEMS_PER_PAGE
        const to = from + ITEMS_PER_PAGE - 1
        query = query.range(from, to)

        const { data, count, error: fetchError } = await query

        if (fetchError) throw fetchError

        setTours((data as unknown as Tour[]) || [])
        setTotalCount(count || 0)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to filter expeditions"
        console.error("Error filtering tours:", err)
        setError(msg)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFilteredTours()
  }, [
    searchParams.toString(),
    destinations.length,
    priceRange,
    maxDuration,
  ])

  // Helper to update specific param
  const updateParam = (key: string, value: string | string[] | null) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete(key)
    if (Array.isArray(value)) {
      value.forEach((v) => newParams.append(key, v))
    } else if (value !== null && value !== "") {
      newParams.set(key, value)
    }
    // Always reset page to 1 when changing filters
    if (key !== "page") newParams.set("page", "1")
    setSearchParams(newParams)
  }

  const handleDestinationToggle = (destName: string) => {
    const current = new Set(destinationParam)
    if (current.has(destName)) {
      current.delete(destName)
    } else {
      current.add(destName)
    }
    updateParam("destination", Array.from(current))
  }

  const handleCategoryToggle = (category: string) => {
    const current = new Set(categoryParam)
    if (current.has(category)) {
      current.delete(category)
    } else {
      current.add(category)
    }
    updateParam("category", Array.from(current))
  }

  const handleResetFilters = () => {
    setPriceRange([40000, 450000])
    setMaxDuration(15)
    setSearchParams(new URLSearchParams())
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  // Reusable Filter Sidebar Content
  const FilterContent = (
    <div className="space-y-8 pr-2">
      {/* Filter Header with Reset */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-2 font-serif text-lg font-bold text-foreground">
          <Filter className="w-4 h-4 text-editorial-terracotta" />
          <span>Filter Expeditions</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetFilters}
          className="text-xs text-muted-foreground hover:text-editorial-terracotta h-8 px-2.5"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>
      </div>

      {/* 1. Category Multi-select */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Expedition Category
        </h4>
        <div className="space-y-2.5">
          {CATEGORIES.map((cat) => (
            <label
              key={cat}
              className="flex items-center gap-2.5 text-sm text-foreground/90 hover:text-editorial-terracotta cursor-pointer select-none transition-colors"
            >
              <Checkbox
                checked={categoryParam.includes(cat)}
                onCheckedChange={() => handleCategoryToggle(cat)}
              />
              <span>{cat}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 2. Destination Multi-select */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Destinations
        </h4>
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
          {destinations.map((dest) => (
            <label
              key={dest.id}
              className="flex items-center gap-2.5 text-sm text-foreground/90 hover:text-editorial-terracotta cursor-pointer select-none transition-colors"
            >
              <Checkbox
                checked={destinationParam.includes(dest.name)}
                onCheckedChange={() => handleDestinationToggle(dest.name)}
              />
              <span className="truncate">{dest.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 3. Price Range Slider (PKR) */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold uppercase tracking-wider text-muted-foreground">
            Price Budget (PKR)
          </span>
          <span className="font-serif font-bold text-editorial-terracotta">
            {formatPKR(priceRange[1])}
          </span>
        </div>
        <Slider
          min={40000}
          max={450000}
          step={5000}
          value={[priceRange[1]]}
          onValueChange={(val) => {
            setPriceRange([priceRange[0], val[0]])
            updateParam("maxPrice", val[0].toString())
          }}
          className="py-2"
        />
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>Min: {formatPKR(40000)}</span>
          <span>Max: {formatPKR(450000)}</span>
        </div>
      </div>

      {/* 4. Duration Days Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold uppercase tracking-wider text-muted-foreground">
            Duration Limit
          </span>
          <span className="font-serif font-bold text-editorial-terracotta">
            Up to {maxDuration} Days
          </span>
        </div>
        <Slider
          min={2}
          max={16}
          step={1}
          value={[maxDuration]}
          onValueChange={(val) => {
            setMaxDuration(val[0])
            updateParam("maxDuration", val[0].toString())
          }}
          className="py-2"
        />
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>Short (2 days)</span>
          <span>Expedition (16 days)</span>
        </div>
      </div>

      {/* 5. Minimum Rating */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Minimum Rating
        </h4>
        <div className="grid grid-cols-4 gap-2">
          {[0, 4.5, 4.8, 5.0].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => updateParam("minRating", rating === 0 ? null : rating.toString())}
              className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-colors flex items-center justify-center gap-1 ${
                minRatingParam === rating
                  ? "bg-editorial-navy text-white border-editorial-navy dark:bg-editorial-terracotta dark:border-editorial-terracotta"
                  : "bg-card border-border hover:bg-muted"
              }`}
            >
              {rating === 0 ? (
                "All"
              ) : (
                <>
                  <Star className="w-3 h-3 fill-editorial-gold text-editorial-gold" />
                  <span>{rating}+</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="container py-10 md:py-16 space-y-10">
      {/* 1. Page Header with Title and Breadcrumb */}
      <div className="border-b border-border pb-8">
        <span className="text-xs font-semibold uppercase tracking-widest text-editorial-terracotta">
          Curated Pakistani Expeditions
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-foreground mt-1">
          Explore All Tour Packages
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl mt-2 leading-relaxed">
          Filter through handcrafted mountaineering treks, family valleys, honeymoon chalets, and spiritual Umrah departures across Pakistan and beyond.
        </p>
      </div>

      {/* 2. Controls Bar: Results Count, Mobile Filter Trigger, and Sort Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div className="flex items-center gap-2">
          {/* Mobile Filter Sheet Trigger */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl gap-2 text-xs font-semibold">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-editorial-terracotta" />
                  <span>Filters</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[310px] sm:w-[380px] p-6 overflow-y-auto">
                <SheetHeader className="text-left pb-2">
                  <SheetTitle className="font-serif">Expedition Filters</SheetTitle>
                </SheetHeader>
                <div className="py-4">{FilterContent}</div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Real Results Count */}
          <p className="text-sm font-medium text-foreground">
            Showing <span className="font-serif font-bold text-editorial-terracotta">{totalCount}</span> tours found
            {destinationParam.length > 0 && ` in ${destinationParam.join(", ")}`}
          </p>
        </div>

        {/* Sort Control */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-muted-foreground hidden sm:inline">Sort by:</span>
          <Select
            value={sortParam}
            onValueChange={(val) => updateParam("sort", val)}
          >
            <SelectTrigger className="w-[190px] h-9 text-xs rounded-xl bg-card">
              <SelectValue placeholder="Sort expeditions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating_desc">Highest Rated</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="duration_asc">Duration: Shortest</SelectItem>
              <SelectItem value="duration_desc">Duration: Longest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 3. Main Body: Filter Sidebar + Responsive TourCard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block lg:col-span-1 p-6 rounded-3xl border border-border/80 bg-card/60 sticky top-28 shadow-subtle">
          {FilterContent}
        </aside>

        {/* Tours Content Area */}
        <div className="lg:col-span-3 space-y-10">
          {/* Loading Skeletons */}
          {isLoading && (
            <LoadingState count={6} message="Applying database filters..." />
          )}

          {/* Error Notice */}
          {!isLoading && error && (
            <ErrorState
              title="Filter Error"
              message={error}
              onRetry={() => updateParam("page", "1")}
            />
          )}

          {/* Empty State */}
          {!isLoading && !error && tours.length === 0 && (
            <EmptyState
              title="No tours match your current filters"
              description="Try relaxing your price range, increasing maximum days, or selecting another destination."
              actionLabel="Clear All Filters"
              onAction={handleResetFilters}
            />
          )}

          {/* TourCard Responsive Grid */}
          {!isLoading && !error && tours.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {tours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </div>
          )}

          {/* 4. Pagination Controls (Deterministic, Scalable, Shareable) */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                disabled={pageParam <= 1}
                onClick={() => updateParam("page", (pageParam - 1).toString())}
                className="rounded-xl gap-1 text-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>

              <div className="flex items-center gap-1 px-3">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1
                  const isCurrent = p === pageParam
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateParam("page", p.toString())}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                        isCurrent
                          ? "bg-editorial-navy text-white dark:bg-editorial-terracotta"
                          : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={pageParam >= totalPages}
                onClick={() => updateParam("page", (pageParam + 1).toString())}
                className="rounded-xl gap-1 text-xs"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
