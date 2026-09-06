import { useRef } from "react"
import { useParallax } from "@/lib/animation"
import React, { useState } from "react"
import { Maximize2 } from "lucide-react"

interface TourGalleryProps {
  images: string[]
  title: string
}

export function TourGallery({ images, title }: TourGalleryProps) {
  const heroImageRef = useRef<HTMLImageElement>(null)
  useParallax(heroImageRef, { speed: 15, scale: 1.08 })
  const fallback = "/images/tours/hunza_valley_autumn_1788431904215.jpg"
  const galleryImages = images && images.length > 0 ? images : [fallback]
  const [selectedImage, setSelectedImage] = useState<string>(galleryImages[0])
  const [lightboxOpen, setLightboxOpen] = useState(false)

  return (
    <div className="space-y-4">
      {/* 1. Main Highlight Image */}
      <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full rounded-3xl overflow-hidden shadow-card group bg-muted">
        <img
          ref={heroImageRef}
          src={selectedImage}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-102 will-change-transform"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Expand Lightbox Action Button */}
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="absolute bottom-4 right-4 p-2.5 rounded-full bg-black/50 hover:bg-black/75 backdrop-blur-md text-white transition-all shadow-md active:scale-95"
          title="View Full Resolution"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Thumbnail Strip */}
      {galleryImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
          {galleryImages.map((img, idx) => {
            const isSelected = selectedImage === img
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedImage(img)}
                className={`relative aspect-[16/10] w-24 sm:w-32 rounded-2xl overflow-hidden shrink-0 border-2 transition-all ${
                  isSelected
                    ? "border-editorial-terracotta ring-2 ring-editorial-terracotta/30 scale-95"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <img
                  src={img}
                  alt={`${title} view ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            )
          })}
        </div>
      )}

      {/* 3. Modal Lightbox */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 sm:p-8 animate-in fade-in"
        >
          <img
            src={selectedImage}
            alt={title}
            className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  )
}
