import anime from "animejs"
import React, { useState, useEffect, useRef } from "react"
import { Link, useLocation, Outlet } from "react-router-dom"
import {
  Compass,
  Menu,
  User,
  PhoneCall,
  Mail,
  Send,
  ArrowRight,
  ShieldCheck,
  BookmarkCheck,
  MapPin,
  Calendar,
  Sparkles,
} from "lucide-react"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/AuthContext"

export function PublicLayout({ children }: { children?: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [newsletterEmail, setNewsletterEmail] = useState("")
  const [newsletterSent, setNewsletterSent] = useState(false)
  const location = useLocation()
  const { user, profile, isAuthenticated, signOut } = useAuth()

  // Track scroll position for transparent -> frosted header transition
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newsletterEmail.trim()) {
      setNewsletterSent(true)
      setTimeout(() => {
        setNewsletterSent(false)
        setNewsletterEmail("")
      }, 4000)
    }
  }

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "All Tours", href: "/tours" },
    { label: "Destinations", href: "/destinations" },
    { label: "About Us", href: "/about" },
    { label: "Contact", href: "/contact" },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-500 selection:bg-editorial-terracotta selection:text-white">
      {/* 1. Top Pakistani Contact Utility Bar */}
      <div className="bg-editorial-navy text-white text-[11px] py-1.5 px-4 border-b border-white/10 hidden sm:block">
        <div className="container flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1.5 text-editorial-sand/90">
              <PhoneCall className="w-3 h-3 text-editorial-terracotta" />
              Direct Support: +92 300 8550123 / +92 51 2894000
            </span>
            <span className="text-white/20">|</span>
            <span className="text-editorial-sand/90">
              Islamabad HQ: F-7 Markaz &bull; Lahore: MM Alam Road
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs text-editorial-gold font-serif italic">
              کاراکورم اینڈ کو — پاکستان کی سیاحت کا مستند نام
            </span>
          </div>
        </div>
      </div>

      {/* 2. Sticky Editorial Navbar with Transparent/Frosted Glass Transition */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled
            ? "border-b border-border/80 bg-background/90 backdrop-blur-md shadow-subtle py-3"
            : "border-b border-border/40 bg-background/70 backdrop-blur-sm py-4"
        }`}
      >
        <div className="container flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-2xl bg-editorial-navy text-white flex items-center justify-center group-hover:bg-editorial-terracotta transition-all duration-300 shadow-subtle group-hover:rotate-6">
              <Compass className="w-5 h-5 text-editorial-gold" />
            </div>
            <div>
              <span className="font-serif text-2xl font-bold tracking-tight text-editorial-navy dark:text-foreground">
                Karakoram &amp; Co.
              </span>
              <span className="block text-[9.5px] tracking-widest uppercase text-muted-foreground font-sans -mt-1">
                Boutique Pakistan Expeditions
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8 text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`transition-colors py-1 relative ${
                    isActive
                      ? "text-editorial-terracotta font-semibold"
                      : "text-foreground/80 hover:text-editorial-terracotta"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span
                      ref={(el) => {
                        if (el) {
                          anime({
                            targets: el,
                            scaleX: [0, 1],
                            opacity: [0.3, 1],
                            duration: 350,
                            easing: "easeOutQuad",
                          })
                        }
                      }}
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-editorial-terracotta rounded-full origin-left"
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right Action Suite (Theme Toggle, Auth / Bookings Button, CTA, Mobile Drawer) */}
          <div className="flex items-center space-x-3">
            {/* Uiverse-adapted Celestial Dark Mode Toggle */}
            <ThemeToggle />

            {/* Real Auth State: Dropdown for Logged-In User or Sign In / Register Buttons */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 p-1 pl-2.5 pr-1.5 rounded-full border border-border/80 bg-card hover:bg-muted transition-colors text-xs font-semibold focus:outline-none"
                  >
                    <span className="hidden sm:inline-block truncate max-w-[110px]">
                      {profile?.full_name?.split(" ")[0] || "Traveler"}
                    </span>
                    <Avatar className="h-7 w-7 border border-editorial-terracotta/40">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback className="bg-editorial-navy text-white text-[11px] font-serif">
                        {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-card">
                  <DropdownMenuLabel className="font-normal px-2 py-1.5 border-b border-border/60">
                    <p className="font-serif text-sm font-bold text-foreground">
                      {profile?.full_name || "Traveler Account"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                    {profile?.role === "admin" && (
                      <span className="inline-block mt-1 text-[9.5px] uppercase tracking-wider font-mono font-bold bg-editorial-terracotta/15 text-editorial-terracotta px-1.5 py-0.5 rounded">
                        Administrator
                      </span>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center gap-2 cursor-pointer py-2">
                      <BookmarkCheck className="w-4 h-4 text-editorial-terracotta" />
                      <span>My Bookings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/wishlist" className="flex items-center gap-2 cursor-pointer py-2">
                      <Sparkles className="w-4 h-4 text-editorial-gold" />
                      <span>Saved Expeditions</span>
                    </Link>
                  </DropdownMenuItem>
                  {profile?.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2 cursor-pointer py-2 font-semibold text-editorial-navy dark:text-editorial-sand">
                        <ShieldCheck className="w-4 h-4 text-editorial-terracotta" />
                        <span>Staff Admin Portal</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="flex items-center gap-2 text-destructive cursor-pointer py-2 focus:bg-destructive/10 focus:text-destructive"
                  >
                    <User className="w-4 h-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-foreground/80 hover:text-foreground font-semibold text-xs h-9 px-3.5"
                  >
                    <span>Sign In</span>
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-border font-semibold text-xs h-9 px-3.5"
                  >
                    <span>Register</span>
                  </Button>
                </Link>
              </div>
            )}

            {/* Primary CTA */}
            <Link to="/tours" className="hidden sm:inline-flex">
              <Button
                variant="editorial"
                size="sm"
                className="rounded-full px-5 font-semibold text-xs shadow-subtle hover:shadow-md"
              >
                Plan Expedition
              </Button>
            </Link>

            {/* Mobile Sheet Navigation Drawer */}
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-muted"
                    aria-label="Open mobile navigation menu"
                  >
                    <Menu className="w-5 h-5 text-foreground" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[300px] sm:w-[360px] bg-card p-6 flex flex-col justify-between"
                >
                  <div className="space-y-6">
                    <SheetHeader className="text-left pb-4 border-b border-border">
                      <SheetTitle className="flex items-center gap-2.5 font-serif text-xl">
                        <Compass className="w-5 h-5 text-editorial-terracotta" />
                        <span>Karakoram &amp; Co.</span>
                      </SheetTitle>
                      <p className="text-xs text-muted-foreground font-sans">
                        Curated Pakistan &amp; Northern Expeditions
                      </p>
                    </SheetHeader>

                    <nav className="flex flex-col space-y-3 pt-2">
                      {navLinks.map((link) => (
                        <SheetClose asChild key={link.href}>
                          <Link
                            to={link.href}
                            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-muted/70 transition-colors"
                          >
                            <span>{link.label}</span>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          </Link>
                        </SheetClose>
                      ))}
                    </nav>

                    <div className="pt-4 border-t border-border space-y-2">
                      <SheetClose asChild>
                        <Link
                          to={isAuthenticated ? "/dashboard" : "/login"}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-muted/70 transition-colors"
                        >
                          <BookmarkCheck className="w-4 h-4 text-editorial-terracotta" />
                          <span>{isAuthenticated ? "My Bookings & Profile" : "Guest Sign In"}</span>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link
                          to="/admin"
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/70 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-editorial-navy dark:text-editorial-sand" />
                          <span>Staff Admin Portal</span>
                        </Link>
                      </SheetClose>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Appearance</span>
                      <ThemeToggle />
                    </div>
                    <SheetClose asChild>
                      <Link to="/tours" className="block w-full">
                        <Button variant="editorial" className="w-full rounded-full">
                          Explore Expeditions
                        </Button>
                      </Link>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">{children || <Outlet />}</main>

      {/* 3. Boutique Editorial Footer with Newsletter Subscription */}
      <footer className="border-t border-border bg-editorial-sand/40 dark:bg-card/70 mt-20 transition-colors">
        <div className="container py-16">
          {/* Top Newsletter Card */}
          <div className="p-8 md:p-12 rounded-3xl bg-editorial-navy text-white shadow-card mb-16 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-editorial-terracotta/20 rounded-full blur-3xl pointer-events-none" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 text-editorial-gold text-xs font-semibold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>The Karakoram Journal</span>
                </div>
                <h3 className="font-serif text-3xl font-bold tracking-tight">
                  Seasonal Departure Alerts &amp; Cultural Chronicles
                </h3>
                <p className="text-sm text-editorial-sand/80 max-w-md leading-relaxed">
                  Join 12,000+ discerning travelers. Receive insider guides to cherry blossom season in Hunza, autumn treks to Concordia, and private charter deals.
                </p>
              </div>

              <form onSubmit={handleNewsletterSubmit} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email address..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60 h-12 rounded-full px-5 focus-visible:ring-editorial-terracotta"
                  />
                  <Button
                    type="submit"
                    variant="editorial"
                    className="h-12 rounded-full px-7 shrink-0 font-semibold gap-2 shadow-md hover:shadow-lg"
                  >
                    <span>Subscribe</span>
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {newsletterSent ? (
                  <p className="text-xs text-emerald-300 font-medium animate-in fade-in">
                    Shukriya! You're subscribed to Karakoram &amp; Co. chronicles.
                  </p>
                ) : (
                  <p className="text-[11px] text-editorial-sand/60">
                    No spam ever. Unsubscribe at any time. Verified Pakistani expedition operator.
                  </p>
                )}
              </form>
            </div>
          </div>

          {/* Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            {/* Brand Information */}
            <div className="space-y-4 lg:col-span-2">
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl font-bold text-editorial-navy dark:text-foreground">
                  Karakoram &amp; Co.
                </span>
                <span className="text-xs text-editorial-gold font-serif italic">
                  کاراکورم اینڈ کو
                </span>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                Pakistan's premier boutique travel operator. Specializing in high-altitude treks, luxury family tours across Gilgit-Baltistan &amp; Kashmir, and executive Umrah services.
              </p>
              <div className="text-xs text-muted-foreground pt-2 space-y-1.5">
                <p className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-editorial-terracotta shrink-0" />
                  <span>Executive Heights, F-7 Markaz, Islamabad, Pakistan</span>
                </p>
                <p className="flex items-center gap-2">
                  <PhoneCall className="w-3.5 h-3.5 text-editorial-terracotta shrink-0" />
                  <span>+92 300 8550123 / +92 51 2894000</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-editorial-terracotta shrink-0" />
                  <span>concierge@karakoramco.pk</span>
                </p>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-serif text-sm font-semibold uppercase tracking-wider mb-4 text-foreground">
                Northern Areas
              </h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link to="/tours" className="hover:text-editorial-terracotta transition-colors">Hunza Valley &amp; Passu</Link></li>
                <li><Link to="/tours" className="hover:text-editorial-terracotta transition-colors">Skardu &amp; Shangrila</Link></li>
                <li><Link to="/tours" className="hover:text-editorial-terracotta transition-colors">Fairy Meadows &amp; Nanga Parbat</Link></li>
                <li><Link to="/tours" className="hover:text-editorial-terracotta transition-colors">Naran &amp; Saif-ul-Malook</Link></li>
                <li><Link to="/tours" className="hover:text-editorial-terracotta transition-colors">Deosai Plains Safari</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-serif text-sm font-semibold uppercase tracking-wider mb-4 text-foreground">
                Specialty Travel
              </h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link to="/tours" className="hover:text-editorial-terracotta transition-colors">K2 Base Camp Trek</Link></li>
                <li><Link to="/tours" className="hover:text-editorial-terracotta transition-colors">Executive Umrah Packages</Link></li>
                <li><Link to="/tours" className="hover:text-editorial-terracotta transition-colors">Honeymoon Chalets</Link></li>
                <li><Link to="/tours" className="hover:text-editorial-terracotta transition-colors">Swat Family Holidays</Link></li>
                <li><Link to="/tours" className="hover:text-editorial-terracotta transition-colors">Turkey &amp; Bosphorus</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-serif text-sm font-semibold uppercase tracking-wider mb-4 text-foreground">
                Portals &amp; Safety
              </h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link to="/dashboard" className="hover:text-editorial-terracotta transition-colors">Guest Dashboard</Link></li>
                <li><Link to="/admin" className="hover:text-editorial-terracotta transition-colors">Staff Admin Portal</Link></li>
                <li><Link to="/login" className="hover:text-editorial-terracotta transition-colors">Account Access</Link></li>
                <li className="pt-2 text-xs text-muted-foreground leading-normal">
                  <ShieldCheck className="w-4 h-4 text-editorial-terracotta inline mr-1" />
                  Dept. of Tourist Services (DTS) Reg #GL-4892.
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-8 border-t border-border/70 flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground gap-4">
            <p>
              &copy; {new Date().getFullYear()} Karakoram &amp; Co. All rights reserved. Prices strictly quoted in Pakistani Rupees (PKR).
            </p>
            <p className="font-serif italic text-foreground/80">
              Designed with intentionality, elegance, and warm Pakistani hospitality.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
