import React, { useState } from "react"
import { Star, Loader2, MessageSquare, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import { Booking } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  booking: Booking
  onReviewSubmitted?: () => void
}

export function ReviewModal({
  isOpen,
  onClose,
  booking,
  onReviewSubmitted,
}: ReviewModalProps) {
  const [rating, setRating] = useState<number>(5)
  const [comment, setComment] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!booking.tour_id || !booking.user_id) return

    try {
      setIsSubmitting(true)

      // 1. Insert review into public.reviews
      const { error: reviewError } = await supabase.from("reviews").insert({
        user_id: booking.user_id,
        tour_id: booking.tour_id,
        booking_id: booking.id,
        rating: rating,
        comment: comment.trim() || null,
      })

      if (reviewError) throw reviewError

      // 2. Recompute and update the tour's rating_avg directly
      const { data: allTourReviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("tour_id", booking.tour_id)

      if (allTourReviews && allTourReviews.length > 0) {
        const totalRating = allTourReviews.reduce((sum, r) => sum + r.rating, 0)
        const newAvg = Number((totalRating / allTourReviews.length).toFixed(1))

        await supabase
          .from("tours")
          .update({ rating_avg: newAvg })
          .eq("id", booking.tour_id)
      }

      toast.success("Review Published!", {
        description: "Shukriya for sharing your feedback with fellow Karakoram travelers.",
      })

      if (onReviewSubmitted) onReviewSubmitted()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to submit review"
      toast.error("Review error", { description: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-6 rounded-3xl bg-background">
        <DialogHeader className="space-y-1 text-left">
          <DialogTitle className="text-xl font-serif font-bold text-foreground">
            Review Your Expedition
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {booking.tour?.title || "Share your travel experience"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmitReview} className="space-y-4 pt-2">
          {/* Star Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Your Rating</Label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating
                        ? "fill-editorial-gold text-editorial-gold"
                        : "text-muted-foreground/40"
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-serif font-bold ml-2 text-editorial-terracotta">
                {rating} of 5 Stars
              </span>
            </div>
          </div>

          {/* Comment Textarea */}
          <div className="space-y-1.5">
            <Label htmlFor="reviewComment" className="text-xs font-semibold">
              Traveler Feedback &amp; Memories
            </Label>
            <textarea
              id="reviewComment"
              required
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell other travelers about your mountain guides, accommodations, scenic stops, and Pakistani hospitality..."
              className="w-full rounded-2xl border border-input bg-card p-3 text-sm focus:outline-none focus:ring-2 focus:ring-editorial-terracotta"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="editorial" disabled={isSubmitting} className="gap-1.5">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  <span>Publish Review</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
