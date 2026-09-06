export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  role: 'user' | 'admin'
  created_at: string
}

export interface Destination {
  id: string
  name: string
  country: string
  description: string | null
  image_url: string | null
  created_at: string
}

export interface ItineraryDay {
  day: number
  title: string
  description: string
  meals?: string
  stay?: string
}

export interface Tour {
  id: string
  title: string
  slug: string
  destination_id: string | null
  description: string | null
  itinerary: ItineraryDay[] | null
  price: number
  discount_price: number | null
  duration_days: number
  group_size_max: number
  category: 'adventure' | 'beach' | 'cultural' | 'honeymoon' | 'family' | 'mountain trekking' | string
  images: string[]
  rating_avg: number
  is_active: boolean
  is_featured?: boolean
  created_at: string
  updated_at: string
  destination?: Destination
}

export interface TourAvailability {
  id: string
  tour_id: string
  departure_date: string
  seats_total: number
  seats_booked: number
  status: 'open' | 'closed' | 'full'
  tour?: Tour
}

export interface Booking {
  id: string
  user_id: string
  tour_id: string
  availability_id: string
  travelers_count: number
  total_price: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  booking_reference: string
  contact_info: {
    fullName: string
    email: string
    phone: string
    cnic?: string
    specialRequests?: string
  }
  created_at: string
  tour?: Tour
  availability?: TourAvailability
  profile?: Profile
}

export interface Review {
  id: string
  user_id: string
  tour_id: string
  booking_id: string | null
  rating: number
  comment: string | null
  created_at: string
  profile?: Profile
  tour?: Tour
}

export interface Wishlist {
  id: string
  user_id: string
  tour_id: string
  created_at: string
  tour?: Tour
}
