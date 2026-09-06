import React, { useState, useEffect } from "react"
import {
  User,
  Shield,
  ShieldAlert,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  CheckCircle2,
  FileText,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import { Profile, Booking } from "@/types/database"
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

interface CustomerDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: Profile | null
  onRoleChanged: (updatedProfile: Profile) => void
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  open,
  onOpenChange,
  profile,
  onRoleChanged,
}) => {
  const [customerBookings, setCustomerBookings] = useState<Booking[]>([])
  const [isLoadingBookings, setIsLoadingBookings] = useState(false)
  const [showRoleConfirm, setShowRoleConfirm] = useState(false)
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)

  useEffect(() => {
    if (open && profile?.id) {
      loadCustomerBookings(profile.id)
    }
  }, [open, profile])

  const loadCustomerBookings = async (userId: string) => {
    try {
      setIsLoadingBookings(true)
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          tour:tours(id, title, category, slug),
          availability:tour_availability(departure_date)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setCustomerBookings((data as Booking[]) || [])
    } catch (err: any) {
      console.error("Error loading customer bookings:", err)
    } finally {
      setIsLoadingBookings(false)
    }
  }

  if (!profile) return null

  // Calculate total lifetime spend in PKR from confirmed/completed
  const lifetimeSpend = customerBookings
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .reduce((sum, b) => sum + (Number(b.total_price) || 0), 0)

  const formatPKR = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleToggleRole = async () => {
    const nextRole = profile.role === "admin" ? "user" : "admin"
    try {
      setIsUpdatingRole(true)
      const { data, error } = await supabase
        .from("profiles")
        .update({ role: nextRole })
        .eq("id", profile.id)
        .select()
        .single()

      if (error) throw error

      toast.success(
        `Role for ${profile.full_name || "User"} updated to ${nextRole.toUpperCase()}`
      )
      onRoleChanged(data as Profile)
      setShowRoleConfirm(false)
    } catch (err: any) {
      console.error("Error changing user role:", err)
      toast.error(err.message || "Failed to update user role")
    } finally {
      setIsUpdatingRole(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl rounded-3xl p-6 sm:p-8 max-h-[88vh] overflow-y-auto">
          <DialogHeader className="space-y-3 border-b border-border/70 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-editorial-navy text-white flex items-center justify-center font-serif text-lg font-bold">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || "Customer"}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    (profile.full_name || "G")[0].toUpperCase()
                  )}
                </div>
                <div>
                  <DialogTitle className="font-serif text-xl sm:text-2xl font-bold text-foreground">
                    {profile.full_name || "Traveler Account"}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground font-mono">
                    ID: {profile.id.slice(0, 12)}...
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={profile.role === "admin" ? "terracotta" : "outline"}
                  className="text-xs font-mono uppercase font-bold py-1 px-3"
                >
                  {profile.role === "admin" ? "Staff Administrator" : "Traveler"}
                </Badge>
              </div>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Member since {new Date(profile.created_at).toLocaleDateString("en-PK", { month: "long", year: "numeric" })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* Overview Stats: Spend & Booking count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl border border-border bg-card space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <CreditCard className="w-4 h-4 text-editorial-terracotta" />
                  <span className="font-mono uppercase text-[10px]">Lifetime Spend (PKR)</span>
                </div>
                <div className="font-serif font-bold text-xl sm:text-2xl text-editorial-navy dark:text-editorial-sand">
                  {formatPKR(lifetimeSpend)}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Computed from confirmed and completed reservations.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-border bg-card space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <FileText className="w-4 h-4 text-editorial-navy dark:text-editorial-sand" />
                  <span className="font-mono uppercase text-[10px]">Total Bookings</span>
                </div>
                <div className="font-serif font-bold text-xl sm:text-2xl text-foreground">
                  {customerBookings.length} Trips
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Phone: <span className="font-mono text-foreground">{profile.phone || "Not provided"}</span>
                </p>
              </div>
            </div>

            {/* Booking History Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Reservation History ({customerBookings.length})
                </h4>
              </div>

              {isLoadingBookings ? (
                <div className="py-6 text-center text-xs text-muted-foreground animate-pulse">
                  Loading customer booking records...
                </div>
              ) : customerBookings.length === 0 ? (
                <div className="p-6 text-center border border-dashed rounded-2xl text-xs text-muted-foreground font-serif">
                  No expeditions booked under this profile yet.
                </div>
              ) : (
                <div className="border border-border rounded-xl divide-y divide-border/60 overflow-hidden text-xs">
                  {customerBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-muted/20 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-editorial-navy dark:text-editorial-sand">
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
                            className="text-[9px] uppercase font-bold"
                          >
                            {b.status}
                          </Badge>
                        </div>
                        <span className="font-serif font-medium text-foreground block">
                          {(Array.isArray(b.tour) ? b.tour[0]?.title : b.tour?.title) || "Expedition"}
                        </span>
                      </div>

                      <div className="text-right sm:self-center">
                        <span className="font-serif font-bold text-editorial-terracotta block">
                          {formatPKR(b.total_price)}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(b.created_at).toLocaleDateString("en-PK", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Role Management Box */}
            <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    Security Role &amp; Clearance
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Current status: <strong>{profile.role.toUpperCase()}</strong>
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRoleConfirm(true)}
                  className={`rounded-xl text-xs h-9 gap-1.5 ${
                    profile.role === "admin"
                      ? "border-destructive/40 text-destructive hover:bg-destructive/10"
                      : "border-editorial-terracotta/50 text-editorial-terracotta hover:bg-editorial-terracotta/10"
                  }`}
                >
                  {profile.role === "admin" ? (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Demote to Traveler</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-3.5 h-3.5" />
                      <span>Promote to Admin</span>
                    </>
                  )}
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
              Close Dossier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Promotion/Demotion Confirmation Dialog */}
      <ConfirmDialog
        open={showRoleConfirm}
        onOpenChange={setShowRoleConfirm}
        title={
          profile.role === "admin"
            ? "Revoke Administrator Clearance?"
            : "Grant Administrator Clearance?"
        }
        description={
          profile.role === "admin" ? (
            <span>
              Are you sure you want to demote <strong>{profile.full_name || "this user"}</strong> to
              a standard <strong>Traveler</strong> account? They will immediately lose access to
              all operational manifests, financial summaries, and inventory editing tools.
            </span>
          ) : (
            <span>
              Are you sure you want to elevate <strong>{profile.full_name || "this user"}</strong> to
              an <strong>Administrator</strong>? They will gain full permissions to create tours,
              manage bookings, alter guest records, and moderate platform content.
            </span>
          )
        }
        confirmLabel={
          profile.role === "admin" ? "Demote to Traveler" : "Elevate to Admin"
        }
        variant={profile.role === "admin" ? "destructive" : "default"}
        isLoading={isUpdatingRole}
        onConfirm={handleToggleRole}
      />
    </>
  )
}
