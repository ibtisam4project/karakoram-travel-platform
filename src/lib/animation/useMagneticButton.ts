import { RefObject, useEffect } from "react"
import anime from "animejs"
import { gsap } from "./gsap"
import { isTouchDevice, prefersReducedMotion } from "./utils"

export interface UseMagneticButtonOptions {
  strength?: number
  scale?: number
}

export function useMagneticButton<T extends HTMLElement>(
  targetRef: RefObject<T | null>,
  options: UseMagneticButtonOptions = {}
) {
  useEffect(() => {
    const btn = targetRef.current
    if (!btn || isTouchDevice() || prefersReducedMotion()) return

    const { strength = 0.28, scale = 1.04 } = options

    btn.style.position = btn.style.position || "relative"
    btn.style.overflow = "hidden"

    let shine = btn.querySelector(".anime-shine-overlay") as HTMLElement | null
    if (!shine) {
      shine = document.createElement("span")
      shine.className = "anime-shine-overlay pointer-events-none absolute inset-0 z-10 block opacity-0"
      shine.style.background =
        "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.35) 50%, transparent 80%)"
      shine.style.transform = "translateX(-100%)"
      btn.appendChild(shine)
    }

    const setX = gsap.quickTo(btn, "x", { duration: 0.35, ease: "power2.out" })
    const setY = gsap.quickTo(btn, "y", { duration: 0.35, ease: "power2.out" })

    let hoverTimeline: any = null

    const handleMouseMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect()
      const x = (e.clientX - (rect.left + rect.width / 2)) * strength
      const y = (e.clientY - (rect.top + rect.height / 2)) * strength
      setX(x)
      setY(y)
    }

    const handleMouseEnter = () => {
      if (hoverTimeline) hoverTimeline.pause()
      hoverTimeline = anime.timeline({
        easing: "easeOutQuad",
      })

      hoverTimeline
        .add({
          targets: btn,
          scale: scale,
          duration: 260,
        })
        .add(
          {
            targets: shine,
            translateX: ["-100%", "120%"],
            opacity: [
              { value: 0, duration: 0 },
              { value: 0.8, duration: 100 },
              { value: 0, duration: 250 },
            ],
            duration: 550,
            easing: "easeInOutSine",
          },
          "-=180"
        )
    }

    const handleMouseLeave = () => {
      setX(0)
      setY(0)
      if (hoverTimeline) hoverTimeline.pause()

      anime({
        targets: btn,
        scale: 1,
        duration: 300,
        easing: "easeOutQuad",
      })

      if (shine) {
        anime.set(shine, { translateX: "-100%", opacity: 0 })
      }
    }

    btn.addEventListener("mousemove", handleMouseMove)
    btn.addEventListener("mouseenter", handleMouseEnter)
    btn.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      btn.removeEventListener("mousemove", handleMouseMove)
      btn.removeEventListener("mouseenter", handleMouseEnter)
      btn.removeEventListener("mouseleave", handleMouseLeave)
      btn.style.transform = ""
    }
  }, [targetRef, options.strength, options.scale])
}
