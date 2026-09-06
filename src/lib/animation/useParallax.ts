import { RefObject, useEffect } from "react"
import { gsap } from "./gsap"
import { prefersReducedMotion } from "./utils"

export interface UseParallaxOptions {
  speed?: number
  start?: string
  end?: string
  scale?: number
}

export function useParallax<T extends HTMLElement>(
  targetRef: RefObject<T | null>,
  options: UseParallaxOptions = {}
) {
  useEffect(() => {
    const el = targetRef.current
    if (!el || prefersReducedMotion()) return

    const { speed = 25, start = "top bottom", end = "bottom top", scale = 1.12 } = options

    const ctx = gsap.context(() => {
      gsap.to(el, {
        yPercent: speed,
        scale: scale,
        ease: "none",
        scrollTrigger: {
          trigger: el.parentElement || el,
          start,
          end,
          scrub: true,
        },
      })
    }, el)

    return () => ctx.revert()
  }, [targetRef, options.speed, options.start, options.end, options.scale])
}
