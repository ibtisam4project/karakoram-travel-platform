import React, { useState, useEffect } from "react"
import {
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import { Booking } from "@/types/database"
import { DataTable, ColumnDef, RowAction } from "@/components/admin/DataTable"
import { BookingDetailModal } from "@/components/admin/bookings/BookingDetailModal"
import { ConfirmDialog } from "@/components/admin/ConfirmDialog"
import { Badge } from "@/components/ui/badge"

export function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Selected booking for detail view
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Cancel action confirmation
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  // Load all bookings
  const loadBookings = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          tour:tours(id, title, category, slug),
          availability:tour_availability(departure_date, seats_total, seats_booked, status)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setBookings((data as Booking[]) || [])
    } catch (err: any) {
      console.error("Error loading bookings:", err)
      toast.error("Failed to load customer bookings")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()

    // Supabase Realtime subscription for incoming bookings (no polling)
    const channel = supabase
      .channel("admin-bookings-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
        },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newId = (payload.new as any).id
            // Fetch joined relations for new booking
            const { data } = await supabase
              .from("bookings")
              .select(`
                *,
                tour:tours(id, title, category, slug),
                availability:tour_availability(departure_date, seats_total, seats_booked, status)
              `)
              .eq("id", newId)
              .single()

            if (data) {
              setBookings((prev) => {
                const exists = prev.some((b) => b.id === data.id)
                return exists ? prev : [data as Booking, ...prev]
              })
              toast.info(
                `🔔 New Booking: ${data.booking_reference} (${data.contact_info?.fullName || "Guest"})`,
                { duration: 7000 }
              )
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedId = (payload.new as any).id
            setBookings((prev) =>
              prev.map((b) => (b.id === updatedId ? { ...b, ...payload.new } : b))
            )
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as any).id
            setBookings((prev) => prev.filter((b) => b.id !== deletedId))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Currency Formatter
  const formatPKR = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Quick Status change
  const handleQuickStatus = async (
    b: Booking,
    nextStatus: "pending" | "confirmed" | "cancelled" | "completed"
  ) => {
    try {
      // If cancelling, adjust seats
      if (nextStatus === "cancelled" && b.availability_id) {
        const { data: avail } = await supabase
          .from("tour_availability")
          .select("*")
          .eq("id", b.availability_id)
          .single()

        if (avail) {
          const restored = Math.max(0, avail.seats_booked - (b.travelers_count || 1))
          await supabase
            .from("tour_availability")
            .update({
              seats_booked: restored,
              status: restored < avail.seats_total ? "open" : avail.status,
            })
            .eq("id", b.availability_id)
        }
      }

      // If re-confirming, reserve seats
      if (b.status === "cancelled" && nextStatus === "confirmed" && b.availability_id) {
        const { data: avail } = await supabase
          .from("tour_availability")
          .select("*")
          .eq("id", b.availability_id)
          .single()

        if (avail) {
          const added = avail.seats_booked + (b.travelers_count || 1)
          await supabase
            .from("tour_availability")
            .update({
              seats_booked: added,
              status: added >= avail.seats_total ? "full" : "open",
            })
            .eq("id", b.availability_id)
        }
      }

      const { error } = await supabase
        .from("bookings")
        .update({ status: nextStatus })
        .eq("id", b.id)

      if (error) throw error

      toast.success(`Booking ${b.booking_reference} marked as ${nextStatus}`)
      setBookings((prev) =>
        prev.map((item) => (item.id === b.id ? { ...item, status: nextStatus } : item))
      )
    } catch (err: any) {
      console.error("Error setting status:", err)
      toast.error(err.message || "Failed to update status")
    }
  }

  // Confirm cancel dialog
  const handleConfirmCancel = async () => {
    if (!cancelTarget) return
    try {
      setIsCancelling(true)
      await handleQuickStatus(cancelTarget, "cancelled")
      setCancelTarget(null)
    } finally {
      setIsCancelling(false)
    }
  }

  // Columns definition
  const columns: ColumnDef<Booking>[] = [
    {
      header: "Reference",
      accessorKey: "booking_reference",
      sortable: true,
      className: "min-w-[120px]",
      cell: (b) => (
        <div>
          <button
            onClick={() => {
              setSelectedBooking(b)
              setShowDetailModal(true)
            }}
            className="font-mono font-bold text-xs text-editorial-navy dark:text-editorial-sand hover:underline block text-left"
          >
            {b.booking_reference}
          </button>
          <span className="text-[10px] text-muted-foreground font-mono">
            {new Date(b.created_at).toLocaleDateString("en-PK", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      ),
    },
    {
      id: "traveler",
      header: "Traveler",
      className: "min-w-[170px]",
      cell: (b) => (
        <div className="space-y-0.5">
          <span className="font-semibold text-xs text-foreground block">
            {b.contact_info?.fullName || "Guest"}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono block">
            {b.contact_info?.phone || b.contact_info?.email || "No contact"}
          </span>
        </div>
      ),
    },
    {
      id: "tour_dep",
      header: "Expedition & Departure",
      className: "min-w-[200px]",
      cell: (b) => (
        <div className="space-y-0.5 max-w-[220px]">
          <span className="font-serif font-bold text-xs text-foreground truncate block">
            {(Array.isArray(b.tour) ? b.tour[0]?.title : b.tour?.title) || "Expedition"}
          </span>
          <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
            <Calendar className="w-3 h-3 text-editorial-terracotta shrink-0" />
            <span>
              {b.availability?.departure_date
                ? new Date(b.availability.departure_date).toLocaleDateString("en-PK", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Open Date"}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Travelers",
      accessorKey: "travelers_count",
      sortable: true,
      cell: (b) => (
        <span className="text-xs font-semibold">
          {b.travelers_count} Pax
        </span>
      ),
    },
    {
      header: "Total (PKR)",
      accessorKey: "total_price",
      sortable: true,
      cell: (b) => (
        <span className="font-serif font-bold text-xs text-editorial-terracotta">
          {formatPKR(b.total_price)}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (b) => (
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
          className="text-[10px] uppercase font-bold tracking-wider"
        >
          {b.status}
        </Badge>
      ),
    },
  ]

  // Row actions
  const rowActions: RowAction<Booking>[] = [
    {
      label: "View Manifest & Dossier",
      icon: <Eye className="w-3.5 h-3.5 text-editorial-navy dark:text-editorial-sand" />,
      onClick: (b) => {
        setSelectedBooking(b)
        setShowDetailModal(true)
      },
    },
    {
      label: "Confirm Booking",
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
      onClick: (b) => handleQuickStatus(b, "confirmed"),
    },
    {
      label: "Mark Completed",
      icon: <Clock className="w-3.5 h-3.5 text-blue-600" />,
      onClick: (b) => handleQuickStatus(b, "completed"),
    },
    {
      label: "Cancel Booking",
      icon: <XCircle className="w-3.5 h-3.5 text-destructive" />,
      variant: "destructive",
      separatorBefore: true,
      onClick: (b) => setCancelTarget(b),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-editorial-terracotta">
          Bookings Manifest
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
          Expedition Reservations ({bookings.length})
        </h1>
        <p className="text-xs text-muted-foreground">
          Inspect guest itineraries, dietary notes, manage clearance statuses, and synchronize seat allocations.
        </p>
      </div>

      {/* Bookings DataTable */}
      <DataTable
        data={bookings}
        columns={columns}
        rowActions={rowActions}
        isLoading={isLoading}
        searchKey={(b) =>
          `${b.booking_reference} ${b.contact_info?.fullName || ""} ${b.contact_info?.email || ""} ${
            b.contact_info?.phone || ""
          } ${(Array.isArray(b.tour) ? b.tour[0]?.title : b.tour?.title) || ""}`
        }
        searchPlaceholder="Search by reference, traveler name, phone, or tour..."
        filters={[
          {
            label: "Status",
            key: "status",
            options: [
              { label: "Pending", value: "pending" },
              { label: "Confirmed", value: "confirmed" },
              { label: "Completed", value: "completed" },
              { label: "Cancelled", value: "cancelled" },
            ],
          },
        ]}
        emptyMessage="No customer reservations recorded."
      />

      {/* Booking Detail Modal */}
      <BookingDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        booking={selectedBooking}
        onBookingUpdated={(updated) => {
          setBookings((prev) =>
            prev.map((b) => (b.id === updated.id ? updated : b))
          )
          setSelectedBooking(updated)
        }}
      />

      {/* Confirm Cancellation Dialog */}
      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Cancel Expedition Reservation?"
        description={
          cancelTarget ? (
            <span>
              Are you sure you want to cancel booking{" "}
              <strong>{cancelTarget.booking_reference}</strong> for{" "}
              <strong>{cancelTarget.contact_info?.fullName || "Guest"}</strong>? This will
              release <strong>{cancelTarget.travelers_count} seat(s)</strong> back to the
              departure calendar.
            </span>
          ) : (
            ""
          )
        }
        confirmLabel="Cancel Booking"
        variant="destructive"
        isLoading={isCancelling}
        onConfirm={handleConfirmCancel}
      />
    </div>
  )
}
