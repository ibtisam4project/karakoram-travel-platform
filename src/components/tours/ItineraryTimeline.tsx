import React from "react"
import { Compass, MapPin, Coffee, Home, CheckCircle2 } from "lucide-react"
import { ItineraryDay } from "@/types/database"

interface ItineraryTimelineProps {
  itinerary: ItineraryDay[] | null
}

export function ItineraryTimeline({ itinerary }: ItineraryTimelineProps) {
  if (!itinerary || itinerary.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed rounded-2xl text-muted-foreground text-sm">
        Detailed daily itinerary will be furnished during briefing.
      </div>
    )
  }

  return (
    <div className="relative border-l-2 border-editorial-terracotta/30 ml-4 md:ml-6 space-y-8 py-2">
      {itinerary.map((item) => (
        <div key={item.day} className="relative pl-8 md:pl-10 group">
          {/* Timeline Node Badge */}
          <div className="absolute -left-[17px] top-1 w-8 h-8 rounded-full bg-background border-2 border-editorial-terracotta flex items-center justify-center font-serif text-xs font-bold text-editorial-navy dark:text-editorial-sand group-hover:bg-editorial-terracotta group-hover:text-white transition-colors shadow-sm">
            {item.day}
          </div>

          <div className="p-6 rounded-2xl border border-border/80 bg-card hover:shadow-subtle transition-all duration-300 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-editorial-terracotta">
                Day {item.day}
              </span>
              {(item.meals || item.stay) && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {item.meals && (
                    <span className="flex items-center gap-1">
                      <Coffee className="w-3.5 h-3.5 text-editorial-gold" />
                      {item.meals}
                    </span>
                  )}
                  {item.stay && (
                    <span className="flex items-center gap-1">
                      <Home className="w-3.5 h-3.5 text-editorial-navy dark:text-editorial-sand" />
                      {item.stay}
                    </span>
                  )}
                </div>
              )}
            </div>

            <h4 className="font-serif text-lg font-bold text-foreground leading-snug">
              {item.title}
            </h4>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
