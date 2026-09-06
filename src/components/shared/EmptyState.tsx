import React from "react"
import { Compass, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: React.ReactNode
}

/**
 * Editorial Empty State Component
 * Warm, non-sterile empty state with terracotta accents and restorative action triggers.
 */
export function EmptyState({
  title = "No expeditions found",
  description = "We couldn't find any tours matching your criteria. Try adjusting your filters or search terms.",
  actionLabel = "Reset Filters",
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 my-8 rounded-3xl border border-dashed border-border/80 bg-editorial-sand/30 dark:bg-card/30 max-w-xl mx-auto space-y-5">
      <div className="w-16 h-16 rounded-full bg-editorial-navy/10 dark:bg-editorial-sand/10 text-editorial-navy dark:text-editorial-sand flex items-center justify-center border border-border">
        {icon || <Compass className="w-8 h-8 text-editorial-terracotta stroke-[1.5]" />}
      </div>

      <div className="space-y-2">
        <h3 className="font-serif text-2xl font-bold text-foreground">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
          {description}
        </p>
      </div>

      {onAction && (
        <Button
          onClick={onAction}
          variant="outline"
          className="rounded-full gap-2 border-border hover:bg-editorial-navy hover:text-white dark:hover:bg-editorial-terracotta transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
