-- 01 — brands & admins
-- Semua data bisnis dipisah per brand_id. Migration hanya ada di repo master.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  slug text not null,
  domain text not null,
  tagline text,
  logo_url text,
  warna_utama text,
  kode_ref text not null,
  wa_cs text,
  qris_image_url text,
  batas_bayar_menit integer not null default 15,
  maks_order_pending integer not null default 3,
  jam_cek_tagihan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brands_slug_key unique (slug),
  constraint brands_domain_key unique (domain),
  constraint brands_kode_ref_key unique (kode_ref),
  constraint brands_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint brands_kode_ref_format check (kode_ref ~ '^[A-Z0-9]{2,8}$'),
  constraint brands_batas_bayar_check check (batas_bayar_menit > 0),
  constraint brands_maks_pending_check check (maks_order_pending > 0)
);

create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  brand_id uuid references public.brands (id) on delete cascade,
  nama text not null,
  role text not null default 'admin',
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admins_role_check check (role in ('owner', 'admin', 'super_admin')),
  constraint admins_role_brand_check check (
    (role = 'super_admin' and brand_id is null)
    or (role in ('owner', 'admin') and brand_id is not null)
  )
);

create index if not exists admins_user_id_idx on public.admins (user_id);
create index if not exists admins_brand_id_idx on public.admins (brand_id);
create unique index if not exists admins_super_unique_idx
  on public.admins (user_id) where role = 'super_admin';
create unique index if not exists admins_user_brand_unique_idx
  on public.admins (user_id, brand_id) where brand_id is not null;

drop trigger if exists brands_set_updated_at on public.brands;
create trigger brands_set_updated_at
  before update on public.brands
  for each row execute function public.set_updated_at();

drop trigger if exists admins_set_updated_at on public.admins;
create trigger admins_set_updated_at
  before update on public.admins
  for each row execute function public.set_updated_at();
