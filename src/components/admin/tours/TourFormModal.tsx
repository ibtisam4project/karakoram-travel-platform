import React, { useState, useEffect } from "react"
import {
  Compass,
  Upload,
  Image as ImageIcon,
  Plus,
  Trash2,
  MoveLeft,
  MoveRight,
  Star,
  Loader2,
  Calendar,
  Layers,
  FileText,
  MapPin,
} from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"
import { Tour, Destination, ItineraryDay } from "@/types/database"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { AddDestinationModal } from "./AddDestinationModal"

interface TourFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tourToEdit?: Tour | null
  onTourSaved: (savedTour: Tour) => void
}

const CATEGORIES = [
  "Northern Areas",
  "Treks & Mountaineering",
  "Cultural & Heritage",
  "International & Umrah",
  "Honeymoon & Luxury",
  "Family Expeditions",
]

export const TourFormModal: React.FC<TourFormModalProps> = ({
  open,
  onOpenChange,
  tourToEdit,
  onTourSaved,
}) => {
  const isEditing = !!tourToEdit

  // Form State
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [isSlugCustom, setIsSlugCustom] = useState(false)
  const [destinationId, setDestinationId] = useState<string>("")
  const [category, setCategory] = useState("Northern Areas")
  const [durationDays, setDurationDays] = useState(7)
  const [price, setPrice] = useState(150000)
  const [discountPrice, setDiscountPrice] = useState<number | "">("")
  const [groupSizeMax, setGroupSizeMax] = useState(12)
  const [description, setDescription] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [isFeatured, setIsFeatured] = useState(false)

  // Images state
  const [images, setImages] = useState<string[]>([])
  const [directImageUrl, setDirectImageUrl] = useState("")
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Itinerary state
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([])

  // Destinations list
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [showAddDestModal, setShowAddDestModal] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  // Load destinations
  useEffect(() => {
    async function loadDestinations() {
      const { data } = await supabase
        .from("destinations")
        .select("*")
        .order("name", { ascending: true })
      if (data) setDestinations(data as Destination[])
    }
    if (open) {
      loadDestinations()
    }
  }, [open])

  // Populate form when tourToEdit changes or modal opens
  useEffect(() => {
    if (open) {
      if (tourToEdit) {
        setTitle(tourToEdit.title || "")
        setSlug(tourToEdit.slug || "")
        setIsSlugCustom(true)
        setDestinationId(tourToEdit.destination_id || "")
        setCategory(tourToEdit.category || "Northern Areas")
        setDurationDays(tourToEdit.duration_days || 7)
        setPrice(Number(tourToEdit.price) || 0)
        setDiscountPrice(tourToEdit.discount_price ? Number(tourToEdit.discount_price) : "")
        setGroupSizeMax(tourToEdit.group_size_max || 12)
        setDescription(tourToEdit.description || "")
        setIsActive(tourToEdit.is_active ?? true)
        setIsFeatured(tourToEdit.is_featured ?? false)
        setImages(tourToEdit.images || [])
        setItinerary(tourToEdit.itinerary || [])
      } else {
        // Reset defaults for creation
        setTitle("")
        setSlug("")
        setIsSlugCustom(false)
        setDestinationId("")
        setCategory("Northern Areas")
        setDurationDays(7)
        setPrice(150000)
        setDiscountPrice("")
        setGroupSizeMax(12)
        setDescription("")
        setIsActive(true)
        setIsFeatured(false)
        setImages([])
        setItinerary([
          {
            day: 1,
            title: "Arrival & Welcome Briefing",
            description: "Assemble at the expedition base, briefing with lead guides and gear check.",
            stay: "Serena or Boutique Heritage Hotel",
            meals: "Dinner Included",
          },
        ])
      }
      setActiveTab("general")
    }
  }, [open, tourToEdit])

  // Auto-generate slug from title if not customized
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setTitle(val)
    if (!isSlugCustom) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
      setSlug(generated)
    }
  }

  // Handle image upload to Supabase Storage bucket 'tour-images'
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      setIsUploadingImage(true)
      const uploadedUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
        const filePath = `tours/${Date.now()}_${cleanName}`

        const { data, error } = await supabase.storage
          .from("tour-images")
          .upload(filePath, file, { cacheControl: "3600", upsert: true })

        if (error) {
          console.warn("Storage upload failed or bucket restricted, falling back to data URL:", error)
          // As a high-reliability fallback if storage permissions differ, create object URL or read as base64
          toast.error(`Could not upload ${file.name}: ${error.message}`)
        } else if (data) {
          const { data: publicUrlData } = supabase.storage
            .from("tour-images")
            .getPublicUrl(data.path)
          if (publicUrlData?.publicUrl) {
            uploadedUrls.push(publicUrlData.publicUrl)
          }
        }
      }

      if (uploadedUrls.length > 0) {
        setImages((prev) => [...prev, ...uploadedUrls])
        toast.success(`Successfully uploaded ${uploadedUrls.length} photo(s)!`)
      }
    } catch (err: any) {
      console.error("Image upload exception:", err)
      toast.error(err.message || "Failed to upload image")
    } finally {
      setIsUploadingImage(false)
      // Reset input value
      e.target.value = ""
    }
  }

  // Add image by direct URL
  const handleAddDirectUrl = () => {
    if (!directImageUrl.trim()) return
    setImages((prev) => [...prev, directImageUrl.trim()])
    setDirectImageUrl("")
    toast.success("Image URL added to gallery")
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleMoveImage = (index: number, direction: "left" | "right") => {
    const newIdx = direction === "left" ? index - 1 : index + 1
    if (newIdx < 0 || newIdx >= images.length) return
    const updated = [...images]
    const temp = updated[index]
    updated[index] = updated[newIdx]
    updated[newIdx] = temp
    setImages(updated)
  }

  const handleSetCover = (index: number) => {
    if (index === 0) return
    const updated = [...images]
    const item = updated.splice(index, 1)[0]
    updated.unshift(item)
    setImages(updated)
    toast.success("Set as primary expedition cover image")
  }

  // Itinerary Day handlers
  const handleAddDay = () => {
    const nextDayNum = itinerary.length + 1
    setItinerary((prev) => [
      ...prev,
      {
        day: nextDayNum,
        title: `Day ${nextDayNum} Exploration`,
        description: "",
        stay: "Standard Mountain Lodge",
        meals: "Breakfast & Dinner",
      },
    ])
  }

  const handleRemoveDay = (index: number) => {
    const updated = itinerary
      .filter((_, idx) => idx !== index)
      .map((item, idx) => ({ ...item, day: idx + 1 }))
    setItinerary(updated)
  }

  const handleUpdateDay = (index: number, field: keyof ItineraryDay, value: any) => {
    setItinerary((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    )
  }

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("Expedition title is required")
      setActiveTab("general")
      return
    }

    if (!slug.trim()) {
      toast.error("URL Slug is required")
      setActiveTab("general")
      return
    }

    try {
      setIsSubmitting(true)

      const payload = {
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        destination_id: destinationId || null,
        category,
        duration_days: Number(durationDays) || 1,
        price: Number(price) || 0,
        discount_price: discountPrice !== "" ? Number(discountPrice) : null,
        group_size_max: Number(groupSizeMax) || 12,
        description: description.trim() || null,
        is_active: isActive,
        is_featured: isFeatured,
        images: images,
        itinerary: itinerary,
        updated_at: new Date().toISOString(),
      }

      let savedData: Tour

      if (isEditing && tourToEdit?.id) {
        // Update existing tour
        const { data, error } = await supabase
          .from("tours")
          .update(payload)
          .eq("id", tourToEdit.id)
          .select(`
            *,
            destination:destinations(*)
          `)
          .single()

        if (error) throw error
        savedData = data as Tour
        toast.success(`Expedition "${savedData.title}" updated successfully!`)
      } else {
        // Create new tour
        const { data, error } = await supabase
          .from("tours")
          .insert(payload)
          .select(`
            *,
            destination:destinations(*)
          `)
          .single()

        if (error) throw error
        savedData = data as Tour
        toast.success(`Expedition "${savedData.title}" created successfully!`)
      }

      onTourSaved(savedData)
      onOpenChange(false)
    } catch (err: any) {
      console.error("Error saving tour:", err)
      toast.error(err.message || "Failed to save expedition")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader className="space-y-2 border-b border-border/70 pb-4">
              <div className="flex items-center gap-2.5 text-editorial-navy dark:text-editorial-sand">
                <div className="w-9 h-9 rounded-xl bg-editorial-navy/10 dark:bg-editorial-sand/10 flex items-center justify-center text-editorial-terracotta">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="font-serif text-2xl font-bold text-foreground">
                    {isEditing ? "Edit Expedition Package" : "Create New Expedition"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {isEditing
                      ? `Editing manifest for "${tourToEdit?.title}"`
                      : "Configure a signature journey across Pakistan or international hubs."}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 h-11 rounded-2xl bg-muted/50 p-1">
                <TabsTrigger
                  value="general"
                  className="rounded-xl text-xs font-serif font-bold gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>General Details</span>
                </TabsTrigger>
                <TabsTrigger
                  value="media"
                  className="rounded-xl text-xs font-serif font-bold gap-1.5"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Media Gallery ({images.length})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="itinerary"
                  className="rounded-xl text-xs font-serif font-bold gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Itinerary Builder ({itinerary.length} Days)</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: General Details */}
              <TabsContent value="general" className="space-y-5 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold">Expedition Title *</Label>
                    <Input
                      value={title}
                      onChange={handleTitleChange}
                      placeholder="e.g. Rakaposhi Base Camp & Minapin Glacier Trek"
                      className="text-xs rounded-xl h-10"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">URL Slug *</Label>
                      <button
                        type="button"
                        onClick={() => setIsSlugCustom(true)}
                        className="text-[10px] text-editorial-terracotta hover:underline"
                      >
                        Customize Slug
                      </button>
                    </div>
                    <Input
                      value={slug}
                      onChange={(e) => {
                        setIsSlugCustom(true)
                        setSlug(e.target.value)
                      }}
                      placeholder="rakaposhi-base-camp-trek"
                      className="text-xs rounded-xl h-10 font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Destination Hub</Label>
                      <button
                        type="button"
                        onClick={() => setShowAddDestModal(true)}
                        className="text-[10px] text-editorial-terracotta hover:underline font-bold"
                      >
                        + Add Destination
                      </button>
                    </div>
                    <select
                      value={destinationId}
                      onChange={(e) => setDestinationId(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select Destination...</option>
                      {destinations.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.country})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Category</Label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Duration (Days) *</Label>
                    <Input
                      type="number"
                      min={1}
                      max={90}
                      value={durationDays}
                      onChange={(e) => setDurationDays(Number(e.target.value))}
                      className="text-xs rounded-xl h-10"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Price per Traveler (PKR) *</Label>
                    <Input
                      type="number"
                      min={0}
                      step={500}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="text-xs rounded-xl h-10 font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Discounted Price (PKR, Optional)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      step={500}
                      value={discountPrice}
                      onChange={(e) =>
                        setDiscountPrice(e.target.value ? Number(e.target.value) : "")
                      }
                      placeholder="Leave empty if regular price"
                      className="text-xs rounded-xl h-10 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Max Group Size</Label>
                    <Input
                      type="number"
                      min={1}
                      max={60}
                      value={groupSizeMax}
                      onChange={(e) => setGroupSizeMax(Number(e.target.value))}
                      className="text-xs rounded-xl h-10"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold">Expedition Overview &amp; Narrative</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the adventure, terrain, highlights, and cultural experience..."
                      className="text-xs rounded-xl min-h-[100px]"
                    />
                  </div>

                  {/* Toggles */}
                  <div className="p-4 rounded-2xl border border-border bg-muted/20 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold block text-foreground">Active Status</span>
                      <span className="text-[11px] text-muted-foreground">
                        When active, tour is published and bookable on the public storefront.
                      </span>
                    </div>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>

                  <div className="p-4 rounded-2xl border border-border bg-muted/20 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold block text-foreground">Featured Expedition</span>
                      <span className="text-[11px] text-muted-foreground">
                        Displays prominently on the homepage curated collection.
                      </span>
                    </div>
                    <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Media Gallery & Storage Uploads */}
              <TabsContent value="media" className="space-y-5 pt-4">
                {/* Upload & Add Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* File Upload Box */}
                  <div className="p-5 rounded-2xl border-2 border-dashed border-border hover:border-editorial-terracotta/60 transition-colors bg-muted/10 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-editorial-navy/10 text-editorial-terracotta flex items-center justify-center mx-auto">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-foreground">Upload to Tour Storage</h5>
                      <p className="text-[11px] text-muted-foreground">
                        Select multiple PNG, JPG, or WEBP photos (saved to <code>tour-images</code> bucket)
                      </p>
                    </div>
                    <label className="inline-block">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploadingImage}
                        onClick={(e) => {
                          const input = (e.currentTarget.parentElement?.querySelector(
                            'input[type="file"]'
                          ) as HTMLInputElement)
                          input?.click()
                        }}
                        className="rounded-xl text-xs h-9 gap-1.5"
                      >
                        {isUploadingImage ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{isUploadingImage ? "Uploading..." : "Select Files"}</span>
                      </Button>
                    </label>
                  </div>

                  {/* Add URL directly */}
                  <div className="p-5 rounded-2xl border border-border bg-card space-y-3">
                    <div className="space-y-1">
                      <h5 className="text-xs font-bold text-foreground">Add Direct Image URL</h5>
                      <p className="text-[11px] text-muted-foreground">
                        Paste external Unsplash or cloud asset link
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Input
                        value={directImageUrl}
                        onChange={(e) => setDirectImageUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="text-xs rounded-xl h-9 font-mono"
                      />
                      <Button
                        type="button"
                        variant="editorial"
                        size="sm"
                        onClick={handleAddDirectUrl}
                        disabled={!directImageUrl.trim()}
                        className="w-full text-xs h-9 rounded-xl"
                      >
                        Add URL to Gallery
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Gallery Preview & Management */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Gallery Photos ({images.length})
                    </h5>
                    <span className="text-[11px] text-muted-foreground">
                      First image is the primary cover.
                    </span>
                  </div>

                  {images.length === 0 ? (
                    <div className="p-8 text-center border border-dashed rounded-2xl text-xs text-muted-foreground font-serif">
                      No photos added yet. Upload high-resolution mountain landscapes above!
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                      {images.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="group relative rounded-2xl overflow-hidden border border-border bg-muted/40 aspect-[4/3]"
                        >
                          <img
                            src={imgUrl}
                            alt={`Tour preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />

                          {/* Cover Badge */}
                          {idx === 0 && (
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-editorial-navy text-white text-[9px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-editorial-gold text-editorial-gold" />
                              Cover
                            </div>
                          )}

                          {/* Hover Controls Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="w-6 h-6 rounded-lg bg-destructive text-white flex items-center justify-center hover:bg-destructive/80 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between gap-1">
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleMoveImage(idx, "left")}
                                  className="w-6 h-6 rounded-lg bg-white/20 text-white flex items-center justify-center hover:bg-white/40 disabled:opacity-30"
                                >
                                  <MoveLeft className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === images.length - 1}
                                  onClick={() => handleMoveImage(idx, "right")}
                                  className="w-6 h-6 rounded-lg bg-white/20 text-white flex items-center justify-center hover:bg-white/40 disabled:opacity-30"
                                >
                                  <MoveRight className="w-3 h-3" />
                                </button>
                              </div>

                              {idx !== 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleSetCover(idx)}
                                  className="px-2 py-1 rounded-lg bg-editorial-terracotta text-white text-[10px] font-bold hover:bg-editorial-terracotta/90"
                                >
                                  Set Cover
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Tab 3: Itinerary Builder */}
              <TabsContent value="itinerary" className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Daily Expedition Itinerary
                    </h5>
                    <p className="text-[11px] text-muted-foreground">
                      Structured day-by-day plan rendered on the public interactive timeline.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddDay}
                    className="rounded-xl text-xs h-8 gap-1 border-editorial-terracotta/50 text-editorial-terracotta"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Next Day</span>
                  </Button>
                </div>

                {itinerary.length === 0 ? (
                  <div className="p-8 text-center border border-dashed rounded-2xl text-xs text-muted-foreground font-serif">
                    No itinerary days defined. Click "+ Add Next Day" to build the route!
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {itinerary.map((dayItem, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl border border-border bg-card shadow-subtle space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-xl bg-editorial-navy text-white text-xs font-bold flex items-center justify-center font-mono">
                              {dayItem.day}
                            </span>
                            <span className="text-xs font-serif font-bold text-foreground">
                              Day {dayItem.day} Stage
                            </span>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDay(idx)}
                            className="h-7 w-7 p-0 rounded-lg text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-3 space-y-1">
                            <Label className="text-[11px] font-semibold">Day Stage Title *</Label>
                            <Input
                              value={dayItem.title}
                              onChange={(e) => handleUpdateDay(idx, "title", e.target.value)}
                              placeholder="e.g. Islamabad to Skardu Scenic Flight or K2 Memorial Trek"
                              className="text-xs rounded-xl h-8"
                              required
                            />
                          </div>

                          <div className="sm:col-span-3 space-y-1">
                            <Label className="text-[11px] font-semibold">Description &amp; Route Notes</Label>
                            <Textarea
                              value={dayItem.description}
                              onChange={(e) => handleUpdateDay(idx, "description", e.target.value)}
                              placeholder="Detailed schedule, driving hours, elevation gain, landmarks..."
                              className="text-xs rounded-xl min-h-[60px]"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[11px] font-semibold">Stay / Accommodation</Label>
                            <Input
                              value={dayItem.stay || ""}
                              onChange={(e) => handleUpdateDay(idx, "stay", e.target.value)}
                              placeholder="e.g. Serena Shigar Fort"
                              className="text-xs rounded-xl h-8"
                            />
                          </div>

                          <div className="sm:col-span-2 space-y-1">
                            <Label className="text-[11px] font-semibold">Meals Included</Label>
                            <Input
                              value={dayItem.meals || ""}
                              onChange={(e) => handleUpdateDay(idx, "meals", e.target.value)}
                              placeholder="e.g. Breakfast, Camp Lunch, Barbecue Dinner"
                              className="text-xs rounded-xl h-8"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Modal Footer */}
            <DialogFooter className="pt-4 border-t border-border flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
                className="rounded-xl text-xs h-10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="rounded-xl text-xs h-10 min-w-[120px] bg-editorial-terracotta hover:bg-editorial-terracotta/90 text-white font-serif font-bold"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </span>
                ) : isEditing ? (
                  "Save Changes"
                ) : (
                  "Create Expedition"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Inline Destination Creation Modal */}
      <AddDestinationModal
        open={showAddDestModal}
        onOpenChange={setShowAddDestModal}
        onDestinationCreated={(newDest) => {
          setDestinations((prev) => [...prev, newDest])
          setDestinationId(newDest.id)
        }}
      />
    </>
  )
}
