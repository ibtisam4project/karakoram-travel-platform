import React, { Suspense, lazy } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { Compass } from "lucide-react"
import { PublicLayout } from "@/layouts/PublicLayout"
import { UserLayout } from "@/layouts/UserLayout"
import { AdminLayout } from "@/layouts/AdminLayout"
import { ProtectedRoute } from "@/components/shared/ProtectedRoute"

// Fallback Route Loader matching brand identity
function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-background">
      <div className="space-y-3 text-center">
        <div className="w-10 h-10 rounded-full bg-editorial-navy text-white flex items-center justify-center mx-auto shadow-subtle animate-pulse">
          <Compass className="w-5 h-5 text-editorial-gold animate-spin [animation-duration:3s]" />
        </div>
        <p className="text-xs text-muted-foreground font-serif italic">
          Loading Karakoram manifest...
        </p>
      </div>
    </div>
  )
}

// 1. Public Pages (Lazy Loaded)
const HomePage = lazy(() =>
  import("@/pages/HomePage").then((m) => ({ default: m.HomePage }))
)
const ToursPage = lazy(() =>
  import("@/pages/ToursPage").then((m) => ({ default: m.ToursPage }))
)
const TourDetailPage = lazy(() =>
  import("@/pages/TourDetailPage").then((m) => ({ default: m.TourDetailPage }))
)
const DestinationsPage = lazy(() =>
  import("@/pages/DestinationsPage").then((m) => ({ default: m.DestinationsPage }))
)
const LoginPage = lazy(() =>
  import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage }))
)
const RegisterPage = lazy(() =>
  import("@/pages/RegisterPage").then((m) => ({ default: m.RegisterPage }))
)
const ForgotPasswordPage = lazy(() =>
  import("@/pages/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage }))
)
const ResetPasswordPage = lazy(() =>
  import("@/pages/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage }))
)

// 2. User Dashboard Pages (Lazy Loaded)
const UserDashboardOverview = lazy(() =>
  import("@/pages/UserDashboardOverview").then((m) => ({
    default: m.UserDashboardOverview,
  }))
)
const UserBookingsPage = lazy(() =>
  import("@/pages/UserBookingsPage").then((m) => ({ default: m.UserBookingsPage }))
)
const UserWishlistPage = lazy(() =>
  import("@/pages/UserWishlistPage").then((m) => ({ default: m.UserWishlistPage }))
)
const UserProfilePage = lazy(() =>
  import("@/pages/UserProfilePage").then((m) => ({ default: m.UserProfilePage }))
)

// 3. Admin Dashboard Pages (Lazy Loaded - keeps heavy recharts separate)
const AdminOverviewPage = lazy(() =>
  import("@/pages/AdminOverviewPage").then((m) => ({ default: m.AdminOverviewPage }))
)
const AdminToursPage = lazy(() =>
  import("@/pages/admin/AdminToursPage").then((m) => ({ default: m.AdminToursPage }))
)
const AdminBookingsPage = lazy(() =>
  import("@/pages/admin/AdminBookingsPage").then((m) => ({
    default: m.AdminBookingsPage,
  }))
)
const AdminCustomersPage = lazy(() =>
  import("@/pages/admin/AdminCustomersPage").then((m) => ({
    default: m.AdminCustomersPage,
  }))
)
const AdminReviewsPage = lazy(() =>
  import("@/pages/admin/AdminReviewsPage").then((m) => ({
    default: m.AdminReviewsPage,
  }))
)
const AdminSettingsPage = lazy(() =>
  import("@/pages/admin/AdminSettingsPage").then((m) => ({
    default: m.AdminSettingsPage,
  }))
)

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* 1. Public Marketing & Booking Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/tours" element={<ToursPage />} />
          <Route path="/tours/:slug" element={<TourDetailPage />} />
          <Route path="/destinations" element={<DestinationsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* 2. Logged-in User Dashboard Routes (Protected) */}
        <Route element={<ProtectedRoute adminOnly={false} />}>
          <Route path="/dashboard" element={<UserLayout />}>
            <Route index element={<UserDashboardOverview />} />
            <Route path="bookings" element={<UserBookingsPage />} />
            <Route path="wishlist" element={<UserWishlistPage />} />
            <Route path="profile" element={<UserProfilePage />} />
          </Route>
        </Route>

        {/* 3. Admin Dashboard Routes (Protected, adminOnly=true) */}
        <Route element={<ProtectedRoute adminOnly={true} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="tours" element={<AdminToursPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
            <Route path="customers" element={<AdminCustomersPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
