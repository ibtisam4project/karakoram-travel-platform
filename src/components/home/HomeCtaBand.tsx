import React from "react"
import { Link } from "react-router-dom"
import { Compass, PhoneCall, ArrowRight, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HomeCtaBand() {
  return (
    <section className="container py-16">
      <div className="relative rounded-3xl overflow-hidden bg-editorial-navy text-white p-8 sm:p-12 md:p-16 shadow-floating">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-editorial-terracotta/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-96 h-96 bg-editorial-gold/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-editorial-sand text-xs font-semibold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 text-editorial-gold" />
            <span>Ready for Your Northern Adventure?</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight text-white leading-tight">
            Let Us Craft Your Unforgettable Journey.
          </h2>

          <p className="text-sm sm:text-base text-editorial-sand/90 font-sans leading-relaxed">
            Speak directly with our Islamabad concierge desk to customize private VIP family charters, high-altitude trekking permits, or honeymoon chalets.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <Link to="/tours">
              <Button
                variant="editorial"
                size="lg"
                className="rounded-full px-8 font-bold gap-2 shadow-lg hover:shadow-xl w-full sm:w-auto"
              >
                <span>Browse All Expeditions</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <a href="tel:+923008550123" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8 bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white w-full sm:w-auto gap-2"
              >
                <PhoneCall className="w-4 h-4 text-editorial-gold" />
                <span>+92 300 8550123</span>
              </Button>
            </a>
          </div>

          <div className="pt-4 flex items-center gap-4 text-xs text-editorial-sand/70 border-t border-white/10">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-editorial-gold" />
              No Hidden Fees
            </span>
            <span>&bull;</span>
            <span>Custom Family Itineraries</span>
            <span>&bull;</span>
            <span>Pakistani Bank &amp; Wallet Support</span>
          </div>
        </div>
      </div>
    </section>
  )
}
