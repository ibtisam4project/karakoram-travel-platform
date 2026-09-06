import { RefObject, useEffect } from "react"
import { gsap, SplitText } from "./gsap"
import { prefersReducedMotion } from "./utils"

export interface UseSplitTextRevealOptions {
  type?: "chars,words" | "words" | "chars"
  duration?: number
  stagger?: number
  delay?: number
  triggerOnScroll?: boolean
  start?: string
}

export function useSplitTextReveal<T extends HTMLElement>(
  targetRef: RefObject<T | null>,
  options: UseSplitTextRevealOptions = {}
) {
  useEffect(() => {
    const el = targetRef.current
    if (!el) return

    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1 })
      return
    }

    const {
      type = "words,chars",
      duration = 0.7,
      stagger = 0.02,
      delay = 0.1,
      triggerOnScroll = false,
      start = "top 85%",
    } = options

    let split: any = null

    const ctx = gsap.context(() => {
      try {
        split = new SplitText(el, { type })
        const targets = split.chars && split.chars.length ? split.chars : split.words

        const anim = gsap.from(targets, {
          opacity: 0,
          y: 24,
          rotationX: -40,
          duration,
          stagger,
          delay,
          ease: "back.out(1.5)",
          paused: triggerOnScroll,
        })

        if (triggerOnScroll) {
          gsap.timeline({
            scrollTrigger: {
              trigger: el,
              start,
              once: true,
              onEnter: () => anim.play(),
            },
          })
        }
      } catch (e) {
        gsap.from(el, { opacity: 0, y: 20, duration: 0.8, delay, ease: "power2.out" })
      }
    }, el)

    return () => {
      ctx.revert()
      if (split && typeof split.revert === "function") {
        split.revert()
      }
    }
  }, [targetRef, options.type, options.duration, options.stagger, options.delay, options.triggerOnScroll, options.start])
}
