-- ==============================================================================
-- Migration: 20260903000002_add_featured_and_seed_reviews.sql
-- Adds is_featured flag to tours and seeds verified Pakistani guest reviews
-- ==============================================================================

-- 1. Add is_featured column to tours if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tours' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE public.tours ADD COLUMN is_featured boolean DEFAULT false;
  END IF;
END $$;

-- 2. Mark signature expeditions as featured
UPDATE public.tours
SET is_featured = true
WHERE slug IN (
  'autumn-gold-hunza-passu',
  'k2-base-camp-concordia-trek',
  'fairy-meadows-nanga-parbat-retreat',
  'shangrila-katpana-honeymoon',
  'executive-umrah-ziyarat-package'
);

-- 3. Seed Guest Profiles & Realistic Pakistani Reviews
DO $$
DECLARE
  u1 uuid := 'c1111111-1111-1111-1111-111111111111';
  u2 uuid := 'c2222222-2222-2222-2222-222222222222';
  u3 uuid := 'c3333333-3333-3333-3333-333333333333';
  u4 uuid := 'c4444444-4444-4444-4444-444444444444';
  u5 uuid := 'c5555555-5555-5555-5555-555555555555';

  tour_hunza uuid := 'b1111111-1111-1111-1111-111111111111';
  tour_k2 uuid := 'b2222222-2222-2222-2222-222222222222';
  tour_fairy uuid := 'b4444444-4444-4444-4444-444444444444';
  tour_skardu uuid := 'b3333333-3333-3333-3333-333333333333';
  tour_umrah uuid := 'b9999999-9999-9999-9999-999999999999';
BEGIN

  -- Insert/update reviewer profiles in public.profiles
  -- Note: We insert into profiles directly for guest review attribution
  INSERT INTO public.profiles (id, full_name, avatar_url, phone, role)
  VALUES
    (u1, 'Dr. Taimur Khan & Family', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', '+92 300 4521890', 'user'),
    (u2, 'Ayesha Siddiqui & Bilal', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', '+92 321 8892114', 'user'),
    (u3, 'Zain Ul Abideen (Alpine Club)', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', '+92 333 5198002', 'user'),
    (u4, 'Farhan & Maham Qureshi', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80', '+92 301 9283741', 'user'),
    (u5, 'Haji Abdul Rasheed & Family', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80', '+92 345 7712039', 'user')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  -- Insert Reviews
  INSERT INTO public.reviews (id, user_id, tour_id, rating, comment, created_at)
  VALUES
    (
      'd1111111-1111-1111-1111-111111111111',
      u1,
      tour_hunza,
      5,
      'The Autumn tour in Hunza exceeded every single expectation. Traveling with elderly parents and children is never easy in the north, but Karakoram & Co handled heated coasters, Serena Hunza suites, and local apricot farm visits with royal hospitality.',
      NOW() - INTERVAL '15 days'
    ),
    (
      'd2222222-2222-2222-2222-222222222222',
      u2,
      tour_skardu,
      5,
      'Our honeymoon in Shangrila and the Katpana cold desert glamping was straight out of a dream. Candlelit dinner on the white sand dunes with Karakoram peaks under the milky way will stay in our hearts forever.',
      NOW() - INTERVAL '24 days'
    ),
    (
      'd3333333-3333-3333-3333-333333333333',
      u3,
      tour_k2,
      5,
      'As an experienced trekker, Baltoro is the ultimate test. The expedition porters, high-altitude mountain chef, and satellite safety gear provided by Karakoram & Co were world class. Standing at Concordia facing K2 was profound.',
      NOW() - INTERVAL '35 days'
    ),
    (
      'd4444444-4444-4444-4444-444444444444',
      u4,
      tour_fairy,
      5,
      'The jeep ascent was thrilling, but the moment you step onto the alpine meadow with Nanga Parbat right in front of your cabin, you forget everything else. Excellent local guides and warm pine log fires every evening.',
      NOW() - INTERVAL '40 days'
    ),
    (
      'd5555555-5555-5555-5555-555555555555',
      u5,
      tour_umrah,
      5,
      'MashAllah, the executive Umrah arrangement was flawless. Clock tower hotel right at the Haram courtyard made it effortless for my elderly mother. The private Haramain bullet train transfer was seamless. JazakAllah khair!',
      NOW() - INTERVAL '50 days'
    )
  ON CONFLICT (id) DO NOTHING;

END $$;
