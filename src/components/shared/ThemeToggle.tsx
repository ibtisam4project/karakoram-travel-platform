import React from "react"
import { useTheme } from "@/context/ThemeContext"

/**
 * Editorial Celestial Theme Toggle
 * Adapted from Uiverse.io aesthetic (sun/moon horizon slider with editorial sand & navy accents)
 * Matches Karakoram & Co's boutique travel aesthetic with smooth sliding orb and sky transitions.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`
        relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full p-1 
        transition-colors duration-500 ease-in-out focus:outline-none focus-visible:ring-2 
        focus-visible:ring-editorial-terracotta focus-visible:ring-offset-2
        ${
          isDark
            ? "bg-slate-900 border border-slate-700 shadow-inner"
            : "bg-editorial-sand border border-editorial-navy/20 shadow-sm"
        }
      `}
      aria-label="Toggle dark/light mode"
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {/* Background celestial icons */}
      <span className="absolute left-1.5 flex h-4 w-4 items-center justify-center text-amber-500 text-[11px] select-none transition-opacity duration-300">
        ☀️
      </span>
      <span className="absolute right-1.5 flex h-4 w-4 items-center justify-center text-slate-300 text-[10px] select-none transition-opacity duration-300">
        🌙
      </span>

      {/* Sliding Celestial Orb */}
      <span
        className={`
          pointer-events-none inline-block h-6 w-6 transform rounded-full 
          shadow-md transition-transform duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
          flex items-center justify-center
          ${
            isDark
              ? "translate-x-6 bg-gradient-to-tr from-slate-200 to-amber-100 text-slate-900"
              : "translate-x-0 bg-gradient-to-tr from-amber-400 to-editorial-terracotta text-white"
          }
        `}
      >
        <span className="text-[10px]">
          {isDark ? "✦" : "•"}
        </span>
      </span>
    </button>
  )
}
