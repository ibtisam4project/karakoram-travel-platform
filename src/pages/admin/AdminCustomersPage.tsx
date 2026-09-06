import React, { useState, useEffect } from "react"
import {
  Users,
  Eye,
  Shield,
  ShieldAlert,
  Calendar,
  Phone,
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import { Profile } from "@/types/database"
import { DataTable, ColumnDef, RowAction } from "@/components/admin/DataTable"
import { CustomerDetailModal } from "@/components/admin/customers/CustomerDetailModal"
import { ConfirmDialog } from "@/components/admin/ConfirmDialog"
import { Badge } from "@/components/ui/badge"

export function AdminCustomersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Selected customer for detail dossier
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Role toggle confirmation
  const [roleChangeTarget, setRoleChangeTarget] = useState<Profile | null>(null)
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)

  // Load all profiles
  const loadProfiles = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setProfiles((data as Profile[]) || [])
    } catch (err: any) {
      console.error("Error loading customer profiles:", err)
      toast.error("Failed to load customer profiles")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProfiles()
  }, [])

  // Execute confirmed role change
  const handleConfirmRoleChange = async () => {
    if (!roleChangeTarget) return
    const nextRole = roleChangeTarget.role === "admin" ? "user" : "admin"

    try {
      setIsUpdatingRole(true)
      const { error } = await supabase
        .from("profiles")
        .update({ role: nextRole })
        .eq("id", roleChangeTarget.id)

      if (error) throw error

      toast.success(
        `Role for ${roleChangeTarget.full_name || "User"} updated to ${nextRole.toUpperCase()}`
      )
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === roleChangeTarget.id ? { ...p, role: nextRole } : p
        )
      )
      setRoleChangeTarget(null)
    } catch (err: any) {
      console.error("Error changing role:", err)
      toast.error(err.message || "Failed to update role")
    } finally {
      setIsUpdatingRole(false)
    }
  }

  // Columns definition
  const columns: ColumnDef<Profile>[] = [
    {
      id: "customer_name",
      header: "Traveler / Account",
      className: "min-w-[220px]",
      cell: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-editorial-navy text-white flex items-center justify-center font-serif text-sm font-bold shrink-0">
            {p.avatar_url ? (
              <img
                src={p.avatar_url}
                alt={p.full_name || "User"}
                className="w-full h-full object-cover rounded-xl"
                loading="lazy"
              />
            ) : (
              (p.full_name || "T")[0].toUpperCase()
            )}
          </div>
          <div>
            <button
              onClick={() => {
                setSelectedProfile(p)
                setShowDetailModal(true)
              }}
              className="font-serif font-bold text-xs text-foreground hover:underline block text-left"
            >
              {p.full_name || "Unnamed Traveler"}
            </button>
            <span className="text-[10px] text-muted-foreground font-mono">
              ID: {p.id.slice(0, 8)}...
            </span>
          </div>
        </div>
      ),
    },
    {
      header: "Contact Phone",
      accessorKey: "phone",
      cell: (p) => (
        <span className="text-xs font-mono text-muted-foreground">
          {p.phone || "Not recorded"}
        </span>
      ),
    },
    {
      header: "Role",
      accessorKey: "role",
      sortable: true,
      cell: (p) => (
        <Badge
          variant={p.role === "admin" ? "terracotta" : "outline"}
          className="text-[10px] uppercase font-mono font-bold tracking-wider"
        >
          {p.role === "admin" ? "Administrator" : "Traveler"}
        </Badge>
      ),
    },
    {
      header: "Member Since",
      accessorKey: "created_at",
      sortable: true,
      cell: (p) => (
        <span className="text-xs text-muted-foreground font-mono">
          {new Date(p.created_at).toLocaleDateString("en-PK", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
  ]

  // Row actions
  const rowActions: RowAction<Profile>[] = [
    {
      label: "View Dossier & Spend",
      icon: <Eye className="w-3.5 h-3.5 text-editorial-navy dark:text-editorial-sand" />,
      onClick: (p) => {
        setSelectedProfile(p)
        setShowDetailModal(true)
      },
    },
    {
      label: "Promote / Demote Role",
      icon: <Shield className="w-3.5 h-3.5 text-editorial-terracotta" />,
      onClick: (p) => {
        setRoleChangeTarget(p)
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-editorial-terracotta">
          Customer &amp; Access Directory
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
          Guest Profiles ({profiles.length})
        </h1>
        <p className="text-xs text-muted-foreground">
          Review customer travel records, lifetime spend in PKR, and administer team permissions.
        </p>
      </div>

      {/* Main DataTable */}
      <DataTable
        data={profiles}
        columns={columns}
        rowActions={rowActions}
        isLoading={isLoading}
        searchKey={(p) => `${p.full_name || ""} ${p.phone || ""} ${p.role || ""}`}
        searchPlaceholder="Search by name, phone, or clearance role..."
        filters={[
          {
            label: "Role",
            key: "role",
            options: [
              { label: "Administrators", value: "admin" },
              { label: "Travelers", value: "user" },
            ],
          },
        ]}
        emptyMessage="No guest accounts found."
      />

      {/* Customer Detail Dossier Modal */}
      <CustomerDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        profile={selectedProfile}
        onRoleChanged={(updatedProfile) => {
          setProfiles((prev) =>
            prev.map((p) => (p.id === updatedProfile.id ? updatedProfile : p))
          )
          setSelectedProfile(updatedProfile)
        }}
      />

      {/* Role Change Confirmation Dialog */}
      <ConfirmDialog
        open={!!roleChangeTarget}
        onOpenChange={(open) => !open && setRoleChangeTarget(null)}
        title={
          roleChangeTarget?.role === "admin"
            ? "Revoke Administrator Clearance?"
            : "Grant Administrator Clearance?"
        }
        description={
          roleChangeTarget?.role === "admin" ? (
            <span>
              Are you sure you want to demote{" "}
              <strong>{roleChangeTarget.full_name || "this user"}</strong> to a{" "}
              <strong>Traveler</strong>? They will immediately lose access to all admin operations.
            </span>
          ) : (
            <span>
              Are you sure you want to elevate{" "}
              <strong>{roleChangeTarget?.full_name || "this user"}</strong> to an{" "}
              <strong>Administrator</strong>? They will receive full operational access to the staff portal.
            </span>
          )
        }
        confirmLabel={
          roleChangeTarget?.role === "admin" ? "Demote to Traveler" : "Elevate to Admin"
        }
        variant={roleChangeTarget?.role === "admin" ? "destructive" : "default"}
        isLoading={isUpdatingRole}
        onConfirm={handleConfirmRoleChange}
      />
    </div>
  )
}
