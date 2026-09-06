import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export { gsap, ScrollTrigger }

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function useTiltCard<T extends HTMLElement>(options?: {
  maxTilt?: number
  perspective?: number
  scale?: number
}) {
  const cardRef = useRef<T | null>(null)

  useEffect(() => {
    const card = cardRef.current
    if (!card || prefersReducedMotion()) return

    const maxTilt = options?.maxTilt ?? 5
    const perspective = options?.perspective ?? 1000
    const hoverScale = options?.scale ?? 1.015

    gsap.set(card, {
      transformPerspective: perspective,
      transformStyle: "preserve-3d",
    })

    const setRotateX = gsap.quickTo(card, "rotateX", { duration: 0.4, ease: "power2.out" })
    const setRotateY = gsap.quickTo(card, "rotateY", { duration: 0.4, ease: "power2.out" })
    const setScale = gsap.quickTo(card, "scale", { duration: 0.4, ease: "power2.out" })

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const rotateX = ((y - centerY) / centerY) * -maxTilt
      const rotateY = ((x - centerX) / centerX) * maxTilt

      setRotateX(rotateX)
      setRotateY(rotateY)
      setScale(hoverScale)
    }

    const handleMouseLeave = () => {
      setRotateX(0)
      setRotateY(0)
      setScale(1)
    }

    card.addEventListener("mousemove", handleMouseMove)
    card.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      card.removeEventListener("mousemove", handleMouseMove)
      card.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [options?.maxTilt, options?.perspective, options?.scale])

  return cardRef
}

export function useMagneticButton<T extends HTMLElement>(strength = 0.25) {
  const buttonRef = useRef<T | null>(null)

  useEffect(() => {
    const btn = buttonRef.current
    if (!btn || prefersReducedMotion()) return

    const setX = gsap.quickTo(btn, "x", { duration: 0.35, ease: "power2.out" })
    const setY = gsap.quickTo(btn, "y", { duration: 0.35, ease: "power2.out" })

    const handleMouseMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect()
      const x = (e.clientX - (rect.left + rect.width / 2)) * strength
      const y = (e.clientY - (rect.top + rect.height / 2)) * strength
      setX(x)
      setY(y)
    }

    const handleMouseLeave = () => {
      setX(0)
      setY(0)
    }

    btn.addEventListener("mousemove", handleMouseMove)
    btn.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      btn.removeEventListener("mousemove", handleMouseMove)
      btn.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [strength])

  return buttonRef
}
