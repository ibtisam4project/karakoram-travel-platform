import React, { useState } from "react"
import { MapPin, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import { Destination } from "@/types/database"
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
import { Textarea } from "@/components/ui/textarea"

interface AddDestinationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDestinationCreated: (destination: Destination) => void
}

export const AddDestinationModal: React.FC<AddDestinationModalProps> = ({
  open,
  onOpenChange,
  onDestinationCreated,
}) => {
  const [name, setName] = useState("")
  const [country, setCountry] = useState("Pakistan")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Destination name is required")
      return
    }

    try {
      setIsSubmitting(true)
      const { data, error } = await supabase
        .from("destinations")
        .insert({
          name: name.trim(),
          country: country.trim() || "Pakistan",
          description: description.trim() || null,
          image_url: imageUrl.trim() || null,
        })
        .select()
        .single()

      if (error) throw error

      toast.success(`Destination "${data.name}" added successfully!`)
      onDestinationCreated(data as Destination)
      setName("")
      setDescription("")
      setImageUrl("")
      onOpenChange(false)
    } catch (err: any) {
      console.error("Error creating destination:", err)
      toast.error(err.message || "Failed to create destination")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader className="space-y-1.5">
            <div className="flex items-center gap-2 text-editorial-terracotta">
              <MapPin className="w-5 h-5" />
              <DialogTitle className="font-serif text-lg font-bold text-foreground">
                Add New Destination
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Create a geographical hub for expeditions across Pakistan or international frontiers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Destination Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Hunza Valley, Skardu, Kaghan"
                className="text-xs rounded-xl h-9"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Country</Label>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Pakistan"
                className="text-xs rounded-xl h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Image URL (Optional)</Label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="text-xs rounded-xl h-9 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Short Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of highlights, mountain ranges, or cultural significance..."
                className="text-xs rounded-xl h-20"
              />
            </div>
          </div>

          <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="rounded-xl text-xs h-9 bg-editorial-navy hover:bg-editorial-navy/90 text-white dark:bg-editorial-sand dark:text-editorial-navy"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </span>
              ) : (
                "Create Destination"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
