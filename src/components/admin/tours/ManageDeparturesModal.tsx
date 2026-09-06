import React, { useState, useEffect } from "react"
import { Calendar, Plus, Trash2, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import { Tour, TourAvailability } from "@/types/database"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/admin/ConfirmDialog"

interface ManageDeparturesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tour: Tour | null
  onDeparturesUpdated?: () => void
}

export const ManageDeparturesModal: React.FC<ManageDeparturesModalProps> = ({
  open,
  onOpenChange,
  tour,
  onDeparturesUpdated,
}) => {
  const [departures, setDepartures] = useState<TourAvailability[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // New departure state
  const [newDate, setNewDate] = useState("")
  const [newSeats, setNewSeats] = useState<number>(tour?.group_size_max || 12)

  // Deletion state
  const [deleteTarget, setDeleteTarget] = useState<TourAvailability | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (open && tour?.id) {
      loadDepartures()
      if (tour.group_size_max) {
        setNewSeats(tour.group_size_max)
      }

      // Supabase Realtime channel for live departure seat updates
      const channel = supabase
        .channel(`manage-departures-${tour.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tour_availability",
            filter: `tour_id=eq.${tour.id}`,
          },
          (payload) => {
            if (payload.eventType === "UPDATE") {
              const updated = payload.new as TourAvailability
              setDepartures((prev) =>
                prev.map((d) => (d.id === updated.id ? updated : d))
              )
            } else if (payload.eventType === "INSERT") {
              const inserted = payload.new as TourAvailability
              setDepartures((prev) => {
                const exists = prev.some((d) => d.id === inserted.id)
                if (exists) return prev
                return [...prev, inserted].sort(
                  (a, b) =>
                    new Date(a.departure_date).getTime() -
                    new Date(b.departure_date).getTime()
                )
              })
            } else if (payload.eventType === "DELETE") {
              const deletedId = (payload.old as any).id
              setDepartures((prev) => prev.filter((d) => d.id !== deletedId))
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [open, tour])

  const loadDepartures = async () => {
    if (!tour?.id) return
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("tour_availability")
        .select("*")
        .eq("tour_id", tour.id)
        .order("departure_date", { ascending: true })

      if (error) throw error
      setDepartures((data as TourAvailability[]) || [])
    } catch (err: any) {
      console.error("Error loading departures:", err)
      toast.error("Failed to load tour departure dates")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddDeparture = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tour?.id || !newDate) {
      toast.error("Please pick a departure date")
      return
    }

    try {
      setIsSubmitting(true)
      const { data, error } = await supabase
        .from("tour_availability")
        .insert({
          tour_id: tour.id,
          departure_date: newDate,
          seats_total: Number(newSeats) || 12,
          seats_booked: 0,
          status: "open",
        })
        .select()
        .single()

      if (error) throw error

      toast.success("Departure date added successfully!")
      setDepartures((prev) => [...prev, data as TourAvailability])
      setNewDate("")
      onDeparturesUpdated?.()
    } catch (err: any) {
      console.error("Error adding departure:", err)
      toast.error(err.message || "Failed to add departure date")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (dep: TourAvailability) => {
    const nextStatus = dep.status === "open" ? "closed" : "open"
    try {
      const { error } = await supabase
        .from("tour_availability")
        .update({ status: nextStatus })
        .eq("id", dep.id)

      if (error) throw error

      setDepartures((prev) =>
        prev.map((d) => (d.id === dep.id ? { ...d, status: nextStatus } : d))
      )
      toast.success(`Departure marked as ${nextStatus}`)
      onDeparturesUpdated?.()
    } catch (err: any) {
      console.error("Error updating status:", err)
      toast.error("Failed to update status")
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      setIsDeleting(true)
      const { error } = await supabase
        .from("tour_availability")
        .delete()
        .eq("id", deleteTarget.id)

      if (error) throw error

      toast.success("Departure date removed")
      setDepartures((prev) => prev.filter((d) => d.id !== deleteTarget.id))
      setDeleteTarget(null)
      onDeparturesUpdated?.()
    } catch (err: any) {
      console.error("Error deleting departure:", err)
      toast.error(err.message || "Failed to delete departure date")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl rounded-2xl p-6 sm:p-7 max-h-[85vh] overflow-y-auto">
          <DialogHeader className="space-y-1.5 border-b border-border/80 pb-4">
            <div className="flex items-center gap-2 text-editorial-terracotta">
              <Calendar className="w-5 h-5" />
              <DialogTitle className="font-serif text-xl font-bold text-foreground">
                Manage Departures &amp; Capacity
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              {tour ? (
                <span>
                  Expedition: <strong className="text-foreground font-serif">{tour.title}</strong>
                </span>
              ) : (
                "Manage departure calendar and seat availability."
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Add New Departure Date Form */}
          <form
            onSubmit={handleAddDeparture}
            className="p-4 rounded-2xl bg-muted/30 border border-border space-y-3 mt-2"
          >
            <h4 className="text-xs font-bold uppercase tracking-wider text-editorial-navy dark:text-editorial-sand">
              Add New Departure Window
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold">Departure Date *</Label>
                <Input
                  type="date"
                  value={newDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="text-xs rounded-xl h-9"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold">Total Seats *</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={newSeats}
                  onChange={(e) => setNewSeats(Number(e.target.value))}
                  className="text-xs rounded-xl h-9"
                  required
                />
              </div>

              <div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="w-full h-9 rounded-xl text-xs gap-1.5 bg-editorial-terracotta hover:bg-editorial-terracotta/90 text-white"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Add Departure</span>
                </Button>
              </div>
            </div>
          </form>

          {/* Existing Departures List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Scheduled Departures ({departures.length})
              </h4>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                Loading departure dates...
              </div>
            ) : departures.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-2xl text-xs text-muted-foreground font-serif">
                No departure dates scheduled for this expedition yet. Add one above!
              </div>
            ) : (
              <div className="border border-border rounded-xl divide-y divide-border/60 overflow-hidden">
                {departures.map((dep) => {
                  const remaining = dep.seats_total - dep.seats_booked
                  const isFull = dep.seats_booked >= dep.seats_total
                  return (
                    <div
                      key={dep.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-sm text-foreground">
                            {new Date(dep.departure_date).toLocaleDateString("en-PK", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <Badge
                            variant={
                              dep.status === "closed"
                                ? "outline"
                                : isFull
                                ? "destructive"
                                : "sand"
                            }
                            className="text-[10px] uppercase font-bold"
                          >
                            {dep.status === "closed" ? "Closed" : isFull ? "Full" : "Open"}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-3">
                          <span>
                            Booked: <strong>{dep.seats_booked}</strong> / {dep.seats_total} seats
                          </span>
                          <span>•</span>
                          <span
                            className={
                              remaining <= 3 && remaining > 0
                                ? "text-amber-600 font-bold"
                                : ""
                            }
                          >
                            Available: <strong>{remaining}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(dep)}
                          className="h-8 text-xs rounded-xl gap-1"
                        >
                          {dep.status === "open" ? (
                            <>
                              <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>Close</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-editorial-navy dark:text-editorial-sand" />
                              <span>Open</span>
                            </>
                          )}
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={dep.seats_booked > 0}
                          title={
                            dep.seats_booked > 0
                              ? "Cannot delete departure with active bookings"
                              : "Delete departure date"
                          }
                          onClick={() => setDeleteTarget(dep)}
                          className="h-8 w-8 p-0 rounded-xl text-destructive hover:bg-destructive/10 disabled:opacity-30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs h-9 w-full sm:w-auto"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Deleting Departure */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remove Departure Date?"
        description={
          deleteTarget ? (
            <span>
              Are you sure you want to remove the departure on{" "}
              <strong>
                {new Date(deleteTarget.departure_date).toLocaleDateString("en-PK", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </strong>
              ? This action cannot be undone.
            </span>
          ) : (
            ""
          )
        }
        confirmLabel="Remove Departure"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
