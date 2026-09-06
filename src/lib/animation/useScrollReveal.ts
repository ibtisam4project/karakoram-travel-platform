import { RefObject, useEffect } from "react"
import { gsap } from "./gsap"
import { prefersReducedMotion } from "./utils"

export interface UseScrollRevealOptions {
  y?: number
  duration?: number
  delay?: number
  stagger?: number
  start?: string
  once?: boolean
  childrenSelector?: string
}

export function useScrollReveal<T extends HTMLElement>(
  targetRef: RefObject<T | null>,
  options: UseScrollRevealOptions = {}
) {
  useEffect(() => {
    const el = targetRef.current
    if (!el) return

    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, y: 0 })
      return
    }

    const {
      y = 35,
      duration = 0.8,
      delay = 0,
      stagger = 0.12,
      start = "top 88%",
      once = true,
      childrenSelector,
    } = options

    const ctx = gsap.context(() => {
      const targets = childrenSelector
        ? el.querySelectorAll(childrenSelector)
        : el

      gsap.fromTo(
        targets,
        {
          opacity: 0,
          y,
        },
        {
          opacity: 1,
          y: 0,
          duration,
          delay,
          stagger: childrenSelector ? stagger : 0,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start,
            toggleActions: once ? "play none none none" : "play none none reverse",
          },
        }
      )
    }, el)

    return () => ctx.revert()
  }, [targetRef, options.y, options.duration, options.delay, options.stagger, options.start, options.once, options.childrenSelector])
}
