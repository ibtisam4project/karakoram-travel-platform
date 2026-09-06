import React, { useState } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import {
  Compass,
  BarChart3,
  MapPin,
  Calendar,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Search,
  ArrowUpRight,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function AdminLayout() {
  const location = useLocation()
  const { profile, user, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [globalSearch, setGlobalSearch] = useState("")

  const navItems = [
    { label: "Overview", href: "/admin", icon: <BarChart3 className="w-4 h-4" /> },
    { label: "Tours Catalog", href: "/admin/tours", icon: <MapPin className="w-4 h-4" /> },
    { label: "Bookings", href: "/admin/bookings", icon: <Calendar className="w-4 h-4" /> },
    { label: "Customers", href: "/admin/customers", icon: <Users className="w-4 h-4" /> },
    { label: "Reviews", href: "/admin/reviews", icon: <MessageSquare className="w-4 h-4" /> },
    { label: "Settings", href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
  ]

  // Extract page title from route
  const getPageTitle = () => {
    const current = navItems.find((item) => item.href === location.pathname)
    if (current) return current.label
    if (location.pathname.startsWith("/admin/tours/")) return "Tour Details"
    return "Operations Center"
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-300">
      {/* 1. Collapsible Admin Sidebar */}
      <aside
        className={`shrink-0 border-r border-border bg-card flex flex-col justify-between transition-all duration-300 z-30 sticky top-0 h-screen ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="space-y-6 p-4">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-2 border-b border-border/70">
            <Link to="/admin" className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-editorial-navy text-white flex items-center justify-center shrink-0 shadow-subtle">
                <Compass className="w-5 h-5 text-editorial-gold" />
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <span className="font-serif font-bold text-sm text-foreground block truncate">
                    Karakoram &amp; Co.
                  </span>
                  <span className="text-[9px] font-mono tracking-wider uppercase font-bold text-editorial-terracotta block -mt-0.5">
                    Operations Desk
                  </span>
                </div>
              )}
            </Link>

            {/* Collapse Toggle Button */}
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {!collapsed && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 py-1 block">
                Management
              </span>
            )}
            {navItems.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-editorial-navy text-white shadow-sm dark:bg-editorial-terracotta font-semibold"
                      : "text-foreground/75 hover:bg-muted hover:text-foreground"
                  } ${collapsed ? "justify-center" : ""}`}
                >
                  <span className={isActive ? "text-editorial-gold" : "text-editorial-terracotta"}>
                    {item.icon}
                  </span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Bottom Profile & Actions */}
        <div className="p-4 border-t border-border/70 space-y-3">
          <Link
            to="/"
            className={`flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-editorial-terracotta shrink-0" />
            {!collapsed && <span>View Public Site</span>}
          </Link>

          <div
            className={`flex items-center gap-3 p-2 rounded-2xl bg-muted/40 border border-border/60 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <Avatar className="h-8 w-8 shrink-0 border border-editorial-terracotta/40">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="bg-editorial-navy text-white text-xs font-serif">
                {profile?.full_name?.charAt(0) || "A"}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground truncate">
                  {profile?.full_name || "Admin Staff"}
                </p>
                <span className="text-[9.5px] uppercase font-mono font-semibold text-editorial-terracotta block">
                  Staff Clearance
                </span>
              </div>
            )}
            {!collapsed && (
              <button
                type="button"
                onClick={() => signOut()}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* 2. Main Administration Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-16 border-b border-border bg-background/90 backdrop-blur-md px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-serif font-bold text-foreground tracking-tight">
              {getPageTitle()}
            </h2>
            <span className="hidden sm:inline-block text-xs bg-editorial-terracotta/10 text-editorial-terracotta px-2 py-0.5 rounded-full font-mono font-medium">
              Live DB
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Global Search Bar */}
            <div className="relative hidden md:block w-64">
              <Input
                type="text"
                placeholder="Search bookings, tours..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="h-9 pl-9 pr-3 text-xs rounded-xl bg-card border-border"
              />
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
            </div>

            {/* Dark Mode Switcher */}
            <ThemeToggle />
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
