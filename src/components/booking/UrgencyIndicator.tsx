import React, { useEffect, useState } from "react"
import { Flame, Clock, Users, ShieldAlert, Sparkles } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { TourAvailability } from "@/types/database"

interface UrgencyIndicatorProps {
  tourId: string
  availabilities: TourAvailability[]
  className?: string
}

export const UrgencyIndicator: React.FC<UrgencyIndicatorProps> = ({
  tourId,
  availabilities,
  className = "",
}) => {
  const [bookedTodayCount, setBookedTodayCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Compute total remaining seats across all upcoming departures
  const todayStr = new Date().toISOString().split("T")[0]
  const totalSeatsRemaining = availabilities
    .filter((a) => a.departure_date >= todayStr && a.status !== "closed")
    .reduce((sum, a) => sum + Math.max(0, a.seats_total - a.seats_booked), 0)

  useEffect(() => {
    let isMounted = true

    async function loadTodayBookings() {
      try {
        setIsLoading(true)
        // Midnight today ISO string
        const startOfToday = new Date()
        startOfToday.setHours(0, 0, 0, 0)

        const { count, error } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("tour_id", tourId)
          .gte("created_at", startOfToday.toISOString())

        if (!error && count !== null && isMounted) {
          setBookedTodayCount(count)
        }
      } catch (err) {
        console.error("Error loading today bookings count:", err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadTodayBookings()

    // Subscribe to realtime booking additions for this tour to update urgency live!
    const channel = supabase
      .channel(`urgency-bookings-${tourId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookings",
          filter: `tour_id=eq.${tourId}`,
        },
        () => {
          if (isMounted) {
            setBookedTodayCount((prev) => prev + 1)
          }
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [tourId])

  return (
    <div
      className={`p-3.5 rounded-2xl border border-editorial-terracotta/25 bg-editorial-terracotta/5 flex items-center justify-between gap-3 text-xs ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-editorial-terracotta animate-ping absolute" />
          <span className="w-2 h-2 rounded-full bg-editorial-terracotta" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 font-serif font-bold text-foreground">
            <Flame className="w-3.5 h-3.5 text-editorial-terracotta shrink-0" />
            <span>High Demand Expedition</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {bookedTodayCount > 0 ? (
              <span>
                Reserved <strong className="text-foreground">{bookedTodayCount} time{bookedTodayCount > 1 ? "s" : ""}</strong> today
                {totalSeatsRemaining > 0 && ` • Only ${totalSeatsRemaining} seats remaining this season`}
              </span>
            ) : totalSeatsRemaining > 0 ? (
              <span>
                Only <strong className="text-editorial-terracotta font-mono font-bold">{totalSeatsRemaining} seats</strong> available across scheduled departures
              </span>
            ) : (
              <span>Departures filling up rapidly for current weather window</span>
            )}
          </p>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-editorial-terracotta font-bold px-2 py-1 rounded-lg bg-editorial-terracotta/10 border border-editorial-terracotta/20 shrink-0">
        <Clock className="w-3 h-3" />
        <span>Live</span>
      </div>
    </div>
  )
}
