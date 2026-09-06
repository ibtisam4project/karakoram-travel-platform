import React from "react"
import { HeroSearch } from "@/components/home/HeroSearch"
import { PopularDestinations } from "@/components/home/PopularDestinations"
import { FeaturedTours } from "@/components/home/FeaturedTours"
import { ValueProps } from "@/components/home/ValueProps"
import { Testimonials } from "@/components/home/Testimonials"
import { HomeCtaBand } from "@/components/home/HomeCtaBand"

export function HomePage() {
  return (
    <div className="space-y-4">
      {/* 1. Full-Bleed Hero with Animated Search Bar */}
      <HeroSearch />

      {/* 2. Popular Destinations Grid */}
      <PopularDestinations />

      {/* 3. Featured Signature Tours */}
      <FeaturedTours />

      {/* 4. Why Book With Us / Value Props */}
      <ValueProps />

      {/* 5. Verified Guest Reviews & Testimonials */}
      <Testimonials />

      {/* 6. Closing Call to Action Band */}
      <HomeCtaBand />
    </div>
  )
}
