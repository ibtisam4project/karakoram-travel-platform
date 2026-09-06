import { Skeleton } from "@/components/ui/skeleton"
import { Compass } from "lucide-react"

interface LoadingStateProps {
  count?: number
  type?: "card-grid" | "detail" | "table"
  message?: string
}

/**
 * Editorial Loading State Component
 * Features an animated mountain compass pulse loader paired with skeleton cards
 */
export function LoadingState({
  count = 6,
  type = "card-grid",
  message = "Loading curated expeditions...",
}: LoadingStateProps) {
  if (type === "detail") {
    return (
      <div className="container py-12 space-y-8 animate-in fade-in-50 duration-500">
        <Skeleton className="h-[460px] w-full rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-72 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 py-6">
      {/* Editorial Pulse Indicator */}
      <div className="flex items-center justify-center space-x-3 text-sm text-muted-foreground py-4">
        <div className="relative flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border border-editorial-terracotta/40 animate-ping absolute" />
          <div className="w-8 h-8 rounded-full bg-editorial-navy text-white flex items-center justify-center shadow-subtle">
            <Compass className="w-4 h-4 animate-spin [animation-duration:3s]" />
          </div>
        </div>
        <span className="font-serif italic tracking-wide">{message}</span>
      </div>

      {/* Grid of Skeleton Cards matching TourCard layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-border/70 bg-card overflow-hidden p-0 space-y-4 shadow-subtle"
          >
            <Skeleton className="aspect-[16/10] w-full rounded-none" />
            <div className="p-6 pt-0 space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-20 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-6 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="pt-4 border-t border-border/50 flex justify-between items-center">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-9 w-28 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
