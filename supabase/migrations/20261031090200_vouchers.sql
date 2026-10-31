-- 03 — voucher

create or replace function public.normalize_voucher_kode()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
  new.kode := upper(btrim(new.kode));
  return new;
end;
$$;

create table if not exists public.vouchers (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id) on delete cascade,
  kode text not null,
  jenis text not null,
  nilai numeric(14, 2) not null,
  maks_potongan numeric(14, 2),
  min_transaksi numeric(14, 2) not null default 0,
  service_ids uuid[] not null default '{}'::uuid[],
  berlaku_sampai date,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vouchers_brand_kode_key unique (brand_id, kode),
  constraint vouchers_jenis_check check (jenis in ('persen', 'tetap')),
  constraint vouchers_nilai_check check (nilai > 0),
  constraint vouchers_persen_check check (jenis <> 'persen' or nilai <= 100),
  constraint vouchers_maks_check check (maks_potongan is null or maks_potongan > 0),
  constraint vouchers_min_check check (min_transaksi >= 0),
  constraint vouchers_kode_upper_check check (kode = upper(btrim(kode)))
);

create index if not exists vouchers_brand_idx on public.vouchers (brand_id);

drop trigger if exists vouchers_normalize_kode on public.vouchers;
create trigger vouchers_normalize_kode
  before insert or update on public.vouchers
  for each row execute function public.normalize_voucher_kode();

drop trigger if exists vouchers_set_updated_at on public.vouchers;
create trigger vouchers_set_updated_at
  before update on public.vouchers
  for each row execute function public.set_updated_at();
