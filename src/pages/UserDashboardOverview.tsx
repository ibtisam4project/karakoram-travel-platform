import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Heart,
  TrendingUp,
  BookmarkCheck,
} from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/context/AuthContext"
import { Booking } from "@/types/database"
import { formatPKR } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export function UserDashboardOverview() {
  const { user, profile } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [wishlistCount, setWishlistCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    if (!user) return

    async function loadDashboardData() {
      if (!user) return
      try {
        setIsLoading(true)

        // 1. Fetch user bookings with relational tours
        const { data: bookingData } = await supabase
          .from("bookings")
          .select(`
            *,
            tour:tours(*),
            availability:tour_availability(*)
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (bookingData) {
          setBookings(bookingData as unknown as Booking[])
        }

        // 2. Fetch wishlist count
        const { count } = await supabase
          .from("wishlists")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        setWishlistCount(count || 0)
      } catch (err) {
        console.error("Error loading traveler dashboard:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [user])

  const upcomingBookings = bookings.filter((b) => b.status === "confirmed" || b.status === "pending")
  const pastBookings = bookings.filter((b) => b.status === "completed")
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled")

  const totalExpeditionSpend = bookings
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0)

  return (
    <div className="space-y-8">
      {/* 1. Welcome Header Banner */}
      <div className="p-8 rounded-3xl bg-editorial-navy text-white shadow-card relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-editorial-terracotta/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-editorial-gold text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Traveler Headquarters</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
            Khushamdeed, {profile?.full_name?.split(" ")[0] || "Traveler"}!
          </h1>
          <p className="text-sm text-editorial-sand/85 max-w-xl leading-relaxed">
            Welcome to your personal expedition portal. Track upcoming Karakoram departures, view confirmed booking manifests, and review past adventures.
          </p>
        </div>
      </div>

      {/* 2. Key Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Upcoming */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-editorial-terracotta" />
            Upcoming Trips
          </span>
          <p className="text-2xl font-serif font-bold text-foreground">
            {isLoading ? <Skeleton className="h-8 w-12" /> : upcomingBookings.length}
          </p>
          <span className="text-[11px] text-muted-foreground block">Confirmed &amp; pending departures</span>
        </div>

        {/* Stat 2: Completed */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Completed Expeditions
          </span>
          <p className="text-2xl font-serif font-bold text-foreground">
            {isLoading ? <Skeleton className="h-8 w-12" /> : pastBookings.length}
          </p>
          <span className="text-[11px] text-muted-foreground block">Trails conquered</span>
        </div>

        {/* Stat 3: Wishlist */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-editorial-terracotta" />
            Saved Trails
          </span>
          <p className="text-2xl font-serif font-bold text-foreground">
            {isLoading ? <Skeleton className="h-8 w-12" /> : wishlistCount}
          </p>
          <span className="text-[11px] text-muted-foreground block">In your personal wishlist</span>
        </div>

        {/* Stat 4: Total Value */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-subtle space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-editorial-gold" />
            Expedition Value
          </span>
          <p className="text-xl font-serif font-bold text-editorial-terracotta truncate">
            {isLoading ? <Skeleton className="h-8 w-24" /> : formatPKR(totalExpeditionSpend)}
          </p>
          <span className="text-[11px] text-muted-foreground block">Total booked in PKR</span>
        </div>
      </div>

      {/* 3. Nearest Upcoming Bookings Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl font-bold text-foreground">Next Scheduled Departures</h3>
            <p className="text-xs text-muted-foreground">Your nearest upcoming departures with confirmed seats.</p>
          </div>
          <Link to="/dashboard/bookings">
            <Button variant="ghost" size="sm" className="text-xs text-editorial-terracotta hover:underline gap-1">
              <span>View All Bookings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : upcomingBookings.length === 0 ? (
          <div className="p-8 rounded-3xl border border-dashed border-border bg-card/60 text-center space-y-4">
            <BookmarkCheck className="w-10 h-10 text-muted-foreground mx-auto stroke-[1.2]" />
            <div className="space-y-1">
              <h4 className="font-serif font-bold text-base text-foreground">No Upcoming Trips Scheduled</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                You do not have any active expeditions booked yet. Explore our curated northern routes to start your journey.
              </p>
            </div>
            <Link to="/tours">
              <Button variant="editorial" size="sm" className="rounded-full px-6">
                Explore Expeditions
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.slice(0, 3).map((b) => (
              <div
                key={b.id}
                className="p-5 rounded-2xl bg-card border border-border shadow-subtle hover:shadow-card transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-editorial-navy dark:text-editorial-sand">
                      {b.booking_reference}
                    </span>
                    <Badge
                      variant={b.status === "confirmed" ? "sand" : "outline"}
                      className="text-[10px] capitalize font-semibold"
                    >
                      {b.status}
                    </Badge>
                  </div>
                  <h4 className="font-serif font-bold text-base text-foreground">
                    {b.tour?.title || "Expedition Package"}
                  </h4>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    {b.availability?.departure_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-editorial-terracotta" />
                        {new Date(b.availability.departure_date).toLocaleDateString("en-PK", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-editorial-terracotta" />
                      {b.tour?.duration_days} Days
                    </span>
                    <span>{b.travelers_count} Traveler(s)</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                  <span className="font-serif font-bold text-lg text-editorial-terracotta">
                    {formatPKR(b.total_price)}
                  </span>
                  <Link to="/dashboard/bookings">
                    <Button variant="outline" size="sm" className="rounded-xl text-xs h-8">
                      Manage Booking
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
