import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
}

/**
 * Editorial Error State Component
 * Respectful, clear error feedback with actionable retry and Supabase setup assistance
 */
export function ErrorState({
  title = "Unable to load expeditions",
  message = "A connection error occurred while retrieving travel data from our database.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-10 my-8 rounded-3xl border border-destructive/30 bg-destructive/5 max-w-xl mx-auto space-y-5">
      <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center border border-destructive/20">
        <AlertTriangle className="w-7 h-7 stroke-[1.5]" />
      </div>

      <div className="space-y-2">
        <h3 className="font-serif text-2xl font-bold text-foreground">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
          {message}
        </p>
      </div>

      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="rounded-full gap-2 border-destructive/30 hover:bg-destructive hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </Button>
      )}
    </div>
  )
}
