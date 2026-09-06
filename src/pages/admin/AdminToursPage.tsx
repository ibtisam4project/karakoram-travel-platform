import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  Compass,
  Plus,
  Edit2,
  Calendar,
  ExternalLink,
  Trash2,
  Star,
  Eye,
  EyeOff,
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import { Tour } from "@/types/database"
import { DataTable, ColumnDef, RowAction } from "@/components/admin/DataTable"
import { ConfirmDialog } from "@/components/admin/ConfirmDialog"
import { TourFormModal } from "@/components/admin/tours/TourFormModal"
import { ManageDeparturesModal } from "@/components/admin/tours/ManageDeparturesModal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

export function AdminToursPage() {
  const [tours, setTours] = useState<Tour[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false)
  const [tourToEdit, setTourToEdit] = useState<Tour | null>(null)

  const [showDeparturesModal, setShowDeparturesModal] = useState(false)
  const [tourForDepartures, setTourForDepartures] = useState<Tour | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<Tour | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch all tours including inactive ones
  const loadTours = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("tours")
        .select(`
          *,
          destination:destinations(*)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setTours((data as Tour[]) || [])
    } catch (err: any) {
      console.error("Error loading tours:", err)
      toast.error("Failed to load expeditions from database")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTours()
  }, [])

  // Toggle is_active directly from table
  const handleToggleActive = async (tour: Tour) => {
    const nextStatus = !tour.is_active
    // Optimistic update
    setTours((prev) =>
      prev.map((t) => (t.id === tour.id ? { ...t, is_active: nextStatus } : t))
    )

    try {
      const { error } = await supabase
        .from("tours")
        .update({ is_active: nextStatus })
        .eq("id", tour.id)

      if (error) {
        // Revert optimistic update
        setTours((prev) =>
          prev.map((t) => (t.id === tour.id ? { ...t, is_active: !nextStatus } : t))
        )
        throw error
      }

      toast.success(
        `"${tour.title}" is now ${nextStatus ? "active & bookable" : "hidden from site"}`
      )
    } catch (err: any) {
      console.error("Error updating tour status:", err)
      toast.error(err.message || "Failed to update tour status")
    }
  }

  // Delete tour handler
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      setIsDeleting(true)
      const { error } = await supabase.from("tours").delete().eq("id", deleteTarget.id)

      if (error) throw error

      toast.success(`Expedition "${deleteTarget.title}" deleted`)
      setTours((prev) => prev.filter((t) => t.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err: any) {
      console.error("Error deleting tour:", err)
      toast.error(err.message || "Failed to delete tour")
    } finally {
      setIsDeleting(false)
    }
  }

  // Currency Formatter
  const formatPKR = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Columns definition
  const columns: ColumnDef<Tour>[] = [
    {
      id: "tour_info",
      header: "Expedition",
      className: "min-w-[260px]",
      cell: (t) => (
        <div className="flex items-center gap-3">
          <div className="w-14 h-12 rounded-xl overflow-hidden bg-muted border border-border shrink-0">
            {t.images && t.images.length > 0 ? (
              <img
                src={t.images[0]}
                alt={t.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Compass className="w-4 h-4" />
              </div>
            )}
          </div>
          <div className="space-y-0.5 max-w-[200px] sm:max-w-[280px]">
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-xs text-foreground truncate block">
                {t.title}
              </span>
              {t.is_featured && (
                <span title="Featured Expedition">
                  <Star className="w-3 h-3 fill-editorial-gold text-editorial-gold shrink-0" />
                </span>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono truncate">
              <span>{t.destination?.name || "Pakistan"}</span>
              <span>•</span>
              <span className="truncate">/{t.slug}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Category",
      accessorKey: "category",
      sortable: true,
      cell: (t) => (
        <Badge variant="outline" className="text-[10px] font-sans">
          {t.category}
        </Badge>
      ),
    },
    {
      header: "Duration",
      accessorKey: "duration_days",
      sortable: true,
      cell: (t) => (
        <div className="text-xs">
          <span className="font-bold">{t.duration_days}</span> Days
          <span className="block text-[10px] text-muted-foreground">
            Max {t.group_size_max || 12} pax
          </span>
        </div>
      ),
    },
    {
      header: "Price (PKR)",
      accessorKey: "price",
      sortable: true,
      cell: (t) => (
        <div>
          <span className="font-serif font-bold text-xs text-editorial-navy dark:text-editorial-sand block">
            {formatPKR(t.price)}
          </span>
          {t.discount_price && (
            <span className="text-[10px] line-through text-muted-foreground">
              {formatPKR(t.discount_price)}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Public Status",
      accessorKey: "is_active",
      sortable: true,
      cell: (t) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={t.is_active}
            onCheckedChange={() => handleToggleActive(t)}
            title={t.is_active ? "Visible on site" : "Hidden from site"}
          />
          <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
            {t.is_active ? "Active" : "Draft"}
          </span>
        </div>
      ),
    },
  ]

  // Row Actions
  const rowActions: RowAction<Tour>[] = [
    {
      label: "Edit Expedition",
      icon: <Edit2 className="w-3.5 h-3.5 text-editorial-navy dark:text-editorial-sand" />,
      onClick: (t) => {
        setTourToEdit(t)
        setShowFormModal(true)
      },
    },
    {
      label: "Manage Departures",
      icon: <Calendar className="w-3.5 h-3.5 text-editorial-terracotta" />,
      onClick: (t) => {
        setTourForDepartures(t)
        setShowDeparturesModal(true)
      },
    },
    {
      label: "View Live on Site",
      icon: <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />,
      onClick: (t) => {
        window.open(`/tours/${t.slug}`, "_blank")
      },
    },
    {
      label: "Delete Expedition",
      icon: <Trash2 className="w-3.5 h-3.5 text-destructive" />,
      variant: "destructive",
      separatorBefore: true,
      onClick: (t) => {
        setDeleteTarget(t)
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header with Title & "+ New Expedition" button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-editorial-terracotta">
            Inventory &amp; Operations
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
            Expedition Packages ({tours.length})
          </h1>
          <p className="text-xs text-muted-foreground">
            Create, edit, schedule departure windows, and publish signature journeys across Pakistan.
          </p>
        </div>

        <Button
          onClick={() => {
            setTourToEdit(null)
            setShowFormModal(true)
          }}
          className="rounded-xl text-xs h-10 gap-2 bg-editorial-navy hover:bg-editorial-navy/90 text-white dark:bg-editorial-sand dark:text-editorial-navy font-serif font-bold shadow-subtle"
        >
          <Plus className="w-4 h-4" />
          <span>New Expedition</span>
        </Button>
      </div>

      {/* Main DataTable */}
      <DataTable
        data={tours}
        columns={columns}
        rowActions={rowActions}
        isLoading={isLoading}
        searchKey={(t) => `${t.title} ${t.slug} ${t.destination?.name || ""}`}
        searchPlaceholder="Search by expedition title, destination, slug..."
        filters={[
          {
            label: "Category",
            key: "category",
            options: [
              { label: "Northern Areas", value: "Northern Areas" },
              { label: "Treks & Mountaineering", value: "Treks & Mountaineering" },
              { label: "Cultural & Heritage", value: "Cultural & Heritage" },
              { label: "International & Umrah", value: "International & Umrah" },
              { label: "Honeymoon & Luxury", value: "Honeymoon & Luxury" },
              { label: "Family Expeditions", value: "Family Expeditions" },
            ],
          },
        ]}
        emptyMessage="No expedition packages logged yet."
      />

      {/* Tour Create/Edit Modal */}
      <TourFormModal
        open={showFormModal}
        onOpenChange={setShowFormModal}
        tourToEdit={tourToEdit}
        onTourSaved={(savedTour) => {
          setTours((prev) => {
            const exists = prev.some((t) => t.id === savedTour.id)
            if (exists) {
              return prev.map((t) => (t.id === savedTour.id ? savedTour : t))
            }
            return [savedTour, ...prev]
          })
        }}
      />

      {/* Tour Departures Calendar Modal */}
      <ManageDeparturesModal
        open={showDeparturesModal}
        onOpenChange={setShowDeparturesModal}
        tour={tourForDepartures}
        onDeparturesUpdated={loadTours}
      />

      {/* Delete Tour Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Expedition Package?"
        description={
          deleteTarget ? (
            <span>
              Are you sure you want to permanently delete{" "}
              <strong>"{deleteTarget.title}"</strong>? All associated departure dates and
              guest bookings will also be deleted. This cannot be undone.
            </span>
          ) : (
            ""
          )
        }
        confirmLabel="Delete Expedition"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
