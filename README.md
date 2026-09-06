# Karakoram & Co. (کاراکورم اینڈ کو) — Travel & Tour Booking Platform

A portfolio-grade, production-quality luxury expedition and tour booking platform designed for Pakistan's northern frontiers (Karakorams, Himalayas, and Hindu Kush) and select international spiritual hubs.

Built with **React 19**, **TypeScript**, **Vite 8**, **Tailwind CSS**, **shadcn/ui**, and powered by **Supabase** (PostgreSQL, Authentication, Storage, and Realtime WebSockets). All pricing is strictly localized in **Pakistani Rupees (PKR)**.

---

## 🏔️ 1. Project Overview & Brand Identity

- **Brand Name**: Karakoram & Co. (*کاراکورم اینڈ کو*)
- **Tagline**: Curated Pakistan & International Expeditions
- **Headquarters**: F-7 Markaz, Islamabad, Pakistan &bull; DTS License: `DTS-PK-10882`
- **Design System**: Warm editorial elegance inspired by alpine mountaineering journals.
  - **Color Palette**: Deep Ocean Navy (`#0B3B4B`), Warm Terracotta (`#E07A5F`), Soft Sand (`#F4EDE4`), Muted Pine (`#2A9D8F`), and Summit Gold (`#DDA15E`).
  - **Typography**: `Playfair Display` (editorial serif headlines) paired with `Plus Jakarta Sans` (clean modern body) and `JetBrains Mono` (reference codes and manifests).
  - **Dark Mode**: Fully supported with smooth transitions and persistent state.

---

## 🛠️ 2. Technology Stack

- **Frontend Core**: React 19, TypeScript, Vite 8 (with Rolldown engine and ESM route chunking).
- **Styling & UI Components**: Tailwind CSS, shadcn/ui primitives, Radix UI primitives (`Dialog`, `DropdownMenu`, `Tabs`, `Select`, `Slider`, `Sheet`, `Checkbox`, `RadioGroup`).
- **Icons & Visuals**: Lucide React, Framer Motion (animated count-up counters and micro-interactions), Sonner (editorial toast alerts).
- **Data Visualizations**: Recharts (7-day revenue/bookings area chart and category demand bar chart).
- **Backend & Cloud (Supabase)**:
  - **PostgreSQL Database**: Relational schema with foreign keys, checks, and cascade rules.
  - **Authentication**: Email & password authentication, profile synchronization triggers, and role-based clearance.
  - **Row Level Security (RLS)**: Cryptographically verified policies, non-spoofable admin clearance, and role escalation protection triggers.
  - **Storage**: `tour-images` (public read, admin write) and `avatars` (user-scoped write).
  - **Supabase Realtime**: WebSocket logical replication on `tour_availability` and `bookings` tables for zero-polling live updates.

---

## 🌟 3. Platform Architecture & Features

The platform spans three distinct, interconnected surfaces:

### A. Public Discovery & Booking Frontend
- **Hero & Expedition Search**: Search bar with destination, date range, and traveler count filters linking directly to pre-filtered search results.
- **Curated Discoveries**: Featured expeditions carousel, popular destination hubs with live tour counts, and authentic verified traveler testimonials.
- **Comprehensive Tour Filters (`/tours`)**: Multi-dimensional filtering by destination, category, PKR price slider, duration, and minimum rating, with URL search params synchronization.
- **Expedition Detail Page (`/tours/:slug`)**:
  - AI photographic gallery with lightbox and high-resolution mountain landscapes.
  - Key facts quick bar (duration, group size, guide accreditation, starting rate in PKR).
  - Tabbed dossier: Narrative Overview, Vertical Interactive Itinerary Timeline, Included/Excluded logistics, and verified traveler reviews.
  - **Interactive Month Availability Calendar**: Color-coded seat badges (Plenty `>5`, Filling Up `3-5`, Almost Full `1-2`, Sold Out) synced live via WebSockets.
  - **Real-Time Urgency Indicator**: Live counter of bookings placed today and total seasonal seats remaining.
  - **Multi-Step Booking Modal**:
    - Step 1: Expedition summary and departure date confirmation.
    - Step 2: Traveler details with Pakistani CNIC/Passport and phone validation (`+92 3XX XXXXXXX`).
    - Step 3: Localized payment gateway selector (JazzCash, EasyPaisa, 1Link/Raast, Bank Wire).
    - Step 4: Instant booking reference generation (e.g. `KCO-849102`) with invoice breakdown.

### B. Authenticated Traveler Dashboard (`/dashboard`)
- **Dashboard Overview (`/dashboard`)**: Welcome header, stat cards (upcoming vs past trips, saved tours), and quick shortcuts.
- **My Reservations (`/dashboard/bookings`)**: Comprehensive reservation list with status badges (`pending`, `confirmed`, `completed`, `cancelled`), reference codes, and a confirmed **Cancel Booking** workflow that atomically returns reserved seats back to the departure calendar.
- **Saved Expeditions (`/dashboard/wishlist`)**: Interactive heart-saved wishlist persisted live in Supabase.
- **Guest Profile (`/dashboard/profile`)**: Contact details, emergency phone number, and preferences.

### C. Operations Administration Portal (`/admin`)
- **Protected Clearance**: Guarded by `<ProtectedRoute adminOnly={true} />`. Non-admin accounts receive a styled 403 Forbidden screen.
- **Collapsible Admin Navigation**: Sidebar with quick-access links, active states, staff avatar, dark mode switch, and storefront toggle.
- **Real-Time Analytics Overview (`/admin`)**:
  - Live KPI cards with Framer Motion animated number count-ups: Total Revenue in PKR, Total Bookings, Active Expeditions, and Departures this week.
  - Recharts Area Chart: 7-day revenue (PKR) and booking volume trends.
  - Recharts Bar Chart: Expedition demand breakdown by category.
  - Operational Widgets: Recent bookings table and Inventory Capacity Alerts ($\le 4$ seats left).
- **Expedition Package CRUD (`/admin/tours`)**:
  - Reusable `DataTable` with sortable columns, category filters, text search, pagination, and mobile card collapse.
  - Inline active toggle switch (`is_active`) with optimistic UI updates.
  - **Tour Creation & Edit Dialog**:
    - General Info: Title, auto-slug generator, category, duration, PKR pricing, group size, and destination selector (with inline "+ Add Destination" modal).
    - Media Gallery: Multi-image file uploader directly into the `tour-images` Supabase Storage bucket, with reordering (Set Cover, Move Left/Right) and image deletion.
    - Day-by-Day Itinerary Builder: Dynamic stages with stage titles, route notes, hotel stays, and included meals.
  - **Departure Calendar Manager**: Add departure dates, adjust total seat inventory, view booked vs remaining seats, and toggle `open`/`closed` statuses.
- **Bookings Manifest (`/admin/bookings`)**:
  - Full reservation list with status filters (`pending`, `confirmed`, `completed`, `cancelled`).
  - Guest dossier modal displaying CNIC, email, phone, and dietary notes.
  - Status mutation workflows with atomic seat inventory synchronization (cancelling releases seats; confirming allocates seats).
  - **Supabase Realtime Live Feed**: Automatically displays incoming bookings placed in other sessions without refreshing.
- **Customer & Access Directory (`/admin/customers`)**:
  - Customer directory with lifetime spend in PKR and reservation history.
  - Security role elevation (promote to Administrator or demote to Traveler) protected by a confirmation dialog.
- **Review Moderation Console (`/admin/reviews`)**:
  - Star rating filter and comment search.
  - Moderation action to delete inappropriate reviews with confirmation dialogs.
- **Brand & Platform Settings (`/admin/settings`)**:
  - Legal credentials, DTS registration, and monetary conventions locked to PKR.

---

## ⚡ 4. Advanced Real-Time Engine (Supabase Realtime)

The application implements genuine WebSocket logical replication via Supabase Realtime across all surfaces without polling:

1. **Guest Availability Calendar**:
   - Subscribes to `postgres_changes` on `public.tour_availability` scoped to `tour_id=eq.{tourId}`.
   - When any traveler books a seat in another tab or window, the seat badge on the calendar updates immediately from e.g. `8 left` to `6 left`.
2. **Mid-Session Sell-Out Detection**:
   - If a traveler selects a departure that sells out while they are viewing it, the platform automatically unselects the date and displays an urgent alert:
     > *"This departure date just sold out — please pick another"*
3. **Operations Live Booking Stream**:
   - Staff on `/admin/bookings` listen to `postgres_changes` on `bookings`. New guest bookings appear at the top of the table in real time with an audio/visual toast alert.
4. **Leak-Free Resource Cleanup**:
   - All subscriptions call `supabase.removeChannel(channel)` upon component unmounting.

---

## 🔒 5. Security & Row Level Security (RLS)

All database operations are governed by PostgreSQL Row Level Security:

- **Non-Spoofable Administrator Clearance (`public.is_admin()`)**:
  Extracts `auth.uid()` from the cryptographically verified JWT and checks the user's role in `public.profiles`. Client headers or local storage modifications cannot spoof the admin role.
- **Column-Level Role Escalation Protection Trigger (`tr_protect_profile_role`)**:
  A PostgreSQL `BEFORE UPDATE` trigger function on `public.profiles` aborts any transaction where a non-admin attempts to mutate the `role` column.
- **Atomic Seat Synchronization Trigger (`tr_sync_booking_seats`)**:
  A PostgreSQL trigger on `public.bookings` automatically increments or restores seats on `public.tour_availability`, preventing race conditions.
- **Storage Lockdown**:
  `tour-images` requires `public.is_admin() = true` for uploads, while `avatars` is scoped strictly to the authenticated user's ID directory (`(storage.foldername(name))[1] = auth.uid()::text`).

Full policy documentation is available in [`SECURITY.md`](./SECURITY.md).

---

## 🚀 6. Database Setup Instructions (Supabase)

To set up a fresh Supabase project:

1. Create a new project at [database.new](https://database.new).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Execute the 4 migration scripts in order:
   - `supabase/migrations/20260903000001_create_travel_platform_schema.sql` (Creates core schema, initial destinations, tours in PKR, and storage buckets)
   - `supabase/migrations/20260903000002_add_featured_and_seed_reviews.sql` (Adds featured flags and seeds verified Pakistani guest reviews)
   - `supabase/migrations/20260905000003_admin_crud_and_storage_policies.sql` (Admin helper functions and initial policies)
   - `supabase/migrations/20260905000004_production_rls_lockdown.sql` (Production RLS lockdown, escalation trigger, and atomic seat sync)

---

## 💻 7. Local Development Setup

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### Installation
```bash
# 1. Clone the repository
git clone <repo-url>
cd first-react-project

# 2. Install dependencies
npm install

# 3. Create .env file with your Supabase credentials
cp .env.example .env
```

### Environment Variables (`.env`)
```env
VITE_SUPABASE_URL=https://your-supabase-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Running Locally
```bash
# Start Vite development server
npm run dev

# Run clean production build verification
npm run build

# Preview production build locally
npm run preview
```

The application runs on `http://localhost:5173/`.

---

## 🌐 8. Deployment Guide (Vercel)

Vercel is the recommended hosting platform for this Vite + React SPA due to its global edge CDN, automatic Brotli/Gzip compression, and instant client-side routing support.

1. Push your repository to GitHub or GitLab.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New Project** and import the repository.
3. In **Project Settings**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL`: `https://hcdfvdrttxiywcvggvgq.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `<your_anon_key>`
5. Click **Deploy**. Vercel uses the included [`vercel.json`](./vercel.json) to handle SPA fallback rewrites (`/* -> /index.html`) and static asset caching.

---

## 👥 9. Demo Personas & Evaluation Credentials

For evaluation and testing, the following credentials can be used:

### Persona 1: Staff Administrator
- **Email**: `admin@karakoram.co`
- **Password**: `Karakoram2026!`
- **Role**: `admin`
- **Capabilities**: Full access to `/admin`, KPI analytics, creating/editing tours, uploading photos to `tour-images`, managing departure seat capacities, changing booking statuses, and moderating reviews.

### Persona 2: Registered Traveler
- **Email**: `traveler@karakoram.co`
- **Password**: `Traveler2026!`
- **Role**: `user`
- **Capabilities**: Can book expeditions on the live availability calendar, view personal reservations in `/dashboard/bookings`, cancel reservations (restores departure seats), and manage wishlist items. Attempting to access `/admin` triggers a 403 Forbidden screen.

### Persona 3: Anonymous Visitor
- **URL**: `/`
- **Capabilities**: Can browse all active tours, view interactive itinerary timelines, test search filters, view the live seat availability calendar, and view guest reviews. Prompted to sign in upon clicking "Book Expedition".
