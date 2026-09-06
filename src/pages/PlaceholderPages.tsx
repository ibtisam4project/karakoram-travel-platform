import { Link, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"

export function ToursPage() {
  return (
    <div className="container py-12 space-y-6">
      <h1 className="text-4xl font-serif font-bold">All Expeditions</h1>
      <p className="text-muted-foreground">Full filters and tour discovery page (wired in Phase 3).</p>
      <Link to="/"><Button variant="outline">Back to Home</Button></Link>
    </div>
  )
}

export function TourDetailPage() {
  const { slug } = useParams()
  return (
    <div className="container py-12 space-y-6">
      <span className="text-xs uppercase font-mono tracking-widest text-editorial-terracotta">Expedition Detail</span>
      <h1 className="text-4xl font-serif font-bold">Expedition: {slug}</h1>
      <p className="text-muted-foreground">Full itinerary, gallery, reviews, and live seat booking (Phase 3 &amp; 4).</p>
      <Link to="/"><Button variant="outline">Back to Home</Button></Link>
    </div>
  )
}

export function DestinationsPage() {
  return (
    <div className="container py-12 space-y-6">
      <h1 className="text-4xl font-serif font-bold">Destinations of Pakistan</h1>
      <p className="text-muted-foreground">Hunza, Skardu, Fairy Meadows, Chitral, Swat, and Makran Coast.</p>
      <Link to="/"><Button variant="outline">Back to Home</Button></Link>
    </div>
  )
}

export function LoginPage() {
  return (
    <div className="container max-w-md py-16 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-serif font-bold">Welcome Back</h1>
        <p className="text-sm text-muted-foreground">Access your booking dashboard and saved trips.</p>
      </div>
      <div className="p-6 border border-border rounded-2xl bg-card space-y-4">
        <p className="text-xs text-muted-foreground">Authentication flows (Email/Password, Magic Link, OAuth) fully active in Phase 2.</p>
        <Link to="/dashboard">
          <Button variant="editorial" className="w-full">Preview Guest Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}

export function RegisterPage() {
  return (
    <div className="container max-w-md py-16 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-serif font-bold">Begin Your Journey</h1>
        <p className="text-sm text-muted-foreground">Create your guest account with Caravan &amp; Peak.</p>
      </div>
    </div>
  )
}

export function UserDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">My Bookings</h1>
          <p className="text-sm text-muted-foreground">Manage your confirmed and upcoming expeditions.</p>
        </div>
      </div>
      <div className="p-8 border border-dashed border-border rounded-2xl text-center">
        <p className="text-sm text-muted-foreground">User dashboard views, booking cancellations, and profile editor wired in Phase 4.</p>
      </div>
    </div>
  )
}

export function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">Staff Overview</h1>
          <p className="text-sm text-muted-foreground">Business analytics, booking velocity, and departures.</p>
        </div>
      </div>
      <div className="p-8 border border-dashed border-border rounded-2xl text-center">
        <p className="text-sm text-muted-foreground">Admin analytics with Recharts, KPI cards, and tour management wired in Phase 5.</p>
      </div>
    </div>
  )
}
