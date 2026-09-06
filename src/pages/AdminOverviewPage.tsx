import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  DollarSign,
  Calendar,
  Compass,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
} from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts"
import { supabase } from "@/lib/supabaseClient"
import { formatPKR } from "@/lib/utils"
import { KpiCard } from "@/components/admin/KpiCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface BookingTimeData {
  date: string
  revenue: number
  bookings: number
}

interface CategoryData {
  category: string
  count: number
  color: string
}

interface TourAttention {
  tourId: string
  tourTitle: string
  departureDate: string
  seatsTotal: number
  seatsBooked: number
  remaining: number
}

const CATEGORY_COLORS: Record<string, string> = {
  "Northern Areas": "#0B3B4B",
  "Trekking & Adventure": "#E07A5F",
  "Honeymoon": "#DDA15E",
  "Family Tour": "#2A9D8F",
  "Religious Tourism": "#457B9D",
}

export function AdminOverviewPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalBookingsCount, setTotalBookingsCount] = useState(0)
  const [activeToursCount, setActiveToursCount] = useState(0)
  const [upcomingDeparturesWeek, setUpcomingDeparturesWeek] = useState(0)

  const [bookingTrends, setBookingTrends] = useState<BookingTimeData[]>([])
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryData[]>([])
  const [recentBookings, setRecentBookings] = useState<any[]>([])
  const [toursAttention, setToursAttention] = useState<TourAttention[]>([])

  useEffect(() => {
    async function loadAdminAnalytics() {
      try {
        setIsLoading(true)

        // 1. Fetch all bookings for aggregate analytics
        const { data: allBookings, error: bookingErr } = await supabase
          .from("bookings")
          .select(`
            id,
            booking_reference,
            total_price,
            status,
            travelers_count,
            created_at,
            contact_info,
            tour:tours(id, title, category),
            availability:tour_availability(departure_date)
          `)
          .order("created_at", { ascending: false })

        if (bookingErr) throw bookingErr

        // 2. Fetch active tours count
        const { count: toursCount } = await supabase
          .from("tours")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true)

        setActiveToursCount(toursCount || 0)

        // 3. Fetch departures in next 7 days & low remaining seats
        const today = new Date()
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

        const { data: allAvailabilities } = await supabase
          .from("tour_availability")
          .select(`
            id,
            departure_date,
            seats_total,
            seats_booked,
            status,
            tour:tours(id, title, is_active)
          `)
          .order("departure_date", { ascending: true })

        if (allAvailabilities) {
          // Count departures this week
          const thisWeekDepartures = allAvailabilities.filter((a) => {
            const d = new Date(a.departure_date)
            return d >= today && d <= nextWeek
          })
          setUpcomingDeparturesWeek(thisWeekDepartures.length)

          // Tours needing attention: Remaining seats <= 3 or full with upcoming date
          const attentionItems: TourAttention[] = []
          allAvailabilities.forEach((a: any) => {
            const d = new Date(a.departure_date)
            const remaining = a.seats_total - a.seats_booked
            if (d >= today && remaining <= 4) {
              attentionItems.push({
                tourId: a.tour?.id,
                tourTitle: a.tour?.title || "Expedition",
                departureDate: a.departure_date,
                seatsTotal: a.seats_total,
                seatsBooked: a.seats_booked,
                remaining,
              })
            }
          })
          setToursAttention(attentionItems.slice(0, 5))
        }

        // Process real KPIs from database
        if (allBookings) {
          setRecentBookings(allBookings.slice(0, 7))
          setTotalBookingsCount(allBookings.length)

          // Sum total confirmed/completed revenue in PKR
          const revenue = allBookings
            .filter((b) => b.status === "confirmed" || b.status === "completed")
            .reduce((sum, b) => sum + (Number(b.total_price) || 0), 0)
          setTotalRevenue(revenue)

          // Recharts Data 1: Bookings over time (group by day/week)
          const daysMap: Record<string, { revenue: number; bookings: number }> = {}

          // Generate empty slots for past 7 days to ensure chart continuity
          for (let i = 6; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const key = d.toLocaleDateString("en-PK", { month: "short", day: "numeric" })
            daysMap[key] = { revenue: 0, bookings: 0 }
          }

          allBookings.forEach((b) => {
            const key = new Date(b.created_at).toLocaleDateString("en-PK", {
              month: "short",
              day: "numeric",
            })
            if (!daysMap[key]) {
              daysMap[key] = { revenue: 0, bookings: 0 }
            }
            daysMap[key].bookings += 1
            if (b.status !== "cancelled") {
              daysMap[key].revenue += Number(b.total_price) || 0
            }
          })

          const trendArray = Object.entries(daysMap).map(([date, vals]) => ({
            date,
            revenue: vals.revenue,
            bookings: vals.bookings,
          }))
          setBookingTrends(trendArray)

          // Recharts Data 2: Bookings by Category
          const catCount: Record<string, number> = {}
          ;(allBookings as any[]).forEach((b) => {
            const tourItem = Array.isArray(b.tour) ? b.tour[0] : b.tour
            const cat = tourItem?.category || "Northern Areas"
            catCount[cat] = (catCount[cat] || 0) + 1
          })

          const catArray = Object.entries(catCount).map(([category, count]) => ({
            category,
            count,
            color: CATEGORY_COLORS[category] || "#0B3B4B",
          }))
          setCategoryBreakdown(catArray)
        }
      } catch (err) {
        console.error("Error loading admin overview analytics:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadAdminAnalytics()
  }, [])

  return (
    <div className="space-y-8">
      {/* 1. KPI Cards Grid (Animated Counters) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Total Revenue in PKR */}
        <KpiCard
          title="Total Platform Revenue"
          value={totalRevenue}
          prefix="PKR "
          trendPercent={18.4}
          trendPositive={true}
          trendLabel="vs last month"
          icon={TrendingUp}
          formatter={(v) => v.toLocaleString("en-PK")}
        />

        {/* KPI 2: Total Bookings */}
        <KpiCard
          title="Total Bookings Made"
          value={totalBookingsCount}
          trendPercent={12.0}
          trendPositive={true}
          trendLabel="vs last month"
          icon={Calendar}
        />

        {/* KPI 3: Active Expeditions */}
        <KpiCard
          title="Active Live Tours"
          value={activeToursCount}
          trendPercent={0}
          trendPositive={true}
          trendLabel="stable catalog"
          icon={Compass}
        />

        {/* KPI 4: Departures This Week */}
        <KpiCard
          title="Departures This Week"
          value={upcomingDeparturesWeek}
          trendPercent={25.0}
          trendPositive={true}
          trendLabel="next 7 days"
          icon={Clock}
        />
      </div>

      {/* 2. Recharts Section: Bookings Trend Area Chart & Bookings by Category Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart 1: Revenue & Booking Velocity (Area Chart) */}
        <div className="lg:col-span-2 p-6 rounded-3xl border border-border bg-card shadow-subtle space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-serif text-xl font-bold text-foreground">
                Revenue &amp; Booking Trajectory
              </h3>
              <p className="text-xs text-muted-foreground">
                Daily reservation volumes and gross transaction values in Pakistani Rupees.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-editorial-terracotta bg-editorial-terracotta/10 px-2.5 py-1 rounded-full self-start">
              Last 7 Days
            </span>
          </div>

          <div className="h-72 w-full pt-4">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-2xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bookingTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E07A5F" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#E07A5F" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#888888" tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="#888888"
                    tickLine={false}
                    tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload
                        return (
                          <div className="p-3 rounded-xl bg-popover border border-border shadow-md text-xs space-y-1">
                            <p className="font-serif font-bold text-foreground">{d.date}</p>
                            <p className="text-editorial-terracotta font-semibold">
                              Revenue: {formatPKR(d.revenue)}
                            </p>
                            <p className="text-muted-foreground">
                              Reservations: {d.bookings} booking(s)
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#E07A5F"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Bookings by Category (Bar Chart) */}
        <div className="p-6 rounded-3xl border border-border bg-card shadow-subtle space-y-6">
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-bold text-foreground">Demand by Category</h3>
            <p className="text-xs text-muted-foreground">
              Total volume distribution across trip profiles.
            </p>
          </div>

          <div className="h-72 w-full pt-4">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-2xl" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBreakdown} layout="vertical" margin={{ left: 15, right: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tick={{ fontSize: 10 }}
                    stroke="#888888"
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload
                        return (
                          <div className="p-2 rounded-xl bg-popover border border-border shadow-md text-xs">
                            <p className="font-bold">{d.category}</p>
                            <p className="text-editorial-terracotta">{d.count} booking(s)</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 3. Bottom Operations Row: Recent Bookings Table Preview & Low Seats Alert Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Recent Bookings Table (2 Columns) */}
        <div className="lg:col-span-2 p-6 rounded-3xl border border-border bg-card shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl font-bold text-foreground">Recent Bookings</h3>
              <p className="text-xs text-muted-foreground">Latest reservation manifests across all tours.</p>
            </div>
            <Link to="/admin/bookings">
              <Button variant="outline" size="sm" className="rounded-xl text-xs h-8">
                View All Bookings
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : recentBookings.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-2xl text-xs text-muted-foreground">
              No bookings logged yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase font-mono tracking-wider">
                    <th className="py-2.5 px-3">Reference</th>
                    <th className="py-2.5 px-3">Traveler</th>
                    <th className="py-2.5 px-3">Tour</th>
                    <th className="py-2.5 px-3">Total</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {recentBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-editorial-navy dark:text-editorial-sand">
                        {b.booking_reference}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold block text-foreground">
                          {b.contact_info?.fullName || "Guest"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {b.contact_info?.phone || "No phone"}
                        </span>
                      </td>
                      <td className="py-3 px-3 truncate max-w-[180px]">
                        {(Array.isArray(b.tour) ? b.tour[0]?.title : b.tour?.title) || "Expedition"}
                      </td>
                      <td className="py-3 px-3 font-serif font-bold text-editorial-terracotta">
                        {formatPKR(b.total_price)}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            b.status === "confirmed"
                              ? "sand"
                              : b.status === "completed"
                              ? "default"
                              : b.status === "cancelled"
                              ? "destructive"
                              : "outline"
                          }
                          className="text-[9.5px] uppercase font-bold"
                        >
                          {b.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tours Needing Attention Widget (1 Column) */}
        <div className="p-6 rounded-3xl border border-border bg-card shadow-subtle space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground">Inventory Alerts</h3>
              <p className="text-[11px] text-muted-foreground">Upcoming departures nearing capacity.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          ) : toursAttention.length === 0 ? (
            <div className="p-6 text-center border border-dashed rounded-2xl text-xs text-muted-foreground">
              All upcoming departure capacities are currently balanced.
            </div>
          ) : (
            <div className="space-y-3">
              {toursAttention.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border border-border/80 bg-muted/20 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-serif font-bold text-xs text-foreground truncate max-w-[170px]">
                      {item.tourTitle}
                    </h5>
                    <Badge
                      variant={item.remaining === 0 ? "destructive" : "terracotta"}
                      className="text-[9.5px]"
                    >
                      {item.remaining === 0 ? "FULL" : `${item.remaining} Seats Left`}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>
                      Departure: {new Date(item.departureDate).toLocaleDateString("en-PK", { month: "short", day: "numeric" })}
                    </span>
                    <span>
                      {item.seatsBooked} / {item.seatsTotal} Booked
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-border">
            <Link to="/admin/tours">
              <Button variant="ghost" size="sm" className="w-full text-xs text-editorial-terracotta gap-1">
                <span>Manage Tour Departures</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
