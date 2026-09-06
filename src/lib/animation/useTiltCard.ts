import { RefObject, useEffect } from "react"
import { gsap } from "./gsap"
import { isTouchDevice, prefersReducedMotion } from "./utils"

export interface UseTiltCardOptions {
  maxTilt?: number
  perspective?: number
  scale?: number
}

export function useTiltCard<T extends HTMLElement>(
  targetRef: RefObject<T | null>,
  options: UseTiltCardOptions = {}
) {
  useEffect(() => {
    const card = targetRef.current
    if (!card || isTouchDevice() || prefersReducedMotion()) return

    const {
      maxTilt = 6,
      perspective = 1000,
      scale = 1.02,
    } = options

    gsap.set(card, {
      transformPerspective: perspective,
      transformStyle: "preserve-3d",
      willChange: "transform, box-shadow",
    })

    const setRotateX = gsap.quickTo(card, "rotateX", { duration: 0.35, ease: "power2.out" })
    const setRotateY = gsap.quickTo(card, "rotateY", { duration: 0.35, ease: "power2.out" })
    const setScale = gsap.quickTo(card, "scale", { duration: 0.35, ease: "power2.out" })

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const normX = (x - centerX) / centerX
      const normY = (y - centerY) / centerY

      const rotateX = normY * -maxTilt
      const rotateY = normX * maxTilt

      setRotateX(rotateX)
      setRotateY(rotateY)
      setScale(scale)

      const shadowX = -normX * 12
      const shadowY = 12 + normY * 10
      card.style.boxShadow = `${shadowX}px ${shadowY}px 28px rgba(11, 59, 75, 0.16)`
    }

    const handleMouseLeave = () => {
      setRotateX(0)
      setRotateY(0)
      setScale(1)
      card.style.boxShadow = ""
    }

    card.addEventListener("mousemove", handleMouseMove)
    card.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      card.removeEventListener("mousemove", handleMouseMove)
      card.removeEventListener("mouseleave", handleMouseLeave)
      card.style.transform = ""
      card.style.boxShadow = ""
    }
  }, [targetRef, options.maxTilt, options.perspective, options.scale])
}
