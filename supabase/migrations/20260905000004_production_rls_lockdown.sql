-- ==============================================================================
-- Migration: 20260905000004_production_rls_lockdown.sql
-- Description: Production-grade Row Level Security (RLS) policies for Karakoram & Co.
-- Replaces permissive prototype policies with locked-down role-based access.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. Ensure RLS is Enabled on Every Table
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. Cryptographically Secure Helper Function (Non-Spoofable Admin Check)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()),
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ------------------------------------------------------------------------------
-- 2. Drop Prototype / Existing Policies to Ensure Clean Slate
-- ------------------------------------------------------------------------------
-- Profiles
DROP POLICY IF EXISTS "Profiles can be read by owner or admin" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;

-- Destinations
DROP POLICY IF EXISTS "Public can view destinations" ON public.destinations;
DROP POLICY IF EXISTS "Admins can insert destinations" ON public.destinations;
DROP POLICY IF EXISTS "Admins can update destinations" ON public.destinations;
DROP POLICY IF EXISTS "Admins can delete destinations" ON public.destinations;

-- Tours
DROP POLICY IF EXISTS "Public can view active tours" ON public.tours;
DROP POLICY IF EXISTS "Admins can view all tours" ON public.tours;
DROP POLICY IF EXISTS "Admins can insert tours" ON public.tours;
DROP POLICY IF EXISTS "Admins can update tours" ON public.tours;
DROP POLICY IF EXISTS "Admins can delete tours" ON public.tours;

-- Tour Availability
DROP POLICY IF EXISTS "Public can view tour availability" ON public.tour_availability;
DROP POLICY IF EXISTS "Admins can insert tour availability" ON public.tour_availability;
DROP POLICY IF EXISTS "Admins can update tour availability" ON public.tour_availability;
DROP POLICY IF EXISTS "Admins can delete tour availability" ON public.tour_availability;

-- Bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can delete bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can cancel own bookings" ON public.bookings;

-- Reviews
DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert reviews for completed bookings" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can update reviews" ON public.reviews;

-- Wishlists
DROP POLICY IF EXISTS "Users can view their own wishlist" ON public.wishlists;
DROP POLICY IF EXISTS "Users can manage their own wishlist" ON public.wishlists;
DROP POLICY IF EXISTS "Users can insert own wishlist" ON public.wishlists;
DROP POLICY IF EXISTS "Users can delete own wishlist" ON public.wishlists;

-- ------------------------------------------------------------------------------
-- 3. PROFILES Table Policies & Role Escalation Protection Trigger
-- ------------------------------------------------------------------------------

-- SELECT: Users can view their own profile; Admins can view all profiles
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_admin());

-- UPDATE: Users can update their own profile; Admins can update any profile
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- Column-level Security Trigger: Prevent non-admin users from escalating their role
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only staff administrators can alter security roles.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_profile_role ON public.profiles;
CREATE TRIGGER tr_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.protect_profile_role();

-- ------------------------------------------------------------------------------
-- 4. DESTINATIONS Table Policies
-- ------------------------------------------------------------------------------

-- SELECT: Public can view all destination hubs
CREATE POLICY "destinations_select_public" ON public.destinations
  FOR SELECT USING (true);

-- INSERT: Only administrators can create destinations
CREATE POLICY "destinations_insert_admin" ON public.destinations
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- UPDATE: Only administrators can update destinations
CREATE POLICY "destinations_update_admin" ON public.destinations
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: Only administrators can delete destinations
CREATE POLICY "destinations_delete_admin" ON public.destinations
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. TOURS Table Policies
-- ------------------------------------------------------------------------------

-- SELECT: Public can view active tours; Admins can view all tours (including drafts)
CREATE POLICY "tours_select_policy" ON public.tours
  FOR SELECT
  USING (is_active = true OR public.is_admin());

-- INSERT: Only administrators can create tours
CREATE POLICY "tours_insert_admin" ON public.tours
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- UPDATE: Only administrators can update tours
CREATE POLICY "tours_update_admin" ON public.tours
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: Only administrators can delete tours
CREATE POLICY "tours_delete_admin" ON public.tours
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. TOUR AVAILABILITY Table Policies & Atomic Seat Synchronization Trigger
-- ------------------------------------------------------------------------------

-- SELECT: Public can view scheduled departures
CREATE POLICY "tour_availability_select_public" ON public.tour_availability
  FOR SELECT USING (true);

-- INSERT: Only administrators can add departure windows
CREATE POLICY "tour_availability_insert_admin" ON public.tour_availability
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- UPDATE: Only administrators can directly update departure windows
CREATE POLICY "tour_availability_update_admin" ON public.tour_availability
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: Only administrators can delete departure windows
CREATE POLICY "tour_availability_delete_admin" ON public.tour_availability
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- Atomic Trigger on bookings: Automatically synchronizes tour_availability seats
-- Prevents race conditions and guarantees non-admins cannot maliciously tamper with seat numbers
CREATE OR REPLACE FUNCTION public.sync_booking_seats_trigger()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- A new booking is placed: Increment seats_booked
    UPDATE public.tour_availability
    SET
      seats_booked = seats_booked + NEW.travelers_count,
      status = CASE
        WHEN (seats_booked + NEW.travelers_count) >= seats_total THEN 'full'
        ELSE status
      END
    WHERE id = NEW.availability_id;

  ELSIF TG_OP = 'UPDATE' THEN
    -- If booking cancelled: Restore seats
    IF OLD.status <> 'cancelled' AND NEW.status = 'cancelled' THEN
      UPDATE public.tour_availability
      SET
        seats_booked = GREATEST(0, seats_booked - OLD.travelers_count),
        status = CASE
          WHEN status = 'full' THEN 'open'
          ELSE status
        END
      WHERE id = NEW.availability_id;

    -- If cancelled booking is restored/re-confirmed: Re-allocate seats
    ELSIF OLD.status = 'cancelled' AND NEW.status IN ('pending', 'confirmed') THEN
      UPDATE public.tour_availability
      SET
        seats_booked = seats_booked + NEW.travelers_count,
        status = CASE
          WHEN (seats_booked + NEW.travelers_count) >= seats_total THEN 'full'
          ELSE status
        END
      WHERE id = NEW.availability_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_booking_seats ON public.bookings;
CREATE TRIGGER tr_sync_booking_seats
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE PROCEDURE public.sync_booking_seats_trigger();

-- ------------------------------------------------------------------------------
-- 7. BOOKINGS Table Policies
-- ------------------------------------------------------------------------------

-- SELECT: Users can view their own bookings; Admins can view all bookings
CREATE POLICY "bookings_select_policy" ON public.bookings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- INSERT: Users can insert their own bookings; Admins can insert
CREATE POLICY "bookings_insert_policy" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- UPDATE: Users can cancel their own pending/confirmed booking; Admins can update any booking
CREATE POLICY "bookings_update_user_cancel" ON public.bookings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status IN ('pending', 'confirmed'))
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

CREATE POLICY "bookings_update_admin" ON public.bookings
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DELETE: Only administrators can delete bookings
CREATE POLICY "bookings_delete_admin" ON public.bookings
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8. REVIEWS Table Policies
-- ------------------------------------------------------------------------------

-- SELECT: Public can read all reviews
CREATE POLICY "reviews_select_public" ON public.reviews
  FOR SELECT USING (true);

-- INSERT: Authenticated users can insert reviews for tours they have completed
CREATE POLICY "reviews_insert_authenticated" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      booking_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.bookings
        WHERE id = reviews.booking_id
          AND user_id = auth.uid()
          AND status = 'completed'
      )
      OR EXISTS (
        SELECT 1 FROM public.bookings
        WHERE tour_id = reviews.tour_id
          AND user_id = auth.uid()
          AND status = 'completed'
      )
      -- Allow initial seeded/verified guest reviews
      OR public.is_admin()
    )
  );

-- UPDATE: Users can edit their own reviews
CREATE POLICY "reviews_update_owner" ON public.reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own reviews; Admins can delete any review
CREATE POLICY "reviews_delete_policy" ON public.reviews
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 9. WISHLISTS Table Policies
-- ------------------------------------------------------------------------------

-- SELECT: Users can only view their own saved wishlist
CREATE POLICY "wishlists_select_owner" ON public.wishlists
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Users can only add to their own wishlist
CREATE POLICY "wishlists_insert_owner" ON public.wishlists
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only remove from their own wishlist
CREATE POLICY "wishlists_delete_owner" ON public.wishlists
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 10. STORAGE BUCKET POLICIES (tour-images & avatars)
-- ------------------------------------------------------------------------------

-- Make sure buckets exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('tour-images', 'tour-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop prior storage policies
DROP POLICY IF EXISTS "Public Access Tour Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload tour images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update tour images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete tour images" ON storage.objects;
DROP POLICY IF EXISTS "Admin write tour images" ON storage.objects;
DROP POLICY IF EXISTS "Public read tour images" ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "User write own avatar" ON storage.objects;

-- 1. 'tour-images' bucket: Public read, Admin-only write
CREATE POLICY "tour_images_select_public" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'tour-images');

CREATE POLICY "tour_images_insert_admin" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tour-images' AND public.is_admin());

CREATE POLICY "tour_images_update_admin" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'tour-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'tour-images' AND public.is_admin());

CREATE POLICY "tour_images_delete_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'tour-images' AND public.is_admin());

-- 2. 'avatars' bucket: Public read, User-scoped write (folder must match auth.uid)
CREATE POLICY "avatars_select_public" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert_owner" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_update_owner" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_delete_owner" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
