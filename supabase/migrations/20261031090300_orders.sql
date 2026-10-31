-- 04 — orders & order_logs

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete restrict,
  ref text not null,
  service_id uuid not null,
  product_id uuid,
  nama_layanan text not null,
  nama_produk text,
  harga_modal numeric(14, 2),
  harga_jual numeric(14, 2),
  input_pembeli jsonb not null default '{}'::jsonb,
  nomor_tujuan text not null,
  wa_pembeli text,
  nominal_tagihan numeric(14, 2),
  denda numeric(14, 2) not null default 0,
  payment_method_id uuid,
  metode_bayar text,
  biaya_admin numeric(14, 2) not null default 0,
  voucher_kode text,
  potongan numeric(14, 2) not null default 0,
  total numeric(14, 2),
  status text not null default 'menunggu_bayar',
  sn text,
  expires_at timestamptz,
  checked_at timestamptz,
  paid_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_ref_key unique (ref),
  constraint orders_id_brand_key unique (id, brand_id),
  constraint orders_status_check check (
    status in ('menunggu_cek', 'menunggu_bayar', 'sudah_bayar', 'sukses', 'dibatalkan')
  ),
  constraint orders_nomor_check check (btrim(nomor_tujuan) <> ''),
  constraint orders_input_check check (jsonb_typeof(input_pembeli) = 'object'),
  constraint orders_money_check check (
    biaya_admin >= 0
    and potongan >= 0
    and denda >= 0
    and (harga_modal is null or harga_modal >= 0)
    and (harga_jual is null or harga_jual >= 0)
    and (nominal_tagihan is null or nominal_tagihan >= 0)
    and (total is null or total >= 0)
  ),
  constraint orders_service_brand_fkey foreign key (service_id, brand_id)
    references public.services (id, brand_id) on delete restrict,
  constraint orders_product_service_fkey foreign key (product_id, service_id)
    references public.products (id, service_id) on delete restrict,
  constraint orders_payment_brand_fkey foreign key (payment_method_id, brand_id)
    references public.payment_methods (id, brand_id) on delete restrict
);

create index if not exists orders_brand_created_idx
  on public.orders (brand_id, created_at desc);
create index if not exists orders_brand_nomor_status_idx
  on public.orders (brand_id, nomor_tujuan, status);
create index if not exists orders_brand_status_idx
  on public.orders (brand_id, status);
create index if not exists orders_expiry_idx
  on public.orders (expires_at) where status = 'menunggu_bayar';

create table if not exists public.order_logs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null,
  order_id uuid not null,
  status_dari text,
  status_ke text not null,
  catatan text,
  admin_id uuid references public.admins (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint order_logs_status_dari_check check (
    status_dari is null
    or status_dari in ('menunggu_cek', 'menunggu_bayar', 'sudah_bayar', 'sukses', 'dibatalkan')
  ),
  constraint order_logs_status_ke_check check (
    status_ke in ('menunggu_cek', 'menunggu_bayar', 'sudah_bayar', 'sukses', 'dibatalkan')
  ),
  constraint order_logs_order_brand_fkey foreign key (order_id, brand_id)
    references public.orders (id, brand_id) on delete cascade
);

create index if not exists order_logs_order_idx
  on public.order_logs (order_id, created_at);
create index if not exists order_logs_brand_idx
  on public.order_logs (brand_id, created_at desc);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists order_logs_set_updated_at on public.order_logs;
create trigger order_logs_set_updated_at
  before update on public.order_logs
  for each row execute function public.set_updated_at();
