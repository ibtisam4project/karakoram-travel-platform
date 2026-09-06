import { Link, Outlet, useLocation } from "react-router-dom"
import {
  Compass,
  LayoutDashboard,
  BookmarkCheck,
  Heart,
  User,
  LogOut,
  ShieldCheck,
  ChevronRight,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function UserLayout() {
  const location = useLocation()
  const { profile, user, signOut, isAdmin } = useAuth()

  const navItems = [
    { label: "Dashboard Overview", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: "My Bookings", href: "/dashboard/bookings", icon: <BookmarkCheck className="w-4 h-4" /> },
    { label: "Saved Expeditions", href: "/dashboard/wishlist", icon: <Heart className="w-4 h-4" /> },
    { label: "Profile & Settings", href: "/dashboard/profile", icon: <User className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-2xl bg-editorial-navy text-white flex items-center justify-center group-hover:bg-editorial-terracotta transition-colors shadow-subtle">
              <Compass className="w-5 h-5 text-editorial-gold" />
            </div>
            <div>
              <span className="font-serif text-lg font-bold text-foreground">Karakoram &amp; Co.</span>
              <span className="block text-[9px] uppercase tracking-widest text-muted-foreground -mt-1">
                Guest Headquarters
              </span>
            </div>
          </Link>

          <div className="flex items-center space-x-3">
            <span className="text-[11px] bg-editorial-sand text-editorial-navy dark:bg-muted dark:text-editorial-sand px-3 py-1 rounded-full font-semibold hidden sm:inline-block">
              {profile?.full_name || "Verified Traveler"}
            </span>

            <ThemeToggle />

            <Link to="/">
              <Button variant="ghost" size="sm" className="text-xs h-9">
                Return to Site
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Main Content Grid with Responsive Sidebar / Mobile Tabs */}
      <div className="container flex-1 py-8 flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Nav (Desktop & Tablet) */}
        <aside className="w-full md:w-64 shrink-0 space-y-4 sticky md:top-24">
          {/* User ID Card */}
          <div className="p-5 rounded-3xl border border-border bg-card shadow-subtle space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-editorial-terracotta/40">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-editorial-navy text-white font-serif text-base">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "T"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h4 className="font-serif font-bold text-sm text-foreground truncate">
                  {profile?.full_name || "Traveler Account"}
                </h4>
                <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                {isAdmin && (
                  <span className="inline-block text-[9px] uppercase font-mono font-bold text-editorial-terracotta bg-editorial-terracotta/10 px-1.5 py-0.2 rounded mt-0.5">
                    Admin Clearance
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 rounded-3xl border border-border bg-card shadow-subtle space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 py-2 block">
              Expedition Portals
            </span>
            {navItems.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-editorial-navy text-white shadow-sm dark:bg-editorial-terracotta"
                      : "text-foreground/80 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? "text-editorial-gold" : "text-editorial-terracotta"}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
                </Link>
              )
            })}

            {isAdmin && (
              <div className="pt-2 mt-2 border-t border-border">
                <Link
                  to="/admin"
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-editorial-navy dark:text-editorial-sand hover:bg-muted transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-editorial-terracotta" />
                  <span>Staff Admin Operations</span>
                </Link>
              </div>
            )}

            <div className="pt-2 mt-2 border-t border-border">
              <button
                type="button"
                onClick={() => signOut()}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-destructive hover:bg-destructive/10 w-full transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Dynamic Nested Route View */}
        <main className="flex-1 min-w-0 w-full">
          <Outlet />
        </main>
      </div>

      {/* 3. Mobile Bottom Floating Nav Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-md border-t border-border p-2 shadow-floating">
        <div className="grid grid-cols-4 gap-1 text-center">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                  isActive
                    ? "text-editorial-terracotta font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.icon}
                <span className="truncate max-w-[65px]">{item.label.split(" ")[0]}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
