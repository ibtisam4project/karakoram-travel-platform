import React from "react"
import { HeroSearch } from "@/components/home/HeroSearch"
import { PopularDestinations } from "@/components/home/PopularDestinations"
import { FeaturedTours } from "@/components/home/FeaturedTours"
import { ValueProps } from "@/components/home/ValueProps"
import { Testimonials } from "@/components/home/Testimonials"
import { HomeCtaBand } from "@/components/home/HomeCtaBand"
import { Reveal } from "@/lib/animation"

export function HomePage() {
  return (
    <div className="space-y-4 overflow-hidden">
      {/* 1. Full-Bleed Hero with Parallax & SplitText Heading */}
      <HeroSearch />

      {/* 2. Popular Destinations Grid with Scroll Reveal */}
      <Reveal options={{ y: 35, duration: 0.8 }}>
        <PopularDestinations />
      </Reveal>

      {/* 3. Featured Signature Tours with Staggered Scroll Reveal */}
      <Reveal options={{ y: 35, duration: 0.85, delay: 0.1 }}>
        <FeaturedTours />
      </Reveal>

      {/* 4. Why Book With Us / Value Props */}
      <Reveal options={{ y: 30, duration: 0.8 }}>
        <ValueProps />
      </Reveal>

      {/* 5. Verified Guest Reviews & Testimonials */}
      <Reveal options={{ y: 30, duration: 0.8 }}>
        <Testimonials />
      </Reveal>

      {/* 6. Closing Call to Action Band */}
      <Reveal options={{ y: 25, duration: 0.75 }}>
        <HomeCtaBand />
      </Reveal>
    </div>
  )
}
