# Security & Access Control Model

**Platform:** Karakoram & Co. (*کاراکورم اینڈ کو*) — Curated Pakistan & International Expeditions  
**Database:** PostgreSQL with Supabase Row Level Security (RLS)  
**Specification Version:** Phase 10 Production Lockdown

---

## 1. Security Architecture & Role Model

Karakoram & Co. implements a dual-role access control model strictly enforced at the database engine level via PostgreSQL Row Level Security:

1. **Anonymous Guest (`anon`)**: Unauthenticated public visitor. Can browse active tours, destinations, departure calendars, and approved reviews. Cannot book, create wishlist items, or access administrative manifests.
2. **Authenticated Traveler (`authenticated`, role = `'user'`)**: Registered guest. Can manage their personal profile, place bookings under their own user ID, cancel their own pending/confirmed trips, heart tours to their private wishlist, and submit reviews for expeditions they have completed.
3. **Staff Administrator (`authenticated`, role = `'admin'`)**: Authorized operations personnel. Can manage tours (create, edit, delete), schedule and adjust departure capacities, inspect the global booking manifest and customer dossiers, moderate guest reviews, and promote/demote user clearance roles.

---

## 2. Non-Spoofable Administrator Clearance Check

Administrative authorization is verified through a PostgreSQL `SECURITY DEFINER` function:

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()),
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
```

### Why this cannot be spoofed from the client:
- `auth.uid()` is extracted directly from the cryptographically signed JWT issued by Supabase Auth (HMAC-SHA256).
- The query looks up `role` in the database table `public.profiles`, not in client-controlled request headers or local storage.
- If a client modifies their local user object or sends arbitrary headers, the database evaluates `auth.uid()` from the signed signature and checks the database record, returning `false`.

---

## 3. Role Escalation Prevention Trigger

PostgreSQL RLS policies evaluate row-level accessibility, but do not provide granular column-level immutability. To prevent travelers from maliciously elevating their account to `admin` via Supabase client requests (`supabase.from('profiles').update({ role: 'admin' })`), a `BEFORE UPDATE` trigger function is attached to `public.profiles`:

```sql
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access Denied: Only staff administrators can alter security roles.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.protect_profile_role();
```

Even if a malicious user bypasses the UI and issues a direct REST API call, the database aborts the transaction immediately with error code `P0001`.

---

## 4. RLS Access Matrix (Table by Table)

| Table | SELECT | INSERT | UPDATE | DELETE |
| :--- | :--- | :--- | :--- | :--- |
| `profiles` | Owner (`id = auth.uid()`) OR Admin | Trigger on `auth.users` | Owner (non-role fields) OR Admin | Admin only |
| `destinations` | Public (`true`) | Admin only | Admin only | Admin only |
| `tours` | Public (`is_active = true`) OR Admin (all) | Admin only | Admin only | Admin only |
| `tour_availability`| Public (`true`) | Admin only | Admin only (Atomic trigger syncs on booking) | Admin only |
| `bookings` | Owner (`user_id = auth.uid()`) OR Admin | Owner (`user_id = auth.uid()`) OR Admin | Owner (`status = 'cancelled'` only) OR Admin (all) | Admin only |
| `reviews` | Public (`true`) | Owner with completed booking OR Admin | Owner (`user_id = auth.uid()`) | Owner OR Admin |
| `wishlists` | Owner (`user_id = auth.uid()`) | Owner (`user_id = auth.uid()`) | Owner (`user_id = auth.uid()`) | Owner (`user_id = auth.uid()`) |

---

## 5. Storage Bucket Security

### `tour-images` Bucket
- **Public Read (`SELECT`)**: Anyone can view tour photos and gallery assets.
- **Admin-Only Write (`INSERT`, `UPDATE`, `DELETE`)**: Only authenticated users where `public.is_admin() = true` can upload, modify, or delete expedition media.

### `avatars` Bucket
- **Public Read (`SELECT`)**: Profile avatars are visible across reviews and comments.
- **User-Scoped Write (`INSERT`, `UPDATE`, `DELETE`)**: Path must start with the user's authenticated ID:
  ```sql
  (storage.foldername(name))[1] = auth.uid()::text
  ```
  Users cannot overwrite or tamper with other users' avatar files.

---

## 6. Verification & Negative Testing Matrix

The following tests verify that unauthorized actions are blocked at the database engine layer:

1. **Unauthorized Tour Mutation (Non-Admin)**:
   - Request: `supabase.from('tours').insert({ title: 'Hacked Tour', ... })` with non-admin token.
   - Result: Database rejects with HTTP 403 / `42501 new row violates row-level security policy for table "tours"`.
2. **Unauthorized Role Escalation (Non-Admin)**:
   - Request: `supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id)` with non-admin token.
   - Result: Trigger `tr_protect_profile_role` executes and raises `Access Denied: Only staff administrators can alter security roles.`
3. **Cross-User Booking Access**:
   - Request: `supabase.from('bookings').select('*').eq('user_id', otherUserId)` with non-admin token.
   - Result: RLS filter drops the rows and returns `[]` (empty set).
4. **Direct Review Submission without Completed Booking**:
   - Request: Non-admin submits review for tour they haven't completed.
   - Result: RLS policy `reviews_insert_authenticated` rejects insertion.
