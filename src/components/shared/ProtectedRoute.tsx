import React from "react"
import { Navigate, Outlet, useLocation, Link } from "react-router-dom"
import { ShieldAlert, Compass, ArrowRight, LogIn } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

export const ProtectedRoute: React.FC<{ adminOnly?: boolean }> = ({
  adminOnly = false,
}) => {
  const { isAuthenticated, isAdmin, isLoading, user } = useAuth()
  const location = useLocation()

  // 1. Loading State while checking Supabase auth session
  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 bg-background">
        <div className="space-y-4 w-full max-w-md text-center">
          <div className="w-10 h-10 rounded-full bg-editorial-navy text-white flex items-center justify-center mx-auto shadow-subtle animate-pulse">
            <Compass className="w-5 h-5 text-editorial-gold animate-spin [animation-duration:3s]" />
          </div>
          <p className="text-xs text-muted-foreground font-serif italic">
            Verifying expedition credentials...
          </p>
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  // 2. Unauthenticated user: Redirect to login with original path in state
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 3. Authenticated Non-Admin trying to access admin surface: Render clean 403 Forbidden State
  if (adminOnly && !isAdmin) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full p-8 rounded-3xl border border-destructive/30 bg-card text-center space-y-5 shadow-card">
          <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive mx-auto flex items-center justify-center border border-destructive/20">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-destructive">
              Access Restricted (403)
            </span>
            <h3 className="font-serif text-2xl font-bold text-foreground">
              Staff Portal Clearance Required
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your account (<code>{user.email}</code>) is registered as a traveler and does not possess administrator clearance for operational manifests.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/dashboard">
              <Button variant="editorial" size="sm" className="rounded-xl w-full sm:w-auto text-xs">
                Go to Guest Dashboard
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" size="sm" className="rounded-xl w-full sm:w-auto text-xs">
                Return to Site
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // 4. Authorized: Render child routes
  return <Outlet />
}
