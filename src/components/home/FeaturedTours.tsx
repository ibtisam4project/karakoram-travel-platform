import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Sparkles, ArrowRight } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Tour } from "@/types/database"
import { TourCard } from "@/components/tours/TourCard"
import { LoadingState } from "@/components/shared/LoadingState"
import { Button } from "@/components/ui/button"

export function FeaturedTours() {
  const [tours, setTours] = useState<Tour[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchFeatured() {
      try {
        setIsLoading(true)
        // First try to fetch is_featured = true, fallback to top rated tours
        const { data, error } = await supabase
          .from("tours")
          .select(`
            *,
            destination:destinations(*)
          `)
          .eq("is_active", true)
          .order("rating_avg", { ascending: false })
          .limit(3)

        if (error) throw error
        setTours((data as unknown as Tour[]) || [])
      } catch (err) {
        console.error("Error loading featured tours:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeatured()
  }, [])

  return (
    <section className="bg-editorial-sand/35 dark:bg-card/30 border-y border-border/80 py-16 md:py-24 transition-colors">
      <div className="container">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-editorial-terracotta font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Handcrafted Expeditions</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
              Featured Signature Journeys
            </h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            Our most requested and critically acclaimed itineraries, guided by certified local mountain captains and high-altitude chefs.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && <LoadingState count={3} message="Retrieving signature itineraries..." />}

        {/* Tours Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tours.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="mt-12 text-center">
          <Link to="/tours">
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 border-border hover:bg-editorial-navy hover:text-white dark:hover:bg-editorial-terracotta transition-colors font-semibold"
            >
              <span>Explore All Expeditions</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
