import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { MapPin, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { supabase } from "@/lib/supabaseClient"
import { Destination } from "@/types/database"
import { Skeleton } from "@/components/ui/skeleton"

interface DestinationWithCount extends Destination {
  tour_count?: number
}

export function PopularDestinations() {
  const [destinations, setDestinations] = useState<DestinationWithCount[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchDestinations() {
      try {
        setIsLoading(true)
        // Fetch destinations and count tours for each
        const { data: dests, error: destError } = await supabase
          .from("destinations")
          .select("*, tours(count)")
          .order("name", { ascending: true })

        if (destError) throw destError

        if (dests) {
          const formatted = dests.map((d: any) => ({
            ...d,
            tour_count: d.tours && d.tours[0] ? d.tours[0].count : 0,
          }))
          setDestinations(formatted)
        }
      } catch (err) {
        console.error("Error loading destinations:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDestinations()
  }, [])

  return (
    <section className="container py-16 md:py-24">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-editorial-terracotta font-semibold">
            Iconic Regions
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground mt-1">
            Popular Destinations
          </h2>
        </div>
        <Link
          to="/destinations"
          className="inline-flex items-center gap-2 text-sm font-semibold text-editorial-navy dark:text-editorial-sand hover:text-editorial-terracotta transition-colors group"
        >
          <span>Explore All Regions</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="aspect-[4/3] w-full rounded-3xl" />
          ))}
        </div>
      )}

      {/* Destinations Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.slice(0, 6).map((dest, idx) => (
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
            >
              <Link
                to={`/tours?destination=${encodeURIComponent(dest.name)}`}
                className="group relative block aspect-[4/3] rounded-3xl overflow-hidden shadow-subtle hover:shadow-card transition-all duration-500"
              >
                {/* Background Destination Photo */}
                <img
                  src={dest.image_url || "/images/tours/hunza_valley_autumn_1788431904215.jpg"}
                  alt={dest.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                  loading="lazy"
                />

                {/* Rich Gradient Mask */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10 transition-opacity group-hover:opacity-90" />

                {/* Country Tag Top Left */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-[11px] font-medium tracking-wide">
                    {dest.country}
                  </span>
                </div>

                {/* Card Bottom Meta */}
                <div className="absolute bottom-5 inset-x-5 z-10 text-white space-y-1">
                  <div className="flex items-center gap-1.5 text-editorial-sand text-xs font-medium">
                    <MapPin className="w-3.5 h-3.5 text-editorial-terracotta" />
                    <span>{dest.name}</span>
                  </div>

                  <h3 className="font-serif text-2xl font-bold tracking-tight group-hover:text-editorial-terracotta transition-colors">
                    {dest.name}
                  </h3>

                  <p className="text-xs text-editorial-sand/80 line-clamp-2 leading-relaxed pt-1">
                    {dest.description}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-xs font-semibold text-editorial-gold">
                    <span>
                      {dest.tour_count ? `${dest.tour_count} Expeditions` : "Curated Packages"}
                    </span>
                    <span className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-1 group-hover:translate-x-0">
                      Discover <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  )
}
