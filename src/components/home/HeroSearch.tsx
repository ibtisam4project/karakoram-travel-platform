import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { MapPin, Calendar, Users, Search, Sparkles, ShieldCheck } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Destination } from "@/types/database"
import { Button } from "@/components/ui/button"

export function HeroSearch() {
  const navigate = useNavigate()
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [selectedDestination, setSelectedDestination] = useState<string>("")
  const [dateMonth, setDateMonth] = useState<string>("")
  const [travelers, setTravelers] = useState<string>("2")

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (selectedDestination) params.append("destination", selectedDestination)
    if (dateMonth) params.append("departure", dateMonth)
    if (travelers) params.append("travelers", travelers)
    navigate(`/tours?${params.toString()}`)
  }

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* 1. Full-Bleed Atmospheric Background Image with Gradient Mask */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/tours/k2_base_camp_trek_1788431873354.jpg"
          alt="Karakoram Mountains Expeditions"
          className="w-full h-full object-cover object-center scale-105 animate-in fade-in duration-1000"
        />
        {/* Editorial Gradients: Darker bottom & top for navigation and text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-black/45 to-black/75" />
        <div className="absolute inset-0 bg-radial-at-c from-transparent via-black/30 to-black/80" />
      </div>

      {/* 2. Hero Content Container */}
      <div className="container relative z-10 py-24 md:py-32 flex flex-col items-center text-center space-y-8 max-w-5xl">
        {/* Subtle Pill Tag */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold tracking-wider uppercase shadow-subtle"
        >
          <Sparkles className="w-3.5 h-3.5 text-editorial-gold" />
          <span>Curated Expeditions Across Pakistan &amp; Beyond</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold text-white tracking-tight leading-[1.1] max-w-4xl drop-shadow-md"
        >
          Untamed Frontiers, <br />
          <span className="italic font-normal text-editorial-sand">Unrivaled</span> Hospitality.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="text-base sm:text-lg md:text-xl text-editorial-sand/90 font-sans max-w-2xl leading-relaxed drop-shadow"
        >
          From the throne room of K2 and golden Hunza valleys to executive Umrah sanctuaries. Handcrafted boutique expeditions with all pricing in Pakistani Rupees.
        </motion.p>

        {/* 3. Editorial Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
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

            {/* Submit Button */}
            <div className="flex items-center">
              <Button
                type="submit"
                variant="editorial"
                className="w-full h-14 rounded-2xl font-bold tracking-wide text-sm gap-2 shadow-card hover:shadow-lg transition-all"
              >
                <Search className="w-4 h-4" />
                <span>Find Expeditions</span>
              </Button>
            </div>
          </form>

          {/* Quick Badges beneath search bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4 text-xs text-white/80">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-editorial-gold" />
              100% Guaranteed Departures
            </span>
            <span>&bull;</span>
            <span>Personalized VIP Coasters &amp; 4x4 Jeeps</span>
            <span>&bull;</span>
            <span>Local Karakoram Guides</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
