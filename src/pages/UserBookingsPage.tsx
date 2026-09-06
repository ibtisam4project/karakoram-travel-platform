import React, { useEffect, useState } from "react"
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Loader2,
  FileText,
  MessageSquare,
  ShieldAlert,
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/context/AuthContext"
import { Booking } from "@/types/database"
import { formatPKR } from "@/lib/utils"
import { ReviewModal } from "@/components/booking/ReviewModal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export function UserBookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Cancellation modal state
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null)
  const [isCancelling, setIsCancelling] = useState<boolean>(false)

  // Review modal state
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null)

  const loadBookings = async () => {
    if (!user) return
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          tour:tours(*),
          availability:tour_availability(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      if (data) setBookings(data as unknown as Booking[])
    } catch (err) {
      console.error("Error loading bookings:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [user])

  // Real Cancellation with Seat Restoration
  const handleConfirmCancellation = async () => {
    if (!cancelTarget) return

    try {
      setIsCancelling(true)

      // 1. Update booking status to 'cancelled'
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", cancelTarget.id)

      if (bookingError) throw bookingError

      // 2. Restore seats on tour_availability
      if (cancelTarget.availability_id) {
        const { data: currentAvail } = await supabase
          .from("tour_availability")
          .select("seats_booked, seats_total")
          .eq("id", cancelTarget.availability_id)
          .single()

        if (currentAvail) {
          const newSeatsBooked = Math.max(0, currentAvail.seats_booked - cancelTarget.travelers_count)
          await supabase
            .from("tour_availability")
            .update({
              seats_booked: newSeatsBooked,
              status: "open", // Seat liberated, so departure becomes open
            })
            .eq("id", cancelTarget.availability_id)
        }
      }

      toast.success("Booking Cancelled", {
        description: `Reference ${cancelTarget.booking_reference} has been cancelled. Your ${cancelTarget.travelers_count} seat(s) have been returned to inventory.`,
      })

      setCancelTarget(null)
      loadBookings()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cancellation failed"
      toast.error("Cancellation notice", { description: msg })
    } finally {
      setIsCancelling(false)
    }
  }

  const filteredBookings =
    filterStatus === "all"
      ? bookings
      : bookings.filter((b) => b.status === filterStatus)

  return (
    <div className="space-y-6">
      {/* Header & Status Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Expedition Bookings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your reservations, view contact information snapshots, and download manifests.
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {["all", "confirmed", "pending", "completed", "cancelled"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilterStatus(status)}
              className={`text-xs capitalize font-medium px-3.5 py-1.5 rounded-full border transition-colors shrink-0 ${
                filterStatus === status
                  ? "bg-editorial-navy text-white border-editorial-navy dark:bg-editorial-terracotta dark:border-editorial-terracotta font-semibold"
                  : "bg-card border-border hover:bg-muted"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List Table/Cards */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-border bg-card/60 space-y-3">
          <FileText className="w-10 h-10 text-muted-foreground mx-auto stroke-[1.2]" />
          <h4 className="font-serif font-bold text-lg text-foreground">No bookings found</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {filterStatus === "all"
              ? "You haven't reserved any expeditions yet."
              : `No bookings matching "${filterStatus}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const isExpanded = expandedBookingId === b.id
            const canCancel = b.status === "confirmed" || b.status === "pending"
            const isCompleted = b.status === "completed"

            return (
              <div
                key={b.id}
                className="rounded-3xl border border-border bg-card shadow-subtle hover:shadow-card transition-all overflow-hidden"
              >
                {/* Main Card Summary Bar */}
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-muted px-2.5 py-0.5 rounded-md text-foreground">
                        {b.booking_reference}
                      </span>
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
                        className="text-[10px] capitalize font-semibold"
                      >
                        {b.status}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground hidden sm:inline">
                        Booked on {new Date(b.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-serif text-xl font-bold text-foreground">
                      {b.tour?.title || "Expedition Package"}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-0.5">
                      {b.availability?.departure_date && (
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <Calendar className="w-3.5 h-3.5 text-editorial-terracotta" />
                          {new Date(b.availability.departure_date).toLocaleDateString("en-PK", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      )}
                      <span>{b.travelers_count} Traveler(s)</span>
                      <span>Total: <strong className="text-editorial-terracotta">{formatPKR(b.total_price)}</strong></span>
                    </div>
                  </div>

                  {/* Actions & Expand Chevron */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* Review Action for Completed Trips */}
                    {isCompleted && (
                      <Button
                        size="sm"
                        variant="editorial"
                        onClick={() => setReviewTarget(b)}
                        className="rounded-xl text-xs gap-1.5 h-9"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Leave Review</span>
                      </Button>
                    )}

                    {/* Cancel Action */}
                    {canCancel && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCancelTarget(b)}
                        className="rounded-xl text-xs text-destructive hover:bg-destructive/10 border-destructive/30 h-9"
                      >
                        Cancel Booking
                      </Button>
                    )}

                    {/* Accordion Expand/Collapse */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedBookingId(isExpanded ? null : b.id)}
                      className="rounded-xl text-xs gap-1 h-9 px-3"
                    >
                      <span>{isExpanded ? "Hide Details" : "View Details"}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expandable Booking Details & Manifest Snapshot */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-border/60 bg-muted/25 space-y-4 text-xs animate-in fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      {/* Contact & Traveler Info Submitted */}
                      <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                        <h5 className="font-serif font-bold text-sm text-foreground">
                          Traveler Manifest Details
                        </h5>
                        <div className="space-y-1 text-muted-foreground">
                          <p><strong>Lead Traveler:</strong> {b.contact_info?.fullName || "N/A"}</p>
                          <p><strong>Email:</strong> {b.contact_info?.email || "N/A"}</p>
                          <p><strong>Pakistani Phone:</strong> {b.contact_info?.phone || "N/A"}</p>
                          {b.contact_info?.cnic && (
                            <p><strong>CNIC:</strong> {b.contact_info.cnic}</p>
                          )}
                          {b.contact_info?.specialRequests && (
                            <p><strong>Preferences:</strong> {b.contact_info.specialRequests}</p>
                          )}
                        </div>
                      </div>

                      {/* Logistical Snapshot */}
                      <div className="p-4 rounded-2xl bg-card border border-border space-y-2">
                        <h5 className="font-serif font-bold text-sm text-foreground">
                          Logistics &amp; Transport
                        </h5>
                        <div className="space-y-1 text-muted-foreground">
                          <p><strong>Pickup / Dispatch Desk:</strong> Islamabad Headquarters (F-7 Markaz)</p>
                          <p><strong>Transport:</strong> Dedicated Luxury AC Coaster / Private 4x4 Prado</p>
                          <p><strong>Expedition Duration:</strong> {b.tour?.duration_days} Days</p>
                          <p><strong>Seat Count:</strong> {b.travelers_count} confirmed seats</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Cancellation Confirmation Dialog */}
      <Dialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-background">
          <DialogHeader className="space-y-2 text-left">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <DialogTitle className="font-serif text-xl font-bold">
              Cancel Expedition Reservation?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you wish to cancel booking <strong>{cancelTarget?.booking_reference}</strong> for <strong>{cancelTarget?.tour?.title}</strong>? Your {cancelTarget?.travelers_count} reserved seats will be automatically restored to the public departure inventory.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-row justify-end gap-2 pt-3">
            <Button
              variant="ghost"
              size="sm"
              disabled={isCancelling}
              onClick={() => setCancelTarget(null)}
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isCancelling}
              onClick={handleConfirmCancellation}
              className="gap-1.5"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Restoring Seats...</span>
                </>
              ) : (
                <span>Confirm Cancellation</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      {reviewTarget && (
        <ReviewModal
          isOpen={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          booking={reviewTarget}
          onReviewSubmitted={() => {
            loadBookings()
          }}
        />
      )}
    </div>
  )
}
