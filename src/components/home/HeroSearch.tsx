import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { MapPin, Calendar, Users, Search, Sparkles, ShieldCheck } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Destination } from "@/types/database"
import { Button } from "@/components/ui/button"
import { useParallax, useSplitTextReveal, useMagneticButton } from "@/lib/animation"

export function HeroSearch() {
  const navigate = useNavigate()
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [selectedDestination, setSelectedDestination] = useState<string>("")
  const [dateMonth, setDateMonth] = useState<string>("")
  const [travelers, setTravelers] = useState<string>("2")

  const sectionRef = useRef<HTMLElement | null>(null)
  const bgImageRef = useRef<HTMLImageElement | null>(null)
  const pillRef = useRef<HTMLDivElement | null>(null)
  const headlineRef = useRef<HTMLHeadingElement | null>(null)
  const subtitleRef = useRef<HTMLParagraphElement | null>(null)
  const searchBoxRef = useRef<HTMLDivElement | null>(null)
  const searchButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    async function fetchDestinations() {
      const { data } = await supabase
        .from("destinations")
        .select("id, name, country")
        .order("name", { ascending: true })
      if (data) {
        setDestinations(data as Destination[])
      }
    }
    fetchDestinations()
  }, [])

  // Signature animation hooks from internal animation toolkit
  useParallax(bgImageRef, { speed: 28, scale: 1.18, start: "top top", end: "bottom top" })
  useSplitTextReveal(headlineRef, { type: "words", duration: 0.8, delay: 0.15 })
  useMagneticButton(searchButtonRef, { strength: 0.3, scale: 1.03 })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (selectedDestination) params.append("destination", selectedDestination)
    if (dateMonth) params.append("departure", dateMonth)
    if (travelers) params.append("travelers", travelers)
    navigate(`/tours?${params.toString()}`)
  }

  return (
    <section ref={sectionRef} className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
      {/* 1. Full-Bleed Atmospheric Background Image with GSAP Parallax */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          ref={bgImageRef}
          src="/images/tours/k2_base_camp_trek_1788431873354.jpg"
          alt="Karakoram Mountains Expeditions"
          className="w-full h-[125%] object-cover object-center -translate-y-[10%]"
        />
        {/* Editorial Gradients: Darker bottom & top for navigation and text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-black/45 to-black/75" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-black/30 to-black/80" />
      </div>

      {/* 2. Hero Content Container */}
      <div className="container relative z-10 py-24 md:py-32 flex flex-col items-center text-center space-y-8 max-w-5xl">
        {/* Subtle Pill Tag */}
        <div
          ref={pillRef}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold tracking-wider uppercase shadow-subtle font-sans"
        >
          <Sparkles className="w-3.5 h-3.5 text-editorial-gold" />
          <span>Curated Expeditions Across Pakistan &amp; Beyond</span>
        </div>

        {/* Headline with Fraunces / Playfair Display font */}
        <h1
          ref={headlineRef}
          className="text-4xl sm:text-6xl md:text-7xl font-display font-bold text-white tracking-tight leading-[1.08] max-w-4xl drop-shadow-md"
        >
          Untamed Frontiers, <br />
          <span className="italic font-serif font-normal text-editorial-sand">Unrivaled</span> Hospitality.
        </h1>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="text-base sm:text-lg md:text-xl text-editorial-sand/90 font-sans max-w-2xl leading-relaxed drop-shadow"
        >
          From the throne room of K2 and golden Hunza valleys to executive Umrah sanctuaries. Handcrafted boutique expeditions with all pricing in Pakistani Rupees.
        </p>

        {/* 3. Editorial Search Bar */}
        <div
          ref={searchBoxRef}
          className="w-full max-w-4xl pt-4"
        >
          <form
            onSubmit={handleSearch}
            className="p-3 md:p-4 rounded-3xl bg-background/95 dark:bg-card/95 backdrop-blur-xl border border-border/80 shadow-floating grid grid-cols-1 md:grid-cols-4 gap-3 text-left"
          >
            {/* Input 1: Destination */}
            <div className="p-2.5 rounded-2xl hover:bg-muted/50 transition-colors flex flex-col justify-center">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1">
                <MapPin className="w-3.5 h-3.5 text-editorial-terracotta" />
                Destination
              </label>
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="bg-transparent text-foreground text-sm font-semibold focus:outline-none cursor-pointer w-full"
              >
                <option value="" className="bg-background text-foreground">All Pakistan &amp; International</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.name} className="bg-background text-foreground">
                    {d.name} ({d.country})
                  </option>
                ))}
              </select>
            </div>

            {/* Input 2: Departure Season / Month */}
            <div className="p-2.5 rounded-2xl hover:bg-muted/50 transition-colors flex flex-col justify-center border-t md:border-t-0 md:border-l border-border/60">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1">
                <Calendar className="w-3.5 h-3.5 text-editorial-terracotta" />
                Departure Season
              </label>
              <select
                value={dateMonth}
                onChange={(e) => setDateMonth(e.target.value)}
                className="bg-transparent text-foreground text-sm font-semibold focus:outline-none cursor-pointer w-full"
              >
                <option value="" className="bg-background text-foreground">Any Upcoming Departure</option>
                <option value="next-30-days" className="bg-background text-foreground">Next 30 Days</option>
                <option value="autumn-season" className="bg-background text-foreground">Autumn Gold (Oct - Nov)</option>
                <option value="spring-blossom" className="bg-background text-foreground">Cherry Blossom (Mar - Apr)</option>
                <option value="summer-trekking" className="bg-background text-foreground">Summer High Altitude (Jun - Aug)</option>
              </select>
            </div>

            {/* Input 3: Travelers */}
            <div className="p-2.5 rounded-2xl hover:bg-muted/50 transition-colors flex flex-col justify-center border-t md:border-t-0 md:border-l border-border/60">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1">
                <Users className="w-3.5 h-3.5 text-editorial-terracotta" />
                Travelers
              </label>
              <select
                value={travelers}
                onChange={(e) => setTravelers(e.target.value)}
                className="bg-transparent text-foreground text-sm font-semibold focus:outline-none cursor-pointer w-full"
              >
                <option value="1" className="bg-background text-foreground">1 Solo Adventurer</option>
                <option value="2" className="bg-background text-foreground">2 Couples / Duo</option>
                <option value="4" className="bg-background text-foreground">3 - 5 Family Group</option>
                <option value="8" className="bg-background text-foreground">6+ Corporate / Club</option>
              </select>
            </div>

            {/* Submit Button with GSAP Magnetic Interaction */}
            <div className="flex items-center">
              <Button
                ref={searchButtonRef}
                type="submit"
                variant="editorial"
                className="w-full h-14 rounded-2xl font-bold tracking-wide text-sm gap-2 shadow-card hover:shadow-lg transition-all active:scale-95"
              >
                <Search className="w-4 h-4" />
                <span>Find Expeditions</span>
              </Button>
            </div>
          </form>

          {/* Quick Badges beneath search bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 text-xs text-white/80 font-sans">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-editorial-gold" />
              100% Guaranteed Departures
            </span>
            <span>&bull;</span>
            <span>Personalized VIP Coasters &amp; 4x4 Jeeps</span>
            <span>&bull;</span>
            <span>Local Karakoram Guides</span>
          </div>
        </div>
      </div>
    </section>
  )
}
