-- ================================================================
-- the maddhattery — Wholesale Portal Database Setup
-- Run this in Supabase SQL Editor
-- ================================================================

-- 1. WHOLESALE APPLICATIONS
create table if not exists wholesale_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  business_name text not null,
  business_type text not null,
  location text not null,
  storefront_type text not null, -- 'storefront' | 'online' | 'both'
  contact_name text not null,
  email text not null,
  phone text,
  tax_id text not null,
  resale_license_url text,
  status text default 'pending', -- 'pending' | 'approved' | 'denied'
  notes text
);

alter table wholesale_applications enable row level security;
create policy "Anyone can submit an application"
  on wholesale_applications for insert with check (true);
create policy "Authenticated users can read applications"
  on wholesale_applications for select using (true);
create policy "Authenticated users can update applications"
  on wholesale_applications for update using (true) with check (true);


-- 2. WHOLESALE RETAILERS (approved accounts)
create table if not exists wholesale_retailers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  application_id uuid references wholesale_applications(id),
  business_name text not null,
  email text not null unique,
  password_hash text not null,
  active boolean default true
);

alter table wholesale_retailers enable row level security;
create policy "Public can read retailers for login"
  on wholesale_retailers for select using (true);
create policy "Authenticated users can manage retailers"
  on wholesale_retailers for all using (true);


-- 3. WHOLESALE PRODUCTS
create table if not exists wholesale_products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  category text not null, -- 'feathers' | 'hat-bands' | 'beaded-hat-bands' | 'layered-band-sets' | 'hat-band-accessories' | 'hat-pins'
  name text not null,
  description text default '',
  price numeric(10,2) not null default 0,
  unit text default 'each', -- 'each' | 'pack' | 'dozen' | 'set'
  variations text default '', -- colors, sizes etc
  image text default '',
  in_stock boolean default true,
  sort_order integer default 0
);

alter table wholesale_products enable row level security;
create policy "Public can read products"
  on wholesale_products for select using (true);
create policy "Authenticated users can manage products"
  on wholesale_products for all using (true);


-- 4. WHOLESALE CART
create table if not exists wholesale_cart (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  retailer_id uuid references wholesale_retailers(id) on delete cascade,
  product_id uuid references wholesale_products(id) on delete cascade,
  quantity integer not null default 1,
  notes text,
  unique(retailer_id, product_id)
);

alter table wholesale_cart enable row level security;
create policy "Public can manage cart"
  on wholesale_cart for all using (true) with check (true);


-- 5. STORAGE BUCKET for resale license uploads
insert into storage.buckets (id, name, public)
  values ('wholesale-docs', 'wholesale-docs', false)
  on conflict (id) do nothing;

create policy "Anyone can upload wholesale docs"
  on storage.objects for insert
  with check (bucket_id = 'wholesale-docs');

create policy "Authenticated users can read wholesale docs"
  on storage.objects for select
  using (bucket_id = 'wholesale-docs');
