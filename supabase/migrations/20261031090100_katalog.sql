-- 02 — katalog: layanan, produk nominal, metode bayar

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  nama text not null,
  slug text not null,
  jenis text not null,
  input_fields jsonb not null default '[]'::jsonb,
  biaya_admin numeric(14, 2) not null default 0,
  biaya_supplier numeric(14, 2) not null default 0,
  urutan integer not null default 0,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_brand_slug_key unique (brand_id, slug),
  constraint services_id_brand_key unique (id, brand_id),
  constraint services_jenis_check check (jenis in ('nominal', 'tagihan')),
  constraint services_input_fields_check check (jsonb_typeof(input_fields) = 'array'),
  constraint services_biaya_check check (biaya_admin >= 0 and biaya_supplier >= 0)
);

create index if not exists services_brand_idx on public.services (brand_id);
create index if not exists services_brand_aktif_idx on public.services (brand_id, aktif);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  service_id uuid not null,
  nama text not null,
  harga_modal numeric(14, 2) not null,
  harga_jual numeric(14, 2) not null,
  urutan integer not null default 0,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_service_nama_key unique (service_id, nama),
  constraint products_id_service_key unique (id, service_id),
  constraint products_service_brand_fkey foreign key (service_id, brand_id)
    references public.services (id, brand_id) on delete cascade,
  constraint products_harga_check check (harga_modal >= 0 and harga_jual >= 0)
);

create index if not exists products_brand_idx on public.products (brand_id);
create index if not exists products_service_idx on public.products (service_id);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  nama text not null,
  tipe text not null,
  biaya_admin numeric(14, 2) not null default 0,
  urutan integer not null default 0,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_methods_brand_nama_key unique (brand_id, nama),
  constraint payment_methods_id_brand_key unique (id, brand_id),
  constraint payment_methods_tipe_check check (tipe in ('qr', 'ewallet', 'va')),
  constraint payment_methods_biaya_check check (biaya_admin >= 0)
);

create index if not exists payment_methods_brand_idx on public.payment_methods (brand_id);

drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists payment_methods_set_updated_at on public.payment_methods;
create trigger payment_methods_set_updated_at
  before update on public.payment_methods
  for each row execute function public.set_updated_at();
