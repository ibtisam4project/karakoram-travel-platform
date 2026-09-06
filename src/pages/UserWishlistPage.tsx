import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Heart, Compass, ArrowRight } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/context/AuthContext"
import { Tour } from "@/types/database"
import { TourCard } from "@/components/tours/TourCard"
import { LoadingState } from "@/components/shared/LoadingState"
import { EmptyState } from "@/components/shared/EmptyState"
import { Button } from "@/components/ui/button"

export function UserWishlistPage() {
  const { user } = useAuth()
  const [wishlistTours, setWishlistTours] = useState<Tour[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const loadWishlist = async () => {
    if (!user) return
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("wishlists")
        .select(`
          tour_id,
          tour:tours(
            *,
            destination:destinations(*)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      if (data) {
        // Extract tour objects
        const tours = data
          .map((item: any) => item.tour)
          .filter(Boolean) as Tour[]
        setWishlistTours(tours)
      }
    } catch (err) {
      console.error("Error loading wishlist tours:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadWishlist()
  }, [user])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Saved Expeditions</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your personal shortlist of preferred northern journeys and mountain treks.
          </p>
        </div>
        <span className="text-xs font-serif font-bold text-editorial-terracotta bg-editorial-terracotta/10 px-3 py-1 rounded-full">
          {wishlistTours.length} Saved
        </span>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingState count={3} message="Retrieving saved expeditions..." />
      ) : wishlistTours.length === 0 ? (
        <EmptyState
          title="Your wishlist is currently empty"
          description="Click the heart icon on any expedition card across our catalog to save trips for later review."
          actionLabel="Explore Expeditions"
          onAction={() => (window.location.href = "/tours")}
          icon={<Heart className="w-8 h-8 text-editorial-terracotta stroke-[1.2]" />}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistTours.map((tour) => (
            <TourCard
              key={tour.id}
              tour={tour}
              isWishlisted={true}
              onWishlistToggle={async () => {
                // Remove from local view when untoggled
                setWishlistTours((prev) => prev.filter((t) => t.id !== tour.id))
                await supabase
                  .from("wishlists")
                  .delete()
                  .eq("user_id", user?.id)
                  .eq("tour_id", tour.id)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
