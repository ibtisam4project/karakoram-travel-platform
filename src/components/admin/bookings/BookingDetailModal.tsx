import React, { useState } from "react"
import {
  FileText,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Mail,
  Phone,
  CreditCard,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import { Booking } from "@/types/database"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/admin/ConfirmDialog"

interface BookingDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: Booking | null
  onBookingUpdated: (updated: Booking) => void
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  open,
  onOpenChange,
  booking,
  onBookingUpdated,
}) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false)

  if (!booking) return null

  const formatPKR = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Update status and adjust tour_availability seats accordingly
  const handleStatusChange = async (nextStatus: "pending" | "confirmed" | "cancelled" | "completed") => {
    if (nextStatus === booking.status) return

    try {
      setIsUpdatingStatus(true)
      const prevStatus = booking.status
      const travelersCount = booking.travelers_count || 1

      // 1. If transitioning to/from cancelled, update seats on tour_availability
      if (booking.availability_id) {
        const { data: availData, error: availFetchErr } = await supabase
          .from("tour_availability")
          .select("*")
          .eq("id", booking.availability_id)
          .single()

        if (!availFetchErr && availData) {
          let updatedSeatsBooked = availData.seats_booked

          // If transitioning to cancelled from active: free up seats
          if (nextStatus === "cancelled" && (prevStatus === "pending" || prevStatus === "confirmed")) {
            updatedSeatsBooked = Math.max(0, availData.seats_booked - travelersCount)
            const newAvailStatus = updatedSeatsBooked < availData.seats_total ? "open" : availData.status

            await supabase
              .from("tour_availability")
              .update({
                seats_booked: updatedSeatsBooked,
                status: newAvailStatus,
              })
              .eq("id", booking.availability_id)
          }

          // If restoring from cancelled back to active: re-reserve seats
          if (prevStatus === "cancelled" && (nextStatus === "pending" || nextStatus === "confirmed")) {
            updatedSeatsBooked = availData.seats_booked + travelersCount
            const newAvailStatus = updatedSeatsBooked >= availData.seats_total ? "full" : "open"

            await supabase
              .from("tour_availability")
              .update({
                seats_booked: updatedSeatsBooked,
                status: newAvailStatus,
              })
              .eq("id", booking.availability_id)
          }
        }
      }

      // 2. Update booking status
      const { data: updatedBooking, error: bookingErr } = await supabase
        .from("bookings")
        .update({ status: nextStatus })
        .eq("id", booking.id)
        .select(`
          *,
          tour:tours(id, title, category, slug),
          availability:tour_availability(departure_date)
        `)
        .single()

      if (bookingErr) throw bookingErr

      toast.success(`Booking ${booking.booking_reference} marked as ${nextStatus.toUpperCase()}`)
      onBookingUpdated(updatedBooking as Booking)
      setConfirmCancelOpen(false)
    } catch (err: any) {
      console.error("Error updating booking status:", err)
      toast.error(err.message || "Failed to update booking status")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl rounded-3xl p-6 sm:p-8 max-h-[88vh] overflow-y-auto">
          <DialogHeader className="space-y-2 border-b border-border/70 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-editorial-navy dark:text-editorial-sand">
                <FileText className="w-5 h-5 text-editorial-terracotta" />
                <DialogTitle className="font-serif text-xl sm:text-2xl font-bold text-foreground">
                  Manifest: {booking.booking_reference}
                </DialogTitle>
              </div>

              <Badge
                variant={
                  booking.status === "confirmed"
                    ? "sand"
                    : booking.status === "completed"
                    ? "default"
                    : booking.status === "cancelled"
                    ? "destructive"
                    : "outline"
                }
                className="text-xs uppercase font-bold tracking-wider py-1 px-3 self-start sm:self-auto"
              >
                {booking.status}
              </Badge>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Booked on{" "}
              {new Date(booking.created_at).toLocaleDateString("en-PK", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* Expedition Summary Card */}
            <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-editorial-terracotta font-bold">
                  Expedition Details
                </span>
                <span className="text-xs font-serif font-bold text-foreground">
                  {booking.tour?.category || "Northern Areas"}
                </span>
              </div>

              <div>
                <h4 className="font-serif text-lg font-bold text-foreground">
                  {booking.tour?.title || "Expedition Package"}
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4 text-editorial-navy dark:text-editorial-sand shrink-0" />
                  <div>
                    <span className="block text-[10px] uppercase font-mono">Departure</span>
                    <span className="font-semibold text-foreground">
                      {booking.availability?.departure_date
                        ? new Date(booking.availability.departure_date).toLocaleDateString("en-PK", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Flexible / TBA"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4 text-editorial-navy dark:text-editorial-sand shrink-0" />
                  <div>
                    <span className="block text-[10px] uppercase font-mono">Travelers</span>
                    <span className="font-semibold text-foreground">
                      {booking.travelers_count} Person{booking.travelers_count > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="w-4 h-4 text-editorial-terracotta shrink-0" />
                  <div>
                    <span className="block text-[10px] uppercase font-mono">Total Paid / Due</span>
                    <span className="font-serif font-bold text-editorial-terracotta text-sm">
                      {formatPKR(booking.total_price)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Dossier */}
            <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-bold">
                Guest Contact Dossier
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="block text-[10px] uppercase font-mono text-muted-foreground">
                    Lead Traveler
                  </span>
                  <span className="font-serif font-bold text-sm text-foreground block">
                    {booking.contact_info?.fullName || "Guest Traveler"}
                  </span>
                  {booking.contact_info?.cnic && (
                    <span className="text-[11px] font-mono text-muted-foreground">
                      CNIC/Passport: {booking.contact_info.cnic}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="text-foreground">{booking.contact_info?.email || "No email"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" />
                    <span className="text-foreground font-mono">{booking.contact_info?.phone || "No phone"}</span>
                  </div>
                </div>

                {booking.contact_info?.specialRequests && (
                  <div className="sm:col-span-2 pt-2 border-t border-border/60">
                    <span className="block text-[10px] uppercase font-mono text-muted-foreground mb-1">
                      Dietary &amp; Special Accommodations:
                    </span>
                    <p className="p-2.5 rounded-xl bg-muted/40 text-xs italic text-foreground leading-relaxed">
                      "{booking.contact_info.specialRequests}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Status Change Operations */}
            <div className="p-4 rounded-2xl border border-editorial-navy/20 dark:border-editorial-sand/20 bg-muted/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-foreground font-bold">
                  Operational Status Actions
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Adjusting status automatically syncs departure seat counts
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={booking.status === "confirmed" || isUpdatingStatus}
                  onClick={() => handleStatusChange("confirmed")}
                  className="rounded-xl text-xs h-9 gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Booking</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={booking.status === "completed" || isUpdatingStatus}
                  onClick={() => handleStatusChange("completed")}
                  className="rounded-xl text-xs h-9 gap-1.5 border-blue-500/40 text-blue-700 dark:text-blue-400 hover:bg-blue-500/10"
                >
                  <Clock className="w-4 h-4" />
                  <span>Mark Completed</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={booking.status === "cancelled" || isUpdatingStatus}
                  onClick={() => setConfirmCancelOpen(true)}
                  className="rounded-xl text-xs h-9 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Cancel Booking</span>
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs h-9 w-full sm:w-auto"
            >
              Close Manifest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancellation Confirmation Dialog */}
      <ConfirmDialog
        open={confirmCancelOpen}
        onOpenChange={setConfirmCancelOpen}
        title="Cancel Guest Booking?"
        description={
          <span>
            Are you sure you want to cancel booking <strong>{booking.booking_reference}</strong>?
            This will immediately release <strong>{booking.travelers_count} seat(s)</strong> back
            to the departure calendar inventory.
          </span>
        }
        confirmLabel="Cancel Booking & Release Seats"
        variant="destructive"
        isLoading={isUpdatingStatus}
        onConfirm={() => handleStatusChange("cancelled")}
      />
    </>
  )
}
