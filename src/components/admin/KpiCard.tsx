import React, { useEffect, useRef, useState } from "react"
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react"
import { gsap, prefersReducedMotion } from "@/lib/gsap"

interface KpiCardProps {
  title: string
  value: number
  prefix?: string
  suffix?: string
  trendPercent: number
  trendPositive?: boolean
  trendLabel?: string
  icon: LucideIcon
  formatter?: (val: number) => string
}

function AnimatedNumber({ value, formatter }: { value: number; formatter?: (val: number) => string }) {
  const [displayValue, setDisplayValue] = useState(0)
  const counterRef = useRef({ val: 0 })

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplayValue(value)
      return
    }

    gsap.to(counterRef.current, {
      val: value,
      duration: 1.2,
      ease: "power2.out",
      onUpdate: () => {
        setDisplayValue(Math.round(counterRef.current.val))
      },
    })
  }, [value])

  return <span>{formatter ? formatter(displayValue) : displayValue.toLocaleString()}</span>
}

export function KpiCard({
  title,
  value,
  prefix = "",
  suffix = "",
  trendPercent,
  trendPositive = true,
  trendLabel = "vs last month",
  icon: Icon,
  formatter,
}: KpiCardProps) {
  return (
    <div className="p-6 rounded-3xl border border-border bg-card shadow-subtle hover:shadow-card transition-all duration-300 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <div className="w-10 h-10 rounded-2xl bg-editorial-sand/70 dark:bg-muted flex items-center justify-center text-editorial-terracotta border border-border/60">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="space-y-1">
        <div className="font-display text-3xl font-bold text-foreground tracking-tight">
          {prefix}
          <AnimatedNumber value={value} formatter={formatter} />
          {suffix}
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={`inline-flex items-center gap-0.5 font-bold ${
              trendPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {trendPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {trendPositive ? "+" : ""}
            {trendPercent}%
          </span>
          <span className="text-muted-foreground">{trendLabel}</span>
        </div>
      </div>
    </div>
  )
}
