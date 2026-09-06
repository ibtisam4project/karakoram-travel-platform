import React, { useRef } from "react"
import { useScrollReveal, UseScrollRevealOptions } from "./useScrollReveal"

export interface RevealProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  options?: UseScrollRevealOptions
  as?: React.ElementType
}

export function Reveal({
  children,
  options,
  as: Component = "div",
  className = "",
  ...props
}: RevealProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  useScrollReveal(containerRef, options)

  const Tag = Component as any

  return (
    <Tag ref={containerRef} className={className} {...props}>
      {children}
    </Tag>
  )
}
