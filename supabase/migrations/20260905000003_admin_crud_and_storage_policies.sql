-- ==============================================================================
-- Migration: 20260905000003_admin_crud_and_storage_policies.sql
-- Enables full Administrative CRUD access and Storage upload for Karakoram & Co.
-- ==============================================================================

-- Helper function to check if current authenticated user is an administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 1. Tours RLS Policies
-- ------------------------------------------------------------------------------
-- Allow admins to view all tours (even draft/inactive ones)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all tours' AND tablename = 'tours') THEN
    CREATE POLICY "Admins can view all tours" ON public.tours
      FOR SELECT USING (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert tours' AND tablename = 'tours') THEN
    CREATE POLICY "Admins can insert tours" ON public.tours
      FOR INSERT WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update tours' AND tablename = 'tours') THEN
    CREATE POLICY "Admins can update tours" ON public.tours
      FOR UPDATE USING (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete tours' AND tablename = 'tours') THEN
    CREATE POLICY "Admins can delete tours" ON public.tours
      FOR DELETE USING (public.is_admin());
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. Tour Availability RLS Policies
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert tour availability' AND tablename = 'tour_availability') THEN
    CREATE POLICY "Admins can insert tour availability" ON public.tour_availability
      FOR INSERT WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update tour availability' AND tablename = 'tour_availability') THEN
    CREATE POLICY "Admins can update tour availability" ON public.tour_availability
      FOR UPDATE USING (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete tour availability' AND tablename = 'tour_availability') THEN
    CREATE POLICY "Admins can delete tour availability" ON public.tour_availability
      FOR DELETE USING (public.is_admin());
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. Bookings RLS Policies
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all bookings' AND tablename = 'bookings') THEN
    CREATE POLICY "Admins can view all bookings" ON public.bookings
      FOR SELECT USING (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update all bookings' AND tablename = 'bookings') THEN
    CREATE POLICY "Admins can update all bookings" ON public.bookings
      FOR UPDATE USING (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete bookings' AND tablename = 'bookings') THEN
    CREATE POLICY "Admins can delete bookings" ON public.bookings
      FOR DELETE USING (public.is_admin());
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. Profiles RLS Policies
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all profiles' AND tablename = 'profiles') THEN
    CREATE POLICY "Admins can view all profiles" ON public.profiles
      FOR SELECT USING (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update any profile' AND tablename = 'profiles') THEN
    CREATE POLICY "Admins can update any profile" ON public.profiles
      FOR UPDATE USING (public.is_admin());
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 5. Destinations RLS Policies
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert destinations' AND tablename = 'destinations') THEN
    CREATE POLICY "Admins can insert destinations" ON public.destinations
      FOR INSERT WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update destinations' AND tablename = 'destinations') THEN
    CREATE POLICY "Admins can update destinations" ON public.destinations
      FOR UPDATE USING (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete destinations' AND tablename = 'destinations') THEN
    CREATE POLICY "Admins can delete destinations" ON public.destinations
      FOR DELETE USING (public.is_admin());
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 6. Reviews RLS Policies
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete reviews' AND tablename = 'reviews') THEN
    CREATE POLICY "Admins can delete reviews" ON public.reviews
      FOR DELETE USING (public.is_admin());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update reviews' AND tablename = 'reviews') THEN
    CREATE POLICY "Admins can update reviews" ON public.reviews
      FOR UPDATE USING (public.is_admin());
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 7. Supabase Storage Policies for 'tour-images' Bucket
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload tour images' AND tablename = 'objects') THEN
    CREATE POLICY "Authenticated users can upload tour images" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'tour-images' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can update tour images' AND tablename = 'objects') THEN
    CREATE POLICY "Authenticated users can update tour images" ON storage.objects
      FOR UPDATE USING (bucket_id = 'tour-images' AND auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete tour images' AND tablename = 'objects') THEN
    CREATE POLICY "Authenticated users can delete tour images" ON storage.objects
      FOR DELETE USING (bucket_id = 'tour-images' AND auth.role() = 'authenticated');
  END IF;
END $$;
