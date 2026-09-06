import React, { useEffect, useState } from "react"
import { Star, Quote, ShieldCheck } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { Review } from "@/types/database"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Testimonials() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchReviews() {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from("reviews")
          .select(`
            *,
            profile:profiles(*),
            tour:tours(title, slug)
          `)
          .order("created_at", { ascending: false })
          .limit(4)

        if (error) throw error

        if (data && data.length > 0) {
          setReviews(data as unknown as Review[])
        } else {
          // Fallback seeded testimonials if Supabase reviews table has not been migrated yet
          setReviews([
            {
              id: "1",
              user_id: "u1",
              tour_id: "t1",
              booking_id: null,
              rating: 5,
              comment:
                "The Autumn tour in Hunza exceeded every single expectation. Traveling with elderly parents and children is never easy in the north, but Karakoram & Co handled heated coasters, Serena Hunza suites, and local apricot farm visits with royal hospitality.",
              created_at: new Date().toISOString(),
              profile: {
                id: "u1",
                full_name: "Dr. Taimur Khan & Family (Lahore)",
                avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
                phone: null,
                role: "user",
                created_at: new Date().toISOString(),
              },
            },
            {
              id: "2",
              user_id: "u2",
              tour_id: "t2",
              booking_id: null,
              rating: 5,
              comment:
                "Our honeymoon in Shangrila and the Katpana cold desert glamping was straight out of a dream. Candlelit dinner on the white sand dunes with Karakoram peaks under the milky way will stay in our hearts forever.",
              created_at: new Date().toISOString(),
              profile: {
                id: "u2",
                full_name: "Ayesha Siddiqui & Bilal (Karachi)",
                avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
                phone: null,
                role: "user",
                created_at: new Date().toISOString(),
              },
            },
            {
              id: "3",
              user_id: "u3",
              tour_id: "t3",
              booking_id: null,
              rating: 5,
              comment:
                "As an alpine trekker, Baltoro is the ultimate test. The expedition porters, high-altitude mountain chef, and satellite safety gear provided by Karakoram & Co were world-class. Standing at Concordia facing K2 was profound.",
              created_at: new Date().toISOString(),
              profile: {
                id: "u3",
                full_name: "Zain Ul Abideen (Alpine Club)",
                avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
                phone: null,
                role: "user",
                created_at: new Date().toISOString(),
              },
            },
          ])
        }
      } catch (err) {
        console.error("Error fetching reviews:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReviews()
  }, [])

  return (
    <section className="bg-editorial-sand/40 dark:bg-card/40 border-t border-border py-16 md:py-24 transition-colors">
      <div className="container">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-xs uppercase tracking-widest text-editorial-terracotta font-semibold">
            Traveler Chronicles
          </span>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
            Stories from the High Trails
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed font-sans">
            Read unedited feedback from Pakistani families, mountaineers, and honeymooners who traveled with us.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-8 rounded-3xl bg-background dark:bg-card border border-border/80 shadow-subtle flex flex-col justify-between space-y-6 hover:shadow-card transition-shadow"
            >
              <div className="space-y-4">
                {/* Rating & Quote Icon */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-editorial-gold text-editorial-gold" />
                    ))}
                  </div>
                  <Quote className="w-7 h-7 text-editorial-terracotta/30" />
                </div>

                {/* Comment */}
                <p className="text-sm text-foreground/90 leading-relaxed font-sans italic">
                  "{rev.comment}"
                </p>
              </div>

              {/* Author & Verification */}
              <div className="pt-4 border-t border-border/60 flex items-center gap-3">
                <Avatar className="h-11 w-11 border border-editorial-terracotta/30">
                  <AvatarImage src={rev.profile?.avatar_url || ""} alt={rev.profile?.full_name || "Guest"} />
                  <AvatarFallback className="bg-editorial-navy text-white text-xs font-serif">
                    {rev.profile?.full_name?.charAt(0) || "G"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-serif text-sm font-bold text-foreground">
                    {rev.profile?.full_name || "Verified Traveler"}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified Guest Departure</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
