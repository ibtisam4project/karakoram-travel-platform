-- ==============================================================================
-- Migration: 20260903000001_create_travel_platform_schema.sql
-- Brand: Karakoram & Co. (کاراکورم اینڈ کو — Curated Pakistan & International Expeditions)
-- All prices strictly localized in Pakistani Rupees (PKR)
-- ==============================================================================

-- 1. Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  phone text,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz DEFAULT now()
);

-- 2. Destinations Table
CREATE TABLE IF NOT EXISTS public.destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  country text NOT NULL,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- 3. Tours Table
CREATE TABLE IF NOT EXISTS public.tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  destination_id uuid REFERENCES public.destinations(id) ON DELETE SET NULL,
  description text,
  itinerary jsonb,
  price numeric NOT NULL CHECK (price >= 0),
  discount_price numeric CHECK (discount_price >= 0),
  duration_days int NOT NULL CHECK (duration_days > 0),
  group_size_max int NOT NULL CHECK (group_size_max > 0),
  category text NOT NULL,
  images text[] DEFAULT ARRAY[]::text[],
  rating_avg numeric DEFAULT 0 CHECK (rating_avg >= 0 AND rating_avg <= 5),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Tour Availability Table
CREATE TABLE IF NOT EXISTS public.tour_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  departure_date date NOT NULL,
  seats_total int NOT NULL CHECK (seats_total > 0),
  seats_booked int DEFAULT 0 CHECK (seats_booked >= 0 AND seats_booked <= seats_total),
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed', 'full'))
);

-- 5. Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tour_id uuid NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  availability_id uuid NOT NULL REFERENCES public.tour_availability(id) ON DELETE CASCADE,
  travelers_count int NOT NULL CHECK (travelers_count > 0),
  total_price numeric NOT NULL CHECK (total_price >= 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  booking_reference text UNIQUE NOT NULL,
  contact_info jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 6. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tour_id uuid NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- 7. Wishlists Table
CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tour_id uuid NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, tour_id)
);

-- ==============================================================================
-- Storage Buckets Setup
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('tour-images', 'tour-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: Public read for tour images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public Access Tour Images' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Public Access Tour Images" ON storage.objects
    FOR SELECT USING (bucket_id = 'tour-images');
  END IF;
END $$;

-- ==============================================================================
-- Row Level Security (RLS) Scaffolding (Phase 1 Testing)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Profiles can be read by owner or admin' AND tablename = 'profiles') THEN
    CREATE POLICY "Profiles can be read by owner or admin" ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile' AND tablename = 'profiles') THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Destinations: public read access
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view destinations' AND tablename = 'destinations') THEN
    CREATE POLICY "Public can view destinations" ON public.destinations FOR SELECT USING (true);
  END IF;
END $$;

-- Tours: public read active tours
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view active tours' AND tablename = 'tours') THEN
    CREATE POLICY "Public can view active tours" ON public.tours FOR SELECT USING (is_active = true);
  END IF;
END $$;

-- Tour Availability: public read departures
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view tour availability' AND tablename = 'tour_availability') THEN
    CREATE POLICY "Public can view tour availability" ON public.tour_availability FOR SELECT USING (true);
  END IF;
END $$;

-- Bookings policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own bookings' AND tablename = 'bookings') THEN
    CREATE POLICY "Users can view their own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own bookings' AND tablename = 'bookings') THEN
    CREATE POLICY "Users can insert their own bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Reviews policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view reviews' AND tablename = 'reviews') THEN
    CREATE POLICY "Public can view reviews" ON public.reviews FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can insert reviews' AND tablename = 'reviews') THEN
    CREATE POLICY "Authenticated users can insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Wishlists policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own wishlist' AND tablename = 'wishlists') THEN
    CREATE POLICY "Users can view their own wishlist" ON public.wishlists FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own wishlist' AND tablename = 'wishlists') THEN
    CREATE POLICY "Users can manage their own wishlist" ON public.wishlists FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Profile creation trigger from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- Seed Data: 8 Destinations & 10 Handcrafted Tours in PKR
-- AI-Generated Images precisely matching each location
-- ==============================================================================

DO $$
DECLARE
  dest_hunza uuid := 'a1111111-1111-1111-1111-111111111111';
  dest_skardu uuid := 'a2222222-2222-2222-2222-222222222222';
  dest_fairy uuid := 'a3333333-3333-3333-3333-333333333333';
  dest_naran uuid := 'a4444444-4444-4444-4444-444444444444';
  dest_swat uuid := 'a5555555-5555-5555-5555-555555555555';
  dest_neelum uuid := 'a6666666-6666-6666-6666-666666666666';
  dest_chitral uuid := 'a7777777-7777-7777-7777-777777777777';
  dest_makkah uuid := 'a8888888-8888-8888-8888-888888888888';
  dest_turkey uuid := 'a9999999-9999-9999-9999-999999999999';

  tour_1 uuid := 'b1111111-1111-1111-1111-111111111111';
  tour_2 uuid := 'b2222222-2222-2222-2222-222222222222';
  tour_3 uuid := 'b3333333-3333-3333-3333-333333333333';
  tour_4 uuid := 'b4444444-4444-4444-4444-444444444444';
  tour_5 uuid := 'b5555555-5555-5555-5555-555555555555';
  tour_6 uuid := 'b6666666-6666-6666-6666-666666666666';
  tour_7 uuid := 'b7777777-7777-7777-7777-777777777777';
  tour_8 uuid := 'b8888888-8888-8888-8888-888888888888';
  tour_9 uuid := 'b9999999-9999-9999-9999-999999999999';
  tour_10 uuid := 'baaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
BEGIN

  -- 1. Insert Destinations
  INSERT INTO public.destinations (id, name, country, description, image_url)
  VALUES
    (dest_hunza, 'Hunza Valley', 'Pakistan', 'The crown jewel of Gilgit-Baltistan nestled beneath Rakaposhi, Passu Cones, and ancient Silk Route citadels.', '/images/tours/hunza_valley_autumn_1788431904215.jpg'),
    (dest_skardu, 'Skardu & Baltistan', 'Pakistan', 'Gateway to the highest peaks on Earth: K2, Broad Peak, Shangrila Lake, and the vast cold desert of Katpana.', '/images/tours/skardu_shangrila_lake_1788431945807.jpg'),
    (dest_fairy, 'Fairy Meadows & Nanga Parbat', 'Pakistan', 'Lush alpine meadows directly facing the colossal 4,500m Raikhot ice face of the Killer Mountain.', '/images/tours/fairy_meadows_nanga_parbat_1788431998055.jpg'),
    (dest_naran, 'Naran & Kaghan Valley', 'Pakistan', 'Emerald pine gorges, Kunhar River trout, and legendary high alpine waters of Lake Saif-ul-Malook and Babusar Pass.', '/images/tours/naran_saif_ul_malook_1788432082680.jpg'),
    (dest_swat, 'Swat & Kalam Valley', 'Pakistan', 'The Switzerland of the East with crystal turquoise rivers, thick deodar forests, and ancient Gandhara heritage.', '/images/tours/swat_kalam_valley_1788432036311.jpg'),
    (dest_neelum, 'Neelum Valley, Azad Kashmir', 'Pakistan', 'Verdant river gorges, roaring waterfalls, alpine lakes, and quaint wooden timber settlements along the LOC frontier.', '/images/tours/neelum_valley_azad_kashmir_1788432276042.jpg'),
    (dest_chitral, 'Chitral & Kalash Valleys', 'Pakistan', 'Ancient indigenous Kalash animist tribes, towering Tirich Mir peaks, and vibrant cultural festivals in the Hindu Kush.', '/images/tours/chitral_kalash_valley_1788432398400.jpg'),
    (dest_makkah, 'Makkah & Madinah', 'Saudi Arabia', 'Holy sanctuary of the Haramain Sharifain, spiritual contemplation, and executive VIP Umrah hospitality.', '/images/tours/umrah_makkah_madinah_1788432515714.jpg'),
    (dest_turkey, 'Istanbul & Cappadocia', 'Turkey', 'Historic Bosphorus straits, Ottoman imperial mosques, hot air balloon valleys, and rich Silk Road kinship.', '/images/tours/istanbul_turkey_bosphorus_1788432596571.jpg')
  ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url;

  -- 2. Insert Tours (Pakistani Rupees PKR)
  INSERT INTO public.tours (
    id, title, slug, destination_id, description, itinerary, price, discount_price,
    duration_days, group_size_max, category, images, rating_avg, is_active
  ) VALUES
    (
      tour_1,
      'Autumn Gold in Hunza & Passu Cones Expedition',
      'autumn-gold-hunza-passu',
      dest_hunza,
      'A bespoke autumn journey through Central & Upper Hunza. Experience amber poplar terraces, historic 900-year Baltit and Altit Forts, boating on Attabad Lake, and luxury lodge stays.',
      '[
        {"day": 1, "title": "Islamabad to Gilgit / Chilas Transit", "description": "Depart Islamabad via Hazara Motorway and Karakoram Highway with views of Nanga Parbat viewpoint."},
        {"day": 2, "title": "Arrival in Central Hunza & Altit Fort", "description": "Explore Karimabad royal fortress gardens, royal apricot orchards, and sunset tea at Eagle''s Nest Duikar."},
        {"day": 3, "title": "Attabad Lake & Passu Cathedral Cones", "description": "Boating across turquoise Attabad waters, crossing Hussaini suspension bridge, and traditional Wakhi trout lunch."},
        {"day": 4, "title": "Khunjerab Pass (Pak-China Border)", "description": "Scenic climb to the world''s highest paved international border crossing at 4,693m with wildlife spotting."},
        {"day": 5, "title": "Ganish Heritage Village & Return Transit", "description": "Visit the 1,000-year-old preserved settlement and return journey to Islamabad."}
      ]'::jsonb,
      95000,
      85000,
      5,
      14,
      'Northern Areas',
      ARRAY['/images/tours/hunza_valley_autumn_1788431904215.jpg'],
      4.9,
      true
    ),
    (
      tour_2,
      'K2 Base Camp & Concordia High Altitude Trek',
      'k2-base-camp-concordia-trek',
      dest_skardu,
      'The crown jewel of global mountaineering. Trek across the Baltoro Glacier to Concordia—the Throne Room of the Mountain Gods—surrounded by K2, Broad Peak, and the Gasherbrums.',
      '[
        {"day": 1, "title": "Arrival in Skardu & Trek Briefing", "description": "Pre-departure gear check, liaison officer introduction, and acclimatization walk in Skardu."},
        {"day": 2, "title": "4x4 Jeep Drive to Askole", "description": "Rugged journey along the Braldu Gorge to the final village settlement before wilderness entry."},
        {"day": 3, "title": "Trek to Jhola & Paiju Camp", "description": "First steps along the glacial terminal moraine with views of Paiju Peak and Trango Towers."},
        {"day": 4, "title": "Concordia Camp (Throne Room of Mountain Gods)", "description": "Reach the sacred glacial confluence facing the sheer 8,611m pyramid of K2."},
        {"day": 5, "title": "K2 Base Camp & Gilkey Memorial Excursion", "description": "Stand beneath the Savage Mountain''s south face and pay respects at the historic climber shrine."}
      ]'::jsonb,
      385000,
      350000,
      14,
      8,
      'Trekking & Adventure',
      ARRAY['/images/tours/k2_base_camp_trek_1788431873354.jpg'],
      5.0,
      true
    ),
    (
      tour_3,
      'Shangrila Lake & Katpana Desert Romance',
      'shangrila-katpana-honeymoon',
      dest_skardu,
      'An intimate luxury honeymoon retreat in Skardu. Features pagoda chalet stays overlooking Lower Kachura Lake, sunset dune glamping in the high-altitude Katpana cold desert, and Serena Shigar Fort dinners.',
      '[
        {"day": 1, "title": "Direct Flight to Skardu & Shangrila Check-in", "description": "Land at Skardu airport with mountain views and check into lakeside executive suites at Shangrila Resort."},
        {"day": 2, "title": "Upper Kachura Private Boat Cruise & Shigar Fort", "description": "Private wooden boat on secluded emerald waters followed by a royal tour of 400-year-old Raja Shigar Palace."},
        {"day": 3, "title": "Katpana Cold Desert Luxury Stargazing", "description": "Exclusive candlelit dinner amidst snow-dusted white sand dunes with private telescope astronomy guide."},
        {"day": 4, "title": "Morning Lake Walk & Return Flight", "description": "Breakfast facing the reflection of Karakoram peaks and transfer to Skardu airport."}
      ]'::jsonb,
      195000,
      175000,
      4,
      2,
      'Honeymoon',
      ARRAY['/images/tours/skardu_shangrila_lake_1788431945807.jpg'],
      4.9,
      true
    ),
    (
      tour_4,
      'Fairy Meadows & Nanga Parbat Base Camp Retreat',
      'fairy-meadows-nanga-parbat-retreat',
      dest_fairy,
      'Ascend the legendary 4x4 mountain track and hike into the pine meadows directly facing the sheer 4,500m Raikhot face of Nanga Parbat. Log cabin stays and alpine stargazing.',
      '[
        {"day": 1, "title": "Raikhot Bridge Jeep Ascent to Tattu", "description": "Thrilling 4x4 jeep ride followed by an easy 3-hour alpine pine forest trek to Fairy Meadows."},
        {"day": 2, "title": "Beyal Camp & German View Point Hike", "description": "Gentle walk through birch forests to the edge of the Raikhot glacier with uninterrupted ice wall panoramas."},
        {"day": 3, "title": "Nanga Parbat Base Camp Day Trek", "description": "Reach the base camp where legendary mountaineering history was forged, returning for evening bonfire."},
        {"day": 4, "title": "Descent to Raikhot & Islamabad Return", "description": "Morning descent through fresh mountain air and scenic drive back."}
      ]'::jsonb,
      68000,
      59000,
      4,
      12,
      'Trekking & Adventure',
      ARRAY['/images/tours/fairy_meadows_nanga_parbat_1788431998055.jpg'],
      4.8,
      true
    ),
    (
      tour_5,
      'Swat Valley Family Heritage & Malam Jabba Holiday',
      'swat-valley-family-holiday',
      dest_swat,
      'A peaceful holiday designed for families. Experience Swat River lodges, Malam Jabba ski chairlifts, lush pine walks in Kalam, and the pristine alpine waters of Mahodand Lake.',
      '[
        {"day": 1, "title": "Islamabad to Swat Valley & Fizagat", "description": "Scenic drive via Swat Motorway, visit to Swat Museum & Butkara stupas, riverside dinner."},
        {"day": 2, "title": "Malam Jabba Mountain Resort & Chairlift", "description": "Family cable car rides, ziplining, panoramic peak views, and traditional Chapli kebab lunch."},
        {"day": 3, "title": "Kalam Valley, Ushu Forest & Mahodand Lake", "description": "4x4 journey through dense deodar forests to the crystal trout waters of Mahodand Lake."},
        {"day": 4, "title": "Local Souvenirs & Return to Islamabad", "description": "Shop for authentic Swati shawls, carved woodwork, and pure mountain honey before departure."}
      ]'::jsonb,
      72000,
      65000,
      4,
      16,
      'Family Tour',
      ARRAY['/images/tours/swat_kalam_valley_1788432036311.jpg'],
      4.7,
      true
    ),
    (
      tour_6,
      'Naran, Lake Saif-ul-Malook & Babusar Top Getaway',
      'naran-saif-ul-malook-babusar',
      dest_naran,
      'The classic northern escape through Kaghan Valley. Experience wooden boat rides on legendary Saif-ul-Malook, Kunhar river rafting, and crossing Babusar Pass at 13,700 feet.',
      '[
        {"day": 1, "title": "Islamabad to Naran via Balakot", "description": "Drive past lush green hills of Abbottabad and along the roaring Kunhar River to Naran Bazaar."},
        {"day": 2, "title": "Jeep Excursion to Lake Saif-ul-Malook", "description": "Explore the fairy-tale glacial lake beneath Malika Parbat peak with optional horseback ride."},
        {"day": 3, "title": "Babusar Top (4,173m) & Lulusar Lake", "description": "High-altitude pass dividing Khyber Pakhtunkhwa and Gilgit-Baltistan with breathtaking vistas."},
        {"day": 4, "title": "Rafting & Return Transit", "description": "Kunhar river rafting activity and comfortable return to Islamabad."}
      ]'::jsonb,
      55000,
      48000,
      3,
      16,
      'Family Tour',
      ARRAY['/images/tours/naran_saif_ul_malook_1788432082680.jpg'],
      4.7,
      true
    ),
    (
      tour_7,
      'Deosai Plains: Land of the Giants 4x4 Safari',
      'deosai-plains-land-of-giants',
      dest_skardu,
      'Explore the second highest alpine plateau on Earth at 4,114 meters. Rolling wildflower carpets, Himalayan brown bear wildlife tracking, and camping at turquoise Sheosar Lake.',
      '[
        {"day": 1, "title": "Skardu to Sadpara Lake & Deosai Gate", "description": "Climb up to the boundless wildflower meadows and establish camp under a billion stars."},
        {"day": 2, "title": "Bara Pani & Sheosar Lake Wildlife Safari", "description": "Track Himalayan marmots and brown bears with wildlife rangers, mirror reflections on Sheosar."},
        {"day": 3, "title": "Chilm Chawki & Astore Valley Crossing", "description": "Descend towards the pine forests of Rama Meadow and Rama Lake."}
      ]'::jsonb,
      88000,
      79000,
      3,
      10,
      'Trekking & Adventure',
      ARRAY['/images/tours/deosai_plains_plateau_1788432132860.jpg'],
      4.8,
      true
    ),
    (
      tour_8,
      'Neelum Valley Romance: Sharda & Arang Kel Retreat',
      'neelum-valley-sharda-arang-kel',
      dest_neelum,
      'Discover the emerald paradise of Azad Kashmir. Chairlift ascent to the hanging village of Arang Kel, ruins of 2,000-year-old Sharda University, and waterfalls of Dhani and Kutton.',
      '[
        {"day": 1, "title": "Islamabad / Muzaffarabad to Keran", "description": "Travel along the Neelum River facing Indian-administered Kashmir across the riverbank."},
        {"day": 2, "title": "Sharda Peeth Citadel & Cable Car to Arang Kel", "description": "Historic Hindu temple ruins and cable lift up to the breathtaking heavenly village of Arang Kel."},
        {"day": 3, "title": "Taobat Frontier Village Day Excursion", "description": "Visit the easternmost village where the Neelum River enters Pakistan with pristine wooden bridges."},
        {"day": 4, "title": "Kutton Waterfall & Return Journey", "description": "Morning tea by the cascade and comfortable return to Islamabad."}
      ]'::jsonb,
      62000,
      54000,
      4,
      12,
      'Honeymoon',
      ARRAY['/images/tours/neelum_valley_azad_kashmir_1788432276042.jpg'],
      4.8,
      true
    ),
    (
      tour_9,
      'Executive Umrah & Spiritual Ziyarat Package',
      'executive-umrah-ziyarat-package',
      dest_makkah,
      'A VIP 5-star spiritual journey for Pakistani pilgrims. Clock tower hotels directly facing the Haram in Makkah, luxury high-speed Haramain Train transfers, and guided Ziyarat in Madinah.',
      '[
        {"day": 1, "title": "Direct Flight to Jeddah & VIP Transfer to Makkah", "description": "Fast-track immigration, private luxury GMC transfer, check-in at Fairmont Clock Royal Tower."},
        {"day": 2, "title": "Perform Umrah with Dedicated Guide", "description": "Private Mutawwif guidance for Tawaf and Sai, followed by evening Quranic reflection in the Haram."},
        {"day": 3, "title": "Makkah Historic Ziyarat", "description": "Visit Jabal al-Noor (Cave of Hira), Cave of Thawr, Mina, Muzdalifah, and Mount Arafat."},
        {"day": 4, "title": "High-Speed Haramain Train to Madinah", "description": "First-class bullet train to the City of the Prophet (PBUH), check into Oberoi / Dar Al Taqwa."},
        {"day": 5, "title": "Salam at the Rawdah & Return to Pakistan", "description": "Spiritual prayer in the Riaz-ul-Jannah, Masjid Quba visit, and flight back to Lahore/Islamabad/Karachi."}
      ]'::jsonb,
      425000,
      395000,
      7,
      20,
      'Religious Tourism',
      ARRAY['/images/tours/umrah_makkah_madinah_1788432515714.jpg'],
      5.0,
      true
    ),
    (
      tour_10,
      'Bosphorus Wonders & Cappadocia Cave Heritage',
      'istanbul-bosphorus-cappadocia-escape',
      dest_turkey,
      'The favourite international getaway for Pakistani travellers. Private Bosphorus yacht cruise, Hagia Sophia & Blue Mosque tours, and fairytale cave suite stays in Cappadocia.',
      '[
        {"day": 1, "title": "Lahore / Karachi to Istanbul & Sultanahmet Walk", "description": "Arrival, private luxury transfer to historic boutique hotel near Sultanahmet square."},
        {"day": 2, "title": "Hagia Sophia, Blue Mosque & Grand Bazaar", "description": "Guided historical walk through Byzantine and Ottoman imperial monuments and Turkish spice markets."},
        {"day": 3, "title": "Private Sunset Yacht Cruise on Bosphorus", "description": "Sail between Europe and Asia with Turkish tea, baklava, and stunning palace silhouettes."},
        {"day": 4, "title": "Flight to Cappadocia & Fairy Chimney Cave Stay", "description": "Check into carved stone cave suites in Goreme and visit underground cities."},
        {"day": 5, "title": "Hot Air Balloon Sunrise Flight & Return", "description": "World-famous sunrise balloon ascent over Cappadocia valleys followed by flight back to Pakistan."}
      ]'::jsonb,
      285000,
      265000,
      6,
      10,
      'Northern Areas',
      ARRAY['/images/tours/istanbul_turkey_bosphorus_1788432596571.jpg'],
      4.9,
      true
    )
  ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    price = EXCLUDED.price,
    discount_price = EXCLUDED.discount_price,
    description = EXCLUDED.description,
    itinerary = EXCLUDED.itinerary,
    images = EXCLUDED.images,
    category = EXCLUDED.category;

  -- 3. Insert Tour Availability (PKR localized tours with realistic departure dates)
  INSERT INTO public.tour_availability (tour_id, departure_date, seats_total, seats_booked, status)
  VALUES
    -- Tour 1: Hunza Autumn
    (tour_1, CURRENT_DATE + INTERVAL '12 days', 14, 4, 'open'),
    (tour_1, CURRENT_DATE + INTERVAL '28 days', 14, 11, 'open'),
    (tour_1, CURRENT_DATE + INTERVAL '45 days', 14, 14, 'full'),
    -- Tour 2: K2 Base Camp
    (tour_2, CURRENT_DATE + INTERVAL '35 days', 8, 3, 'open'),
    (tour_2, CURRENT_DATE + INTERVAL '60 days', 8, 8, 'full'),
    -- Tour 3: Shangrila Honeymoon
    (tour_3, CURRENT_DATE + INTERVAL '7 days', 2, 0, 'open'),
    (tour_3, CURRENT_DATE + INTERVAL '21 days', 2, 2, 'full'),
    -- Tour 4: Fairy Meadows
    (tour_4, CURRENT_DATE + INTERVAL '10 days', 12, 5, 'open'),
    (tour_4, CURRENT_DATE + INTERVAL '24 days', 12, 10, 'open'),
    -- Tour 5: Swat Valley Family
    (tour_5, CURRENT_DATE + INTERVAL '14 days', 16, 6, 'open'),
    (tour_5, CURRENT_DATE + INTERVAL '30 days', 16, 16, 'full'),
    -- Tour 6: Naran Saif-ul-Malook
    (tour_6, CURRENT_DATE + INTERVAL '9 days', 16, 7, 'open'),
    (tour_6, CURRENT_DATE + INTERVAL '22 days', 16, 13, 'open'),
    -- Tour 7: Deosai Safari
    (tour_7, CURRENT_DATE + INTERVAL '18 days', 10, 4, 'open'),
    (tour_7, CURRENT_DATE + INTERVAL '40 days', 10, 10, 'full'),
    -- Tour 8: Neelum Valley Kashmir
    (tour_8, CURRENT_DATE + INTERVAL '15 days', 12, 4, 'open'),
    (tour_8, CURRENT_DATE + INTERVAL '32 days', 12, 12, 'full'),
    -- Tour 9: Umrah Executive
    (tour_9, CURRENT_DATE + INTERVAL '20 days', 20, 12, 'open'),
    (tour_9, CURRENT_DATE + INTERVAL '50 days', 20, 20, 'full'),
    -- Tour 10: Turkey Bosphorus
    (tour_10, CURRENT_DATE + INTERVAL '25 days', 10, 4, 'open'),
    (tour_10, CURRENT_DATE + INTERVAL '55 days', 10, 9, 'open');

END $$;
