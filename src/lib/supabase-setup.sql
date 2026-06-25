-- ============================================================
-- the maddhattery — Supabase table setup
-- Run this in your Supabase project:
--   Dashboard → SQL Editor → New query → paste & run
-- ============================================================


-- 1. BOOKINGS (event deposits paid via Stripe)
-- ─────────────────────────────────────────────
create table if not exists hat_bar_bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),

  -- customer
  name text,
  email text,
  phone text,

  -- event details
  event_type text,
  budget_tier text,
  guests integer,
  hours integer,
  event_date date,

  -- pricing (stored in cents for Stripe compatibility)
  estimated_total integer,
  deposit_amount integer,

  -- add-ons
  service_addons text[],
  custom_addons text[],

  -- payment
  stripe_payment_intent_id text,
  status text default 'deposit_paid',

  -- misc
  notes text,
  sms_opt_in boolean default false
);

-- Allow anyone to insert a booking (needed for client-side checkout)
alter table hat_bar_bookings enable row level security;
create policy "Anyone can insert a booking"
  on hat_bar_bookings for insert
  with check (true);

-- Only authenticated users (you, in the admin dashboard) can read bookings
create policy "Authenticated users can read bookings"
  on hat_bar_bookings for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can update bookings"
  on hat_bar_bookings for update
  using (auth.role() = 'authenticated');


-- 2. LEADS (quote requests & newsletter signups)
-- ──────────────────────────────────────────────
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),

  -- contact
  name text,
  email text not null,
  phone text,
  sms_opt_in boolean default false,

  -- source
  source text,          -- 'quote-request' | 'footer-signup' | 'custom-hat-deposit'

  -- event info (populated for quote requests)
  event_type text,
  event_date date,
  guests integer,
  hat_sizes text,
  estimated_total text,
  deposit text,
  notes text
);

-- Anyone can submit a lead (form submissions)
alter table leads enable row level security;
create policy "Anyone can insert a lead"
  on leads for insert
  with check (true);

-- Only you can read leads
create policy "Authenticated users can read leads"
  on leads for select
  using (auth.role() = 'authenticated');


-- 3. PHOTO ORDER (admin gallery drag-to-reorder)
-- ─────────────────────────────────────────────
create table if not exists photo_order (
  id integer primary key default 1,
  names text[] not null default '{}'
);

-- seed one row so upsert works
insert into photo_order (id, names) values (1, '{}')
  on conflict (id) do nothing;

alter table photo_order enable row level security;
create policy "Public can read photo order"
  on photo_order for select using (true);
create policy "Authenticated users can update photo order"
  on photo_order for update using (auth.role() = 'authenticated');


-- 4. SAVED DESIGNS (shareable hat design links)
-- ─────────────────────────────────────────────
create table if not exists saved_hat_designs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text,
  base_id text,
  band_id text,
  accent_id text,
  personalization text[],
  summary text
);

alter table saved_hat_designs enable row level security;
create policy "Anyone can insert a saved design"
  on saved_hat_designs for insert with check (true);
create policy "Anyone can read a saved design"
  on saved_hat_designs for select using (true);


-- 5. STORAGE BUCKET for hat gallery photos
-- ─────────────────────────────────────────
-- Run this separately in the Supabase dashboard:
--   Storage → New bucket → name it "hat-bar-images" → Public: ON
-- Or use this SQL:
insert into storage.buckets (id, name, public)
  values ('hat-bar-images', 'hat-bar-images', true)
  on conflict (id) do nothing;

create policy "Public can view hat images"
  on storage.objects for select
  using (bucket_id = 'hat-bar-images');

create policy "Authenticated users can upload hat images"
  on storage.objects for insert
  with check (bucket_id = 'hat-bar-images' and auth.role() = 'authenticated');

create policy "Authenticated users can delete hat images"
  on storage.objects for delete
  using (bucket_id = 'hat-bar-images' and auth.role() = 'authenticated');


-- 6. DESIGNS (saved custom hat designs from the /design page)
-- ─────────────────────────────────────────────────────────────
create table if not exists designs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  email text not null,
  name text,
  phone text,
  base_id text,
  band_id text,
  accent_id text,
  personalization text[],
  summary jsonb
);

alter table designs enable row level security;
create policy "Anyone can insert a design"
  on designs for insert with check (true);
create policy "Anyone can read a design by id"
  on designs for select using (true);


-- 7. GALLERY PHOTO ORDER
-- ─────────────────────────────────────────────────────────────
-- NOTE: bucketImages.ts uses a table called 'gallery_photo_order'
-- with (name, position) columns — different from the photo_order table above.
-- Run this instead of (or in addition to) the photo_order table.
create table if not exists gallery_photo_order (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  position integer not null default 0
);

alter table gallery_photo_order enable row level security;
create policy "Public can read gallery order"
  on gallery_photo_order for select using (true);
create policy "Authenticated users can modify gallery order"
  on gallery_photo_order for all using (auth.role() = 'authenticated');


-- 8. CUSTOM GALLERY DESIGNS (the hat design gallery on the homepage)
-- ─────────────────────────────────────────────────────────────────
create table if not exists custom_gallery_designs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  src text not null,
  title text default '',
  note text default '',
  position integer not null default 0
);

alter table custom_gallery_designs enable row level security;
create policy "Public can read gallery designs"
  on custom_gallery_designs for select using (true);
create policy "Authenticated users can manage gallery designs"
  on custom_gallery_designs for all using (auth.role() = 'authenticated');


-- 9. DESIGN IMAGE OVERRIDES (admin-swappable photos on the /design page)
-- ──────────────────────────────────────────────────────────────────────
create table if not exists design_image_overrides (
  slot_key text primary key,
  url text not null,
  updated_at timestamptz default now()
);

alter table design_image_overrides enable row level security;
create policy "Public can read image overrides"
  on design_image_overrides for select using (true);
create policy "Authenticated users can manage image overrides"
  on design_image_overrides for all using (auth.role() = 'authenticated');


-- 10. CUSTOM BASE HATS (admin-added hat bases beyond the built-ins)
-- ──────────────────────────────────────────────────────────────────
create table if not exists design_bases (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  range text not null,
  description text default '',
  image text default '',
  sort_order integer not null default 0,
  active boolean not null default true
);

alter table design_bases enable row level security;
create policy "Public can read active design bases"
  on design_bases for select using (true);
create policy "Authenticated users can manage design bases"
  on design_bases for all using (auth.role() = 'authenticated');
