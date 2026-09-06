import { RefObject, useEffect } from "react"
import { gsap } from "./gsap"
import { prefersReducedMotion } from "./utils"

export interface UseCountUpOptions {
  duration?: number
  delay?: number
  prefix?: string
  suffix?: string
  decimals?: number
  formatCommas?: boolean
}

export function useCountUp<T extends HTMLElement>(
  targetRef: RefObject<T | null>,
  targetValue: number,
  options: UseCountUpOptions = {}
) {
  useEffect(() => {
    const el = targetRef.current
    if (!el) return

    const {
      duration = 1.6,
      delay = 0,
      prefix = "",
      suffix = "",
      decimals = 0,
      formatCommas = true,
    } = options

    const formatNum = (n: number) => {
      const fixed = n.toFixed(decimals)
      if (!formatCommas) return prefix + fixed + suffix
      const parts = fixed.split(".")
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
      return prefix + parts.join(".") + suffix
    }

    if (prefersReducedMotion()) {
      el.textContent = formatNum(targetValue)
      return
    }

    const obj = { val: 0 }

    const ctx = gsap.context(() => {
      gsap.to(obj, {
        val: targetValue,
        duration,
        delay,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 92%",
          once: true,
        },
        onUpdate: () => {
          if (el) el.textContent = formatNum(obj.val)
        },
      })
    }, el)

    return () => ctx.revert()
  }, [targetRef, targetValue, options.duration, options.delay, options.prefix, options.suffix, options.decimals, options.formatCommas])
}
