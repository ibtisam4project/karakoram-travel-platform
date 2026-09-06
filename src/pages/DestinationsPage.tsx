import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { MapPin, ArrowRight, Compass, Sparkles } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Destination } from "@/types/database"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"

export function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [tourCounts, setTourCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDestinations = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error: destErr } = await supabase
        .from("destinations")
        .select("*")
        .order("name", { ascending: true })

      if (destErr) throw destErr

      setDestinations((data as Destination[]) || [])

      // Fetch tour counts per destination
      const { data: toursData } = await supabase
        .from("tours")
        .select("destination_id")
        .eq("is_active", true)

      if (toursData) {
        const counts: Record<string, number> = {}
        toursData.forEach((t) => {
          if (t.destination_id) {
            counts[t.destination_id] = (counts[t.destination_id] || 0) + 1
          }
        })
        setTourCounts(counts)
      }
    } catch (err: any) {
      console.error("Error loading destinations:", err)
      setError(err.message || "Failed to load destinations")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDestinations()
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="py-12 space-y-12">
      {/* Header Banner */}
      <div className="container space-y-3 text-center max-w-2xl mx-auto">
        <span className="text-xs uppercase font-mono tracking-widest text-editorial-terracotta font-bold">
          Sacred Horizons &bull; Alpine Frontiers
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-foreground tracking-tight">
          Destinations of Karakoram &amp; Co.
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          From the soaring 8,000-meter amphitheaters of Baltistan to the lush pine gorges of Swat and spiritual sanctuaries of the Hijaz.
        </p>
      </div>

      <div className="container">
        {isLoading && (
          <LoadingState count={6} message="Mapping geographical destinations..." />
        )}

        {!isLoading && error && (
          <ErrorState
            title="Unable to Load Destinations"
            message={error}
            onRetry={loadDestinations}
          />
        )}

        {!isLoading && !error && destinations.length === 0 && (
          <EmptyState
            title="No Destinations Configured"
            description="Check back soon as our expedition curators add new destinations."
          />
        )}

        {!isLoading && !error && destinations.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {destinations.map((dest) => {
              const count = tourCounts[dest.id] || 0
              return (
                <Link
                  key={dest.id}
                  to={`/tours?destination=${encodeURIComponent(dest.name)}`}
                  className="group relative rounded-3xl overflow-hidden border border-border/80 bg-card shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    {dest.image_url ? (
                      <img
                        src={dest.image_url}
                        alt={dest.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-editorial-navy/10 text-editorial-terracotta">
                        <Compass className="w-10 h-10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-white/90 dark:bg-black/80 backdrop-blur-md text-foreground font-mono text-[11px] font-bold">
                      {count} Expedition{count !== 1 ? "s" : ""}
                    </div>

                    <div className="absolute bottom-3 left-4 right-4">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-white/80 block">
                        {dest.country}
                      </span>
                      <h3 className="font-serif text-xl font-bold text-white leading-snug">
                        {dest.name}
                      </h3>
                    </div>
                  </div>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {dest.description || "Bespoke mountain itineraries, luxury camps, and cultural heritage."}
                    </p>

                    <div className="pt-2 flex items-center justify-between text-xs font-serif font-bold text-editorial-terracotta">
                      <span>Explore {dest.name} Expeditions</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
