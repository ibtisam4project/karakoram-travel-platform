import React, { useState, useEffect } from "react"
import {
  Star,
  Trash2,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Calendar,
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import { Review } from "@/types/database"
import { DataTable, ColumnDef, RowAction } from "@/components/admin/DataTable"
import { ConfirmDialog } from "@/components/admin/ConfirmDialog"
import { Badge } from "@/components/ui/badge"

export function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Delete target state
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load all reviews
  const loadReviews = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          profile:profiles(id, full_name, avatar_url),
          tour:tours(id, title, slug)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setReviews((data as Review[]) || [])
    } catch (err: any) {
      console.error("Error loading reviews:", err)
      toast.error("Failed to load reviews from database")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [])

  // Confirm delete review
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      setIsDeleting(true)
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", deleteTarget.id)

      if (error) throw error

      toast.success("Review deleted successfully")
      setReviews((prev) => prev.filter((r) => r.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err: any) {
      console.error("Error deleting review:", err)
      toast.error(err.message || "Failed to delete review")
    } finally {
      setIsDeleting(false)
    }
  }

  // Columns definition
  const columns: ColumnDef<Review>[] = [
    {
      id: "reviewer",
      header: "Guest Reviewer",
      className: "min-w-[180px]",
      cell: (r) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-editorial-navy text-white flex items-center justify-center font-serif text-xs font-bold shrink-0">
            {r.profile?.avatar_url ? (
              <img
                src={r.profile.avatar_url}
                alt={r.profile.full_name || "Reviewer"}
                className="w-full h-full object-cover rounded-full"
                loading="lazy"
              />
            ) : (
              (r.profile?.full_name || "G")[0].toUpperCase()
            )}
          </div>
          <div>
            <span className="font-serif font-bold text-xs text-foreground block">
              {r.profile?.full_name || "Verified Traveler"}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {new Date(r.created_at).toLocaleDateString("en-PK", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "tour_title",
      header: "Expedition",
      className: "min-w-[190px]",
      cell: (r) => (
        <div className="max-w-[200px]">
          <span className="font-serif font-bold text-xs text-foreground truncate block">
            {(Array.isArray(r.tour) ? r.tour[0]?.title : r.tour?.title) || "Expedition Package"}
          </span>
          {r.tour?.slug && (
            <a
              href={`/tours/${r.tour.slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-editorial-terracotta hover:underline inline-flex items-center gap-0.5"
            >
              <span>View Tour</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      ),
    },
    {
      header: "Rating",
      accessorKey: "rating",
      sortable: true,
      cell: (r) => (
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${
                i < r.rating
                  ? "fill-editorial-gold text-editorial-gold"
                  : "text-muted-foreground/30"
              }`}
            />
          ))}
          <span className="text-xs font-mono font-bold ml-1 text-foreground">
            {r.rating}/5
          </span>
        </div>
      ),
    },
    {
      header: "Comment",
      accessorKey: "comment",
      className: "max-w-[320px]",
      cell: (r) => (
        <p className="text-xs text-muted-foreground line-clamp-2 italic">
          "{r.comment || "No written comment"}"
        </p>
      ),
    },
  ]

  // Row actions
  const rowActions: RowAction<Review>[] = [
    {
      label: "Delete Review",
      icon: <Trash2 className="w-3.5 h-3.5 text-destructive" />,
      variant: "destructive",
      onClick: (r) => setDeleteTarget(r),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-editorial-terracotta">
          Community Moderation
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground">
          Guest Reviews &amp; Testimonials ({reviews.length})
        </h1>
        <p className="text-xs text-muted-foreground">
          Moderate verified traveler feedback, ensure editorial standards, and maintain authentic ratings.
        </p>
      </div>

      {/* Reviews DataTable */}
      <DataTable
        data={reviews}
        columns={columns}
        rowActions={rowActions}
        isLoading={isLoading}
        searchKey={(r) =>
          `${r.comment || ""} ${r.profile?.full_name || ""} ${
            (Array.isArray(r.tour) ? r.tour[0]?.title : r.tour?.title) || ""
          }`
        }
        searchPlaceholder="Search reviews by guest name, keywords, or expedition..."
        filters={[
          {
            label: "Rating",
            key: "rating",
            options: [
              { label: "5 Stars", value: 5 },
              { label: "4 Stars", value: 4 },
              { label: "3 Stars", value: 3 },
              { label: "2 Stars", value: 2 },
              { label: "1 Star", value: 1 },
            ],
          },
        ]}
        emptyMessage="No guest reviews found."
      />

      {/* Delete Review Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Guest Review?"
        description={
          deleteTarget ? (
            <span>
              Are you sure you want to permanently remove this {deleteTarget.rating}-star review
              from <strong>{deleteTarget.profile?.full_name || "Guest"}</strong>? This action
              cannot be undone and will recalculate the tour's rating score.
            </span>
          ) : (
            ""
          )
        }
        confirmLabel="Delete Review"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
