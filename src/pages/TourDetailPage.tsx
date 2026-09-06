import React, { useEffect, useState } from "react"
import { useParams, Link, useNavigate, useLocation } from "react-router-dom"
import {
  Clock,
  Users,
  Star,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Share2,
  Heart,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
  PhoneCall,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import { Tour, TourAvailability, Review } from "@/types/database"
import { formatPKR } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"
import { TourGallery } from "@/components/tours/TourGallery"
import { ItineraryTimeline } from "@/components/tours/ItineraryTimeline"
import { TourCard } from "@/components/tours/TourCard"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { BookingModal } from "@/components/booking/BookingModal"
import { AvailabilityCalendar } from "@/components/booking/AvailabilityCalendar"
import { UrgencyIndicator } from "@/components/booking/UrgencyIndicator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function TourDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user } = useAuth()

  // State
  const [tour, setTour] = useState<Tour | null>(null)
  const [availabilities, setAvailabilities] = useState<TourAvailability[]>([])
  const [selectedAvailability, setSelectedAvailability] = useState<TourAvailability | null>(null)
  const [travelersCount, setTravelersCount] = useState<number>(2)
  const [reviews, setReviews] = useState<Review[]>([])
  const [relatedTours, setRelatedTours] = useState<Tour[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false)
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false)

  // Load tour and its sub-relations
  const loadTourDetails = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // 1. Fetch tour
      const { data: tourData, error: tourError } = await supabase
        .from("tours")
        .select(`*, destination:destinations(*)`)
        .eq("slug", slug)
        .single()

      if (tourError || !tourData) {
        throw new Error("Expedition not found or currently inactive.")
      }

      setTour(tourData as Tour)

      // 2. Fetch live availabilities
      const { data: availData } = await supabase
        .from("tour_availability")
        .select("*")
        .eq("tour_id", tourData.id)
        .order("departure_date", { ascending: true })

      if (availData && availData.length > 0) {
        setAvailabilities(availData as TourAvailability[])
        // Default to first open departure
        const firstOpen = availData.find((a) => a.status === "open")
        setSelectedAvailability(firstOpen || availData[0])
      }

      // 3. Fetch reviews for this tour
      const { data: revData } = await supabase
        .from("reviews")
        .select(`*, profile:profiles(*)`)
        .eq("tour_id", tourData.id)
        .order("created_at", { ascending: false })

      if (revData) setReviews(revData as unknown as Review[])

      // 4. Fetch related tours
      const { data: related } = await supabase
        .from("tours")
        .select(`*, destination:destinations(*)`)
        .neq("id", tourData.id)
        .or(`category.eq.${tourData.category},destination_id.eq.${tourData.destination_id}`)
        .limit(3)

      if (related) setRelatedTours(related as Tour[])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to load tour details."
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTourDetails()
    window.scrollTo(0, 0)
  }, [slug])

  // 5. Supabase Realtime Subscription on tour_availability (live seat updates)
  useEffect(() => {
    if (!tour?.id) return

    const channel = supabase
      .channel(`tour-availabilities-${tour.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tour_availability",
          filter: `tour_id=eq.${tour.id}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as TourAvailability
            setAvailabilities((prev) =>
              prev.map((a) => (a.id === updated.id ? updated : a))
            )

            // If user has this departure selected, sync seat count or detect sell-out
            setSelectedAvailability((current) => {
              if (current && current.id === updated.id) {
                const remaining = updated.seats_total - updated.seats_booked
                const isSoldOut =
                  updated.status === "full" ||
                  updated.status === "closed" ||
                  remaining <= 0

                if (isSoldOut) {
                  toast.error("This departure date just sold out — please pick another", {
                    duration: 6000,
                  })
                  return null // Unselect the sold-out departure
                }

                return updated
              }
              return current
            })
          } else if (payload.eventType === "INSERT") {
            const inserted = payload.new as TourAvailability
            setAvailabilities((prev) => {
              const updated = [...prev, inserted]
              return updated.sort(
                (a, b) =>
                  new Date(a.departure_date).getTime() -
                  new Date(b.departure_date).getTime()
              )
            })
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as any).id
            setAvailabilities((prev) => prev.filter((a) => a.id !== deletedId))
            setSelectedAvailability((current) =>
              current?.id === deletedId ? null : current
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tour?.id])

  // Handle Book Now Click (with return-to redirect if unauthenticated)
  const handleBookNow = () => {
    if (!isAuthenticated) {
      toast.info("Please sign in to book", {
        description: "Redirecting to guest login with your selected expedition saved.",
      })
      navigate("/login", { state: { from: location } })
      return
    }

    if (!selectedAvailability) {
      toast.error("Please select an available departure date first.")
      return
    }

    if (selectedAvailability.status !== "open") {
      toast.error("The selected departure is currently full or closed.")
      return
    }

    setIsBookingOpen(true)
  }

  if (isLoading) {
    return (
      <div className="container py-12">
        <LoadingState type="detail" message="Unpacking expedition itinerary and departure dates..." />
      </div>
    )
  }

  if (error || !tour) {
    return (
      <div className="container py-20">
        <ErrorState
          title="Expedition Unavailable"
          message={error || "This tour package could not be located."}
          onRetry={loadTourDetails}
        />
      </div>
    )
  }

  const effectivePrice = tour.discount_price ?? tour.price
  const totalPrice = effectivePrice * travelersCount
  const remainingSeats = selectedAvailability
    ? selectedAvailability.seats_total - selectedAvailability.seats_booked
    : 0

  return (
    <div className="pb-24 space-y-12">
      {/* 1. Header & Breadcrumb Bar */}
      <div className="bg-editorial-sand/35 dark:bg-card/30 border-b border-border py-6 transition-colors">
        <div className="container">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Home</Link>
              <span>/</span>
              <Link to="/tours" className="hover:text-foreground">Tours</Link>
              <span>/</span>
              <span className="text-editorial-terracotta font-semibold truncate max-w-[200px] sm:max-w-none">
                {tour.title}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  toast.success("Link copied to clipboard!")
                }}
                className="rounded-full gap-1.5 text-xs h-8"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsWishlisted(!isWishlisted)
                  toast.success(isWishlisted ? "Removed from saved trips" : "Added to your wishlist")
                }}
                className="rounded-full gap-1.5 text-xs h-8"
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    isWishlisted ? "fill-editorial-terracotta text-editorial-terracotta" : ""
                  }`}
                />
                <span>Save</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Tour Showcase Grid */}
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Main Left Content: Gallery + Facts + Tabs */}
          <div className="lg:col-span-2 space-y-10">
            {/* Title & Location Header */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="terracotta" className="uppercase tracking-widest text-[10px] font-bold">
                  {tour.category}
                </Badge>
                {tour.destination && (
                  <Badge variant="sand" className="text-[10px] font-semibold gap-1">
                    <MapPin className="w-3 h-3 text-editorial-terracotta" />
                    <span>{tour.destination.name}, {tour.destination.country}</span>
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1 font-semibold">
                  <Star className="w-4 h-4 fill-editorial-gold text-editorial-gold" />
                  <span>{Number(tour.rating_avg).toFixed(1)}</span>
                  <span className="text-muted-foreground font-normal">({reviews.length} reviews)</span>
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-serif font-bold text-foreground tracking-tight leading-tight">
                {tour.title}
              </h1>
            </div>

            {/* AI Photographic Gallery with Lightbox */}
            <TourGallery images={tour.images} title={tour.title} />

            {/* Live Real-Time Urgency Indicator */}
            <UrgencyIndicator tourId={tour.id} availabilities={availabilities} />

            {/* Key Facts Quick Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-3xl bg-card border border-border/80 shadow-subtle">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-editorial-terracotta" />
                  Duration
                </span>
                <p className="font-serif text-lg font-bold text-foreground">
                  {tour.duration_days} Days / {tour.duration_days - 1} Nights
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-editorial-terracotta" />
                  Max Group Size
                </span>
                <p className="font-serif text-lg font-bold text-foreground">
                  Up to {tour.group_size_max} Persons
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-editorial-terracotta" />
                  Guide Level
                </span>
                <p className="font-serif text-lg font-bold text-foreground">
                  Local Captain &amp; Cook
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-editorial-terracotta" />
                  Starting From
                </span>
                <p className="font-serif text-lg font-bold text-editorial-terracotta">
                  {formatPKR(effectivePrice)}
                </p>
              </div>
            </div>

            {/* Comprehensive Detail Tabs */}
            <Tabs defaultValue="itinerary" className="w-full">
              <TabsList className="grid grid-cols-5 h-12 rounded-2xl bg-muted/70 p-1">
                <TabsTrigger value="overview" className="rounded-xl text-xs font-semibold">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="itinerary" className="rounded-xl text-xs font-semibold">
                  Daily Itinerary
                </TabsTrigger>
                <TabsTrigger value="calendar" className="rounded-xl text-xs font-semibold">
                  Live Calendar
                </TabsTrigger>
                <TabsTrigger value="included" className="rounded-xl text-xs font-semibold">
                  What's Included
                </TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-xl text-xs font-semibold">
                  Reviews ({reviews.length})
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Overview */}
              <TabsContent value="overview" className="pt-6 space-y-6">
                <div className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed text-sm sm:text-base">
                  <p>{tour.description}</p>
                  <p className="pt-2">
                    Traversing across the northern alpine frontiers of Pakistan requires meticulous logistical planning. Our boutique expeditions ensure private coaster or 4x4 Prado transport, verified comfortable stays at Serena or heritage lodges, high-altitude satellite communication devices, and authentic Pakistani hospitality at every meal.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-editorial-sand/40 dark:bg-muted/40 border border-border space-y-2">
                  <h4 className="font-serif font-bold text-base text-foreground">Expedition Notes for Travelers:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Valid original CNIC (for Pakistani citizens) or Passport + Visa (international guests) required.</li>
                    <li>Weather in high passes can change swiftly; layer thermals and windproof jackets.</li>
                    <li>Cash withdrawal points are sparse past Gilgit/Skardu; carry adequate PKR currency.</li>
                  </ul>
                </div>
              </TabsContent>

              {/* Tab 2: Vertical Itinerary Timeline */}
              <TabsContent value="itinerary" className="pt-6 space-y-4">
                <ItineraryTimeline itinerary={tour.itinerary} />
              </TabsContent>

              {/* Tab 3: Full Live Availability Calendar */}
              <TabsContent value="calendar" className="pt-6 space-y-6">
                <div className="space-y-2">
                  <h4 className="font-serif text-xl font-bold text-foreground">
                    Expedition Departure Windows &amp; Live Seat Manifest
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Select a departure date to lock your booking. Seat counts are synchronized live with the Karakoram &amp; Co. dispatch console.
                  </p>
                </div>

                <AvailabilityCalendar
                  availabilities={availabilities}
                  selectedAvailability={selectedAvailability}
                  onSelect={(avail) => setSelectedAvailability(avail)}
                />

                {selectedAvailability && (
                  <div className="p-5 rounded-2xl bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-mono text-muted-foreground block">
                        Selected Departure Window
                      </span>
                      <h5 className="font-serif text-lg font-bold text-foreground">
                        {new Date(selectedAvailability.departure_date).toLocaleDateString("en-PK", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </h5>
                      <span className="text-xs text-muted-foreground">
                        Total Capacity: {selectedAvailability.seats_total} Pax &bull; Available:{" "}
                        <strong className="text-editorial-terracotta">
                          {selectedAvailability.seats_total - selectedAvailability.seats_booked} Seats
                        </strong>
                      </span>
                    </div>

                    <Button
                      variant="editorial"
                      onClick={handleBookNow}
                      className="rounded-xl text-xs h-10 px-6 font-serif font-bold"
                    >
                      Book This Departure
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Tab 3: What's Included */}
              <TabsContent value="included" className="pt-6 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {/* Included */}
                  <div className="p-6 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-4">
                    <h4 className="font-serif text-lg font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      What's Included
                    </h4>
                    <ul className="text-xs sm:text-sm text-foreground/80 space-y-2.5">
                      <li>&bull; Dedicated air-conditioned executive Coaster / private 4x4 Prado transfers</li>
                      <li>&bull; All nights accommodation in verified boutique &amp; heritage mountain lodges</li>
                      <li>&bull; Daily breakfast and freshly prepared traditional evening feasts</li>
                      <li>&bull; Certified indigenous Wakhi/Balti English &amp; Urdu speaking mountain guide</li>
                      <li>&bull; All national park fees, road tolls, bridge passes &amp; trek permits</li>
                      <li>&bull; Basic first aid and high-altitude emergency oxygen cylinder kit</li>
                    </ul>
                  </div>

                  {/* Excluded */}
                  <div className="p-6 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 space-y-4">
                    <h4 className="font-serif text-lg font-bold text-rose-800 dark:text-rose-300 flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-rose-600" />
                      What's Not Included
                    </h4>
                    <ul className="text-xs sm:text-sm text-foreground/80 space-y-2.5">
                      <li>&bull; Domestic flight tickets (Islamabad to Gilgit/Skardu) unless requested</li>
                      <li>&bull; Personal trekking gear (boots, thermal down jackets, trekking poles)</li>
                      <li>&bull; Lunch meals on transit days, personal laundry, or phone room services</li>
                      <li>&bull; Porter charges for personal luggage beyond 15kg limit</li>
                      <li>&bull; Gratitude/Tips for drivers and mountain staff</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 4: Reviews */}
              <TabsContent value="reviews" className="pt-6 space-y-6">
                {reviews.length === 0 ? (
                  <div className="p-8 text-center border border-dashed rounded-3xl text-sm text-muted-foreground">
                    No traveler reviews submitted for this expedition yet. Be the first to share your journey!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-6 rounded-2xl bg-card border border-border shadow-subtle space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={rev.profile?.avatar_url || ""} />
                              <AvatarFallback className="text-xs font-serif bg-editorial-navy text-white">
                                {rev.profile?.full_name?.charAt(0) || "G"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h5 className="font-serif text-sm font-bold text-foreground">
                                {rev.profile?.full_name || "Verified Traveler"}
                              </h5>
                              <span className="text-[11px] text-muted-foreground">
                                {new Date(rev.created_at).toLocaleDateString("en-PK", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: rev.rating }).map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-editorial-gold text-editorial-gold" />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground italic leading-relaxed">
                          "{rev.comment}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sticky Booking Sidebar (Desktop) */}
          <aside className="hidden lg:block lg:col-span-1 sticky top-28">
            <div className="p-6 rounded-3xl border border-border/90 bg-card shadow-card space-y-6">
              {/* Price Row */}
              <div className="space-y-1 pb-4 border-b border-border/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Per Traveler Rate
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-3xl font-bold text-editorial-terracotta">
                    {formatPKR(effectivePrice)}
                  </span>
                  {tour.discount_price && (
                    <span className="text-sm line-through text-muted-foreground">
                      {formatPKR(tour.price)}
                    </span>
                  )}
                </div>
              </div>

              {/* Availability Calendar & Departure Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Departure Calendar
                  </Label>
                  <span className="text-[10px] text-editorial-terracotta font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-editorial-terracotta animate-pulse" />
                    Live Sync
                  </span>
                </div>

                <AvailabilityCalendar
                  availabilities={availabilities}
                  selectedAvailability={selectedAvailability}
                  onSelect={(avail) => setSelectedAvailability(avail)}
                />

                {selectedAvailability && (
                  <div className="p-3.5 rounded-2xl bg-editorial-sand/40 dark:bg-muted/40 border border-border space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-xs text-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-editorial-terracotta" />
                        {new Date(selectedAvailability.departure_date).toLocaleDateString("en-PK", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <Badge
                        variant={remainingSeats <= 2 ? "destructive" : "sand"}
                        className="text-[9.5px] font-mono uppercase font-bold"
                      >
                        {remainingSeats} Seats Left
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Total Capacity: {selectedAvailability.seats_total} Pax</span>
                      <span className="font-mono text-editorial-terracotta">Instant Confirmation</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Travelers Stepper */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Number of Travelers
                </Label>
                <div className="flex items-center justify-between p-2.5 rounded-2xl border border-border bg-background">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={travelersCount <= 1}
                    onClick={() => setTravelersCount((c) => Math.max(1, c - 1))}
                    className="h-8 w-8 rounded-xl"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                  <span className="font-serif font-bold text-sm">
                    {travelersCount} Traveler{travelersCount > 1 ? "s" : ""}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={
                      travelersCount >=
                      Math.min(tour.group_size_max, remainingSeats > 0 ? remainingSeats : tour.group_size_max)
                    }
                    onClick={() => setTravelersCount((c) => c + 1)}
                    className="h-8 w-8 rounded-xl"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Live Total Calculation */}
              <div className="p-4 rounded-2xl bg-editorial-sand/40 dark:bg-muted/50 border border-border/80 space-y-1.5 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>{formatPKR(effectivePrice)} &times; {travelersCount} travelers</span>
                  <span>{formatPKR(totalPrice)}</span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between font-bold text-sm text-foreground">
                  <span>Total Payable:</span>
                  <span className="font-serif text-lg text-editorial-terracotta">
                    {formatPKR(totalPrice)}
                  </span>
                </div>
              </div>

              {/* Book Now Button (Uiverse-adapted Primary Editorial Style) */}
              <button
                type="button"
                onClick={handleBookNow}
                disabled={!selectedAvailability || selectedAvailability.status !== "open"}
                className={`
                  w-full relative group overflow-hidden rounded-2xl py-4 px-6 font-semibold text-sm tracking-wide text-white transition-all duration-300 shadow-card active:scale-[0.98]
                  ${
                    !selectedAvailability || selectedAvailability.status !== "open"
                      ? "bg-muted text-muted-foreground cursor-not-allowed shadow-none"
                      : "bg-gradient-to-r from-editorial-terracotta to-amber-600 hover:from-editorial-terracotta/95 hover:to-amber-500 hover:shadow-lg"
                  }
                `}
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <span>Book Expedition Now</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </button>

              <div className="text-center pt-1">
                <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-editorial-terracotta" />
                  Direct seat reservation &bull; DTS Government Licensed
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* 3. Mobile Sticky Bottom Booking Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-md border-t border-border p-4 shadow-floating">
        <div className="container flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-muted-foreground block">Total for {travelersCount} person(s)</span>
            <span className="font-serif text-xl font-bold text-editorial-terracotta">
              {formatPKR(totalPrice)}
            </span>
          </div>

          <Button
            variant="editorial"
            size="sm"
            onClick={handleBookNow}
            disabled={!selectedAvailability || selectedAvailability.status !== "open"}
            className="rounded-full px-6 font-bold text-xs h-11"
          >
            <span>Book Expedition</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </div>

      {/* 4. Related Expeditions Section ("You might also like") */}
      {relatedTours.length > 0 && (
        <section className="container pt-12 border-t border-border">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
            <div>
              <span className="text-xs uppercase tracking-widest text-editorial-terracotta font-semibold">
                Similar Horizons
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mt-0.5">
                You Might Also Like
              </h3>
            </div>
            <Link
              to="/tours"
              className="text-xs font-semibold text-editorial-terracotta hover:underline inline-flex items-center gap-1"
            >
              <span>All Expeditions</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedTours.map((relTour) => (
              <TourCard key={relTour.id} tour={relTour} />
            ))}
          </div>
        </section>
      )}

      {/* 5. The Multi-Step Booking Modal */}
      {tour && selectedAvailability && (
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          tour={tour}
          selectedAvailability={selectedAvailability}
          travelersCount={travelersCount}
          userId={user?.id || "guest-authenticated-user"}
          onBookingComplete={() => {
            // Reload availability counts
            loadTourDetails()
          }}
        />
      )}
    </div>
  )
}
