-- ═══════════════════════════════════════════════════════════
-- CAIRO RESTAURANT — SUPABASE SCHEMA
-- Run this in Supabase SQL Editor (supabase.com → SQL Editor)
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── CATEGORIES ─────────────────────────────────────────────
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ── MENU ITEMS ─────────────────────────────────────────────
create table if not exists public.menu_items (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  category_id uuid references public.categories(id) on delete set null,
  image_url text,
  available boolean default true,
  featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── MENU ITEM VARIANTS ─────────────────────────────────────
create table if not exists public.menu_item_variants (
  id uuid primary key default uuid_generate_v4(),
  menu_item_id uuid references public.menu_items(id) on delete cascade,
  name text not null,
  price numeric(10,2) not null,
  created_at timestamptz default now()
);

-- ── ORDERS ─────────────────────────────────────────────────
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  table_number text not null,
  customer_name text,
  notes text,
  status text default 'pending',
  total_amount numeric(10,2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── ORDER ITEMS ────────────────────────────────────────────
create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  variant_id uuid references public.menu_item_variants(id) on delete set null,
  name text not null,
  variant_name text,
  price numeric(10,2) not null,
  quantity int not null default 1,
  created_at timestamptz default now()
);

-- ── RESERVATIONS ───────────────────────────────────────────
create table if not exists public.reservations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null,
  email text,
  party_size int not null default 2,
  date date not null,
  time text not null,
  notes text,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── GALLERY ────────────────────────────────────────────────
create table if not exists public.gallery (
  id uuid primary key default uuid_generate_v4(),
  image_url text not null,
  caption text,
  category text default 'general',
  sort_order int default 0,
  created_at timestamptz default now()
);

-- ── UPDATED_AT TRIGGER ─────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger set_menu_items_updated_at
  before update on public.menu_items
  for each row execute procedure public.set_updated_at();

create or replace trigger set_orders_updated_at
  before update on public.orders
  for each row execute procedure public.set_updated_at();

create or replace trigger set_reservations_updated_at
  before update on public.reservations
  for each row execute procedure public.set_updated_at();

-- ── DISABLE RLS (open access, add auth later if needed) ───
alter table public.categories disable row level security;
alter table public.menu_items disable row level security;
alter table public.menu_item_variants disable row level security;
alter table public.orders disable row level security;
alter table public.order_items disable row level security;
alter table public.reservations disable row level security;
alter table public.gallery disable row level security;

-- ── GRANTS ─────────────────────────────────────────────────
grant all on public.categories to anon, authenticated;
grant all on public.menu_items to anon, authenticated;
grant all on public.menu_item_variants to anon, authenticated;
grant all on public.orders to anon, authenticated;
grant all on public.order_items to anon, authenticated;
grant all on public.reservations to anon, authenticated;
grant all on public.gallery to anon, authenticated;

-- ── ENABLE REALTIME ────────────────────────────────────────
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.reservations;

-- ── SEED: SAMPLE CATEGORIES ────────────────────────────────
insert into public.categories (name, description, sort_order) values
  ('Starters', 'Begin your journey', 1),
  ('Soups & Salads', 'Fresh and wholesome', 2),
  ('Grills & Mains', 'Premium grilled & oven dishes', 3),
  ('Rice & Pasta', 'Hearty and fulfilling', 4),
  ('Shawarma & Wraps', 'Cairo street classics', 5),
  ('Desserts', 'Sweet endings', 6),
  ('Cocktails', 'Signature mixes', 7),
  ('Beverages', 'Hot & cold drinks', 8)
on conflict do nothing;
