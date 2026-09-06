import React, { useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Heart, Clock, Star, MapPin, Users, ArrowUpRight } from "lucide-react"
import { Tour } from "@/types/database"
import { formatPKR } from "@/lib/utils"
import { useWishlist } from "@/hooks/useWishlist"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface TourCardProps {
  tour: Tour
  isWishlisted?: boolean
  onWishlistToggle?: (tourId: string) => void
  showAdminBadge?: boolean
}

/**
 * Editorial TourCard Component
 * Reusable across:
 * - Public tours catalog & home page
 * - Destination pages
 * - Related tours & recommendation sections
 * - Admin previews
 *
 * Features:
 * - Micro-interaction hover lift via Framer Motion
 * - Graceful image fallback
 * - Pakistani Rupee (PKR) price formatting with discount badge
 * - Wishlist heart toggle with interactive visual feedback
 * - Editorial serif typography and deep navy / terracotta accents
 */
export const TourCard: React.FC<TourCardProps> = ({
  tour,
  isWishlisted: propIsWishlisted,
  onWishlistToggle,
  showAdminBadge = false,
}) => {
  const { isWishlisted: hookIsWishlisted, toggleWishlist } = useWishlist()
  const [imageError, setImageError] = useState(false)

  const isSaved = propIsWishlisted !== undefined ? propIsWishlisted : hookIsWishlisted(tour.id)

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onWishlistToggle) {
      onWishlistToggle(tour.id)
    } else {
      toggleWishlist(tour.id)
    }
  }

  // Graceful fallback to verified Hunza Valley image
  const defaultFallback = "/images/tours/hunza_valley_autumn_1788431904215.jpg"
  const rawImage = tour.images && tour.images.length > 0 ? tour.images[0] : defaultFallback
  const imageUrl = imageError ? defaultFallback : rawImage

  const hasDiscount = tour.discount_price && tour.discount_price < tour.price
  const displayPrice = tour.discount_price ?? tour.price
  const discountPercent = hasDiscount
    ? Math.round(((tour.price - (tour.discount_price ?? 0)) / tour.price) * 100)
    : 0

  return (
    <motion.div
      whileHover={{ y: -6, transition: { duration: 0.25, ease: "easeOut" } }}
      className="group relative flex flex-col rounded-3xl overflow-hidden border border-border/80 bg-card text-card-foreground shadow-subtle hover:shadow-card transition-shadow duration-300 h-full"
    >
      {/* Photo Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={tour.title}
          onError={() => setImageError(true)}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Ambient Overlay Gradient for Editorial Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

        {/* Top Badges Row */}
        <div className="absolute top-4 inset-x-4 flex items-center justify-between z-10">
          <div className="flex flex-wrap gap-1.5 items-center">
            <Badge
              variant="sand"
              className="uppercase tracking-widest text-[10px] font-bold backdrop-blur-md shadow-sm border border-editorial-navy/10"
            >
              {tour.category}
            </Badge>

            {hasDiscount && (
              <Badge
                variant="terracotta"
                className="text-[10px] font-bold uppercase tracking-wider"
              >
                Save {discountPercent}%
              </Badge>
            )}

            {showAdminBadge && (
              <Badge variant="outline" className="bg-black/60 text-white text-[10px]">
                {tour.is_active ? "Active" : "Inactive"}
              </Badge>
            )}
          </div>

          {/* Wishlist Heart Toggle */}
          <button
            type="button"
            onClick={handleWishlistClick}
            aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 flex items-center justify-center transition-all duration-200 border border-white/20 active:scale-90"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isSaved
                  ? "fill-editorial-terracotta text-editorial-terracotta"
                  : "text-white"
              }`}
            />
          </button>
        </div>

        {/* Bottom Image Overlay Meta */}
        <div className="absolute bottom-3.5 inset-x-4 flex items-end justify-between z-10 text-white">
          {/* Destination */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-editorial-sand drop-shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-editorial-terracotta shrink-0" />
            <span className="truncate max-w-[140px] sm:max-w-[180px]">
              {tour.destination?.name || "Pakistan"}
            </span>
          </div>

          {/* Pricing in Pakistani Rupees */}
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider block opacity-85 leading-none mb-1">
              Per Traveler
            </span>
            <div className="flex items-baseline gap-1.5 justify-end">
              <span className="font-serif text-xl font-bold tracking-tight text-white drop-shadow">
                {formatPKR(displayPrice)}
              </span>
              {hasDiscount && (
                <span className="text-xs line-through opacity-70">
                  {formatPKR(tour.price)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Body & Details */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2.5">
          {/* Metadata Row: Duration, Group Size, Rating */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-editorial-terracotta" />
              <span>{tour.duration_days} Days</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-editorial-terracotta" />
              <span>Max {tour.group_size_max}</span>
            </div>
            <div className="flex items-center gap-1 font-semibold text-foreground">
              <Star className="w-3.5 h-3.5 fill-editorial-gold text-editorial-gold" />
              <span>{Number(tour.rating_avg || 5.0).toFixed(1)}</span>
            </div>
          </div>

          {/* Title */}
          <Link to={`/tours/${tour.slug}`} className="block group-hover:underline">
            <h3 className="font-serif text-xl font-bold text-foreground leading-snug group-hover:text-editorial-terracotta transition-colors line-clamp-2">
              {tour.title}
            </h3>
          </Link>

          {/* Description Excerpt */}
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {tour.description}
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-border/60">
          <Link to={`/tours/${tour.slug}`} className="block">
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-xl justify-between group-hover:bg-editorial-navy group-hover:text-white dark:group-hover:bg-editorial-terracotta transition-all duration-300 font-medium text-xs h-10 px-4"
            >
              <span>View Itinerary &amp; Dates</span>
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
