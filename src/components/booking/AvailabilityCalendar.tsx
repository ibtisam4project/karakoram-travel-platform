import React, { useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Users,
} from "lucide-react"
import { TourAvailability } from "@/types/database"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AvailabilityCalendarProps {
  availabilities: TourAvailability[]
  selectedAvailability: TourAvailability | null
  onSelect: (availability: TourAvailability) => void
  className?: string
}

export const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  availabilities,
  selectedAvailability,
  onSelect,
  className,
}) => {
  // Determine initial month based on selectedAvailability or first upcoming availability or current date
  const initialDate = selectedAvailability
    ? new Date(selectedAvailability.departure_date)
    : availabilities.length > 0
    ? new Date(availabilities[0].departure_date)
    : new Date()

  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  )

  // Map departure dates for quick lookup: 'YYYY-MM-DD' -> TourAvailability
  const availabilityMap = React.useMemo(() => {
    const map = new Map<string, TourAvailability>()
    availabilities.forEach((a) => {
      // Date string normalized 'YYYY-MM-DD'
      const key = a.departure_date.split("T")[0]
      map.set(key, a)
    })
    return map
  }, [availabilities])

  // Calendar calculations
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  // First day of current month (0: Sunday, 1: Monday, ...)
  const firstDayIndex = new Date(year, month, 1).getDay()
  // Total days in current month
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate()

  // Previous month total days for padding
  const totalDaysInPrevMonth = new Date(year, month, 0).getDate()

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  const todayStr = new Date().toISOString().split("T")[0]

  // Month Name
  const monthName = currentMonth.toLocaleDateString("en-PK", {
    month: "long",
    year: "numeric",
  })

  // Weekdays header
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className={cn("rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-subtle space-y-4", className)}>
      {/* Calendar Header with Navigation */}
      <div className="flex items-center justify-between border-b border-border/70 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-editorial-navy/10 text-editorial-terracotta flex items-center justify-center">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm sm:text-base text-foreground capitalize">
              {monthName}
            </h4>
            <span className="text-[10px] text-muted-foreground font-mono">
              Select an expedition departure window
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrevMonth}
            className="h-7 w-7 p-0 rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            className="h-7 w-7 p-0 rounded-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekDays.map((day, idx) => (
          <div
            key={day}
            className={cn(
              "text-[10px] font-mono uppercase font-bold py-1",
              idx === 0 || idx === 6 ? "text-editorial-terracotta/80" : "text-muted-foreground"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Month Days Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {/* Leading days from previous month */}
        {Array.from({ length: firstDayIndex }).map((_, idx) => {
          const dayNum = totalDaysInPrevMonth - firstDayIndex + idx + 1
          return (
            <div
              key={`prev-${idx}`}
              className="h-16 sm:h-20 rounded-xl p-1 text-[11px] text-muted-foreground/30 bg-muted/10 flex flex-col justify-start select-none"
            >
              <span className="font-mono">{dayNum}</span>
            </div>
          )
        })}

        {/* Days of current month */}
        {Array.from({ length: totalDaysInMonth }).map((_, idx) => {
          const dayNum = idx + 1
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
            dayNum
          ).padStart(2, "0")}`
          const availability = availabilityMap.get(dateStr)

          const isPast = dateStr < todayStr
          const isSelected = selectedAvailability?.id === availability?.id

          if (!availability) {
            // Regular date without departure
            return (
              <div
                key={`current-${dayNum}`}
                className={cn(
                  "h-16 sm:h-20 rounded-xl p-1 text-[11px] flex flex-col justify-between border border-transparent transition-colors",
                  isPast ? "text-muted-foreground/40 bg-muted/5" : "text-foreground/80 hover:bg-muted/30"
                )}
              >
                <span className="font-mono text-[10px]">{dayNum}</span>
              </div>
            )
          }

          // Date HAS departure availability
          const remaining = Math.max(0, availability.seats_total - availability.seats_booked)
          const isSoldOut =
            availability.status === "full" ||
            availability.status === "closed" ||
            remaining <= 0 ||
            isPast

          // Color-coded seat badge styling:
          // Plenty: > 5 seats
          // Filling up: 3 to 5 seats
          // Almost full: 1 or 2 seats
          let badgeColor = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
          let badgeText = `${remaining} left`

          if (isSoldOut) {
            badgeColor = "bg-muted text-muted-foreground border-border/50"
            badgeText = "Sold Out"
          } else if (remaining <= 2) {
            badgeColor = "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 font-bold"
            badgeText = `${remaining} left!`
          } else if (remaining <= 5) {
            badgeColor = "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-semibold"
            badgeText = `${remaining} left`
          }

          return (
            <button
              key={`current-${dayNum}`}
              type="button"
              disabled={isSoldOut}
              onClick={() => onSelect(availability)}
              className={cn(
                "h-16 sm:h-20 rounded-xl p-1 text-left flex flex-col justify-between border transition-all relative overflow-hidden group",
                isSelected
                  ? "border-editorial-terracotta bg-editorial-terracotta/10 ring-2 ring-editorial-terracotta shadow-sm"
                  : isSoldOut
                  ? "border-border/40 bg-muted/40 opacity-60 cursor-not-allowed"
                  : "border-border/90 bg-card hover:border-editorial-navy/60 dark:hover:border-editorial-sand/60 hover:shadow-subtle cursor-pointer"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={cn(
                    "font-mono font-bold text-[11px]",
                    isSelected ? "text-editorial-terracotta" : "text-foreground"
                  )}
                >
                  {dayNum}
                </span>

                {isSelected && (
                  <CheckCircle2 className="w-3 h-3 text-editorial-terracotta shrink-0" />
                )}
              </div>

              {/* Seats Remaining Badge */}
              <div className="w-full">
                <span
                  className={cn(
                    "block w-full text-center text-[8px] sm:text-[9.5px] rounded-md py-0.5 border uppercase font-mono truncate leading-none",
                    badgeColor
                  )}
                >
                  {badgeText}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Legend & Realtime Indicator */}
      <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>&gt;5 Seats</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>3-5 Seats</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>1-2 Seats</span>
          </span>
          <span className="flex items-center gap-1 opacity-60">
            <span className="w-2 h-2 rounded-full bg-muted-foreground" />
            <span>Sold Out</span>
          </span>
        </div>

        <div className="flex items-center gap-1 text-editorial-terracotta">
          <span className="w-1.5 h-1.5 rounded-full bg-editorial-terracotta animate-pulse" />
          <span>Live Availability Sync</span>
        </div>
      </div>
    </div>
  )
}
