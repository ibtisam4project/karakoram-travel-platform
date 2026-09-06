import React from "react"
import { ShieldCheck, Compass, HeartHandshake, Mountain } from "lucide-react"

export function ValueProps() {
  const props = [
    {
      icon: <ShieldCheck className="w-8 h-8 text-editorial-terracotta" />,
      title: "DTS Government Licensed & Insured",
      description:
        "Registered with the Department of Tourist Services, Govt of Pakistan. Every booking carries complete itinerary transparency and dedicated rescue coverage.",
    },
    {
      icon: <Mountain className="w-8 h-8 text-editorial-terracotta" />,
      title: "Indigenous Mountain Leaders",
      description:
        "Led by certified Wakhi, Balti, and Hunzai mountain guides who grew up navigating high passes and know every hidden trail across the Karakoram & Himalayas.",
    },
    {
      icon: <Compass className="w-8 h-8 text-editorial-terracotta" />,
      title: "Boutique Group Sizes",
      description:
        "We cap our journeys at 8–14 travelers. No crowded tour buses—only luxury air-conditioned coasters, private 4x4 Prado/Jeep transfers, and curated heritage lodges.",
    },
    {
      icon: <HeartHandshake className="w-8 h-8 text-editorial-terracotta" />,
      title: "Pakistani Hospitality (Mehman-Nawazi)",
      description:
        "Rooted in genuine local warmth. Enjoy freshly brewed Karak chai, authentic regional feasts, and deep cultural immersion with local communities.",
    },
  ]

  return (
    <section className="container py-16 md:py-24">
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
        <span className="text-xs uppercase tracking-widest text-editorial-terracotta font-semibold">
          The Karakoram Standard
        </span>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
          Why Discerning Travelers Choose Us
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed font-sans">
          We combine world-class expedition safety standards with the timeless warmth of authentic Pakistani hospitality.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {props.map((p, idx) => (
          <div
            key={idx}
            className="p-8 rounded-3xl border border-border/70 bg-card text-card-foreground shadow-subtle hover:shadow-floating hover:-translate-y-1.5 transition-all duration-300 space-y-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-editorial-sand/80 dark:bg-muted flex items-center justify-center border border-border/60">
              {p.icon}
            </div>
            <h3 className="font-display text-lg font-bold text-foreground leading-snug">
              {p.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {p.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
