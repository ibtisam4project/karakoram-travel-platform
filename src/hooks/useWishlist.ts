import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/context/AuthContext"
import { toast } from "sonner"

export function useWishlist() {
  const { user, isAuthenticated } = useAuth()
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  // Fetch user's wishlist tour IDs
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setWishlistIds(new Set())
      return
    }

    async function loadWishlist() {
      if (!user) return
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from("wishlists")
          .select("tour_id")
          .eq("user_id", user.id)

        if (error) throw error
        if (data) {
          setWishlistIds(new Set(data.map((item) => item.tour_id)))
        }
      } catch (err) {
        console.error("Error loading wishlist:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadWishlist()
  }, [user, isAuthenticated])

  // Toggle wishlist in Supabase
  const toggleWishlist = async (tourId: string): Promise<boolean> => {
    if (!isAuthenticated || !user) {
      toast.info("Sign in to save expeditions", {
        description: "Your saved tours will be stored in your guest dashboard.",
      })
      return false
    }

    const isCurrentlySaved = wishlistIds.has(tourId)

    // Optimistic UI update
    const updated = new Set(wishlistIds)
    if (isCurrentlySaved) {
      updated.delete(tourId)
    } else {
      updated.add(tourId)
    }
    setWishlistIds(updated)

    try {
      if (isCurrentlySaved) {
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", user.id)
          .eq("tour_id", tourId)

        if (error) throw error
        toast.success("Removed from saved expeditions")
        return false
      } else {
        const { error } = await supabase
          .from("wishlists")
          .insert({
            user_id: user.id,
            tour_id: tourId,
          })

        if (error) throw error
        toast.success("Saved to your wishlist!", {
          description: "View anytime under Guest Dashboard -> Saved Expeditions.",
        })
        return true
      }
    } catch (err: unknown) {
      // Revert on error
      setWishlistIds(wishlistIds)
      const msg = err instanceof Error ? err.message : "Could not update wishlist"
      toast.error("Wishlist error", { description: msg })
      return isCurrentlySaved
    }
  }

  return {
    wishlistIds,
    isLoading,
    isWishlisted: (tourId: string) => wishlistIds.has(tourId),
    toggleWishlist,
  }
}
