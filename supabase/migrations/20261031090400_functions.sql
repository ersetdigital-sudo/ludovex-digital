-- 05 — helper internal + function publik + function admin
-- Semua function yang mengubah data berjalan sebagai SECURITY DEFINER dengan search_path tetap.
-- Hak eksekusi diatur di migration RLS.

-- ============================================================
-- Helper akses
-- ============================================================

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
      and a.aktif
      and a.role = 'super_admin'
  );
$$;

create or replace function public.is_brand_admin(p_brand_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
      and a.aktif
      and (a.role = 'super_admin' or a.brand_id = p_brand_id)
  );
$$;

create or replace function public.is_brand_owner(p_brand_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
      and a.aktif
      and (a.role = 'super_admin' or (a.role = 'owner' and a.brand_id = p_brand_id))
  );
$$;

-- ============================================================
-- Helper order
-- ============================================================

create or replace function public.validasi_input(p_fields jsonb, p_input jsonb)
returns void
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_field jsonb;
  v_key text;
  v_label text;
begin
  if p_fields is null or jsonb_typeof(p_fields) <> 'array' then
    return;
  end if;

  for v_field in select value from jsonb_array_elements(p_fields) loop
    v_key := nullif(btrim(coalesce(v_field ->> 'key', '')), '');
    continue when v_key is null;

    if coalesce((v_field ->> 'wajib')::boolean, false)
       and coalesce(btrim(p_input ->> v_key), '') = '' then
      v_label := coalesce(nullif(v_field ->> 'label', ''), v_key);
      raise exception 'Kolom % wajib diisi', v_label;
    end if;
  end loop;
end;
$$;

create or replace function public.next_order_ref(p_brand_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_kode text;
  v_ref text;
begin
  select b.kode_ref into v_kode
  from public.brands b
  where b.id = p_brand_id;

  if v_kode is null then
    raise exception 'Brand tidak ditemukan';
  end if;

  loop
    v_ref := v_kode || '-' || to_char((now() at time zone 'Asia/Jakarta'), 'YYMMDD')
      || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.orders o where o.ref = v_ref);
  end loop;

  return v_ref;
end;
$$;

create or replace function public.hitung_potongan_voucher(
  p_jenis text,
  p_nilai numeric,
  p_maks_potongan numeric,
  p_subtotal numeric
)
returns numeric
language sql
immutable
as $$
  select greatest(
    0,
    least(
      case
        when p_jenis = 'persen' then floor(coalesce(p_subtotal, 0) * p_nilai / 100)
        else p_nilai
      end,
      coalesce(p_maks_potongan, 999999999999::numeric),
      coalesce(p_subtotal, 0)
    )
  );
$$;

create or replace function public.mask_nomor(p_nomor text)
returns text
language sql
immutable
as $$
  select case
    when p_nomor is null or btrim(p_nomor) = '' then ''
    when length(btrim(p_nomor)) <= 4 then btrim(p_nomor)
    when length(btrim(p_nomor)) <= 8 then
      left(btrim(p_nomor), 2)
      || repeat('*', length(btrim(p_nomor)) - 4)
      || right(btrim(p_nomor), 2)
    else
      left(btrim(p_nomor), 4)
      || repeat('*', greatest(length(btrim(p_nomor)) - 7, 0))
      || right(btrim(p_nomor), 3)
  end;
$$;

create or replace function public.cancel_expired_orders()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer := 0;
begin
  with expired as (
    update public.orders o
       set status = 'dibatalkan',
           cancelled_at = now(),
           cancel_reason = 'Melewati batas pembayaran',
           updated_at = now()
     where o.status = 'menunggu_bayar'
       and o.expires_at is not null
       and o.expires_at < now()
    returning o.id, o.brand_id
  ),
  logs as (
    insert into public.order_logs (brand_id, order_id, status_dari, status_ke, catatan)
    select e.brand_id, e.id, 'menunggu_bayar', 'dibatalkan',
           'Batal otomatis: melewati batas pembayaran'
    from expired e
    returning 1
  )
  select count(*) into v_count from expired;

  return v_count;
end;
$$;

-- ============================================================
-- Function publik
-- ============================================================

create or replace function public.create_order(
  p_brand_slug text,
  p_service_id uuid,
  p_product_id uuid,
  p_nomor_tujuan text,
  p_input jsonb,
  p_payment_method_id uuid,
  p_voucher_kode text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_brand public.brands%rowtype;
  v_service public.services%rowtype;
  v_product public.products%rowtype;
  v_method public.payment_methods%rowtype;
  v_voucher public.vouchers%rowtype;
  v_nomor text := btrim(coalesce(p_nomor_tujuan, ''));
  v_input jsonb := coalesce(p_input, '{}'::jsonb);
  v_kode text := nullif(btrim(upper(coalesce(p_voucher_kode, ''))), '');
  v_potongan numeric := 0;
  v_total numeric;
  v_pending bigint;
  v_ref text;
  v_expires timestamptz;
  v_order_id uuid;
begin
  perform public.cancel_expired_orders();

  select * into v_brand
  from public.brands b
  where b.slug = p_brand_slug;
  if not found then
    raise exception 'Brand tidak ditemukan';
  end if;

  if v_nomor = '' then
    raise exception 'Nomor tujuan wajib diisi';
  end if;
  if jsonb_typeof(v_input) <> 'object' then
    raise exception 'Data pembeli tidak valid';
  end if;

  select * into v_service
  from public.services s
  where s.id = p_service_id
    and s.brand_id = v_brand.id
    and s.aktif
    and s.jenis = 'nominal';
  if not found then
    raise exception 'Layanan tidak tersedia';
  end if;

  perform public.validasi_input(v_service.input_fields, v_input);

  select * into v_product
  from public.products p
  where p.id = p_product_id
    and p.service_id = v_service.id
    and p.brand_id = v_brand.id
    and p.aktif;
  if not found then
    raise exception 'Produk tidak tersedia';
  end if;

  select * into v_method
  from public.payment_methods pm
  where pm.id = p_payment_method_id
    and pm.brand_id = v_brand.id
    and pm.aktif;
  if not found then
    raise exception 'Metode pembayaran tidak tersedia';
  end if;

  if v_kode is not null then
    select * into v_voucher
    from public.vouchers v
    where v.brand_id = v_brand.id
      and v.kode = v_kode
      and v.aktif
      and (v.berlaku_sampai is null
           or v.berlaku_sampai >= (now() at time zone 'Asia/Jakarta')::date)
      and v.min_transaksi <= v_product.harga_jual
      and (coalesce(cardinality(v.service_ids), 0) = 0
           or v_service.id = any (v.service_ids));
    if not found then
      raise exception 'Voucher tidak valid';
    end if;

    v_potongan := public.hitung_potongan_voucher(
      v_voucher.jenis,
      v_voucher.nilai,
      v_voucher.maks_potongan,
      v_product.harga_jual
    );
  end if;

  select count(*) into v_pending
  from public.orders o
  where o.brand_id = v_brand.id
    and o.nomor_tujuan = v_nomor
    and o.status = 'menunggu_bayar';
  if v_pending >= v_brand.maks_order_pending then
    raise exception 'Terlalu banyak pesanan menunggu pembayaran untuk nomor ini';
  end if;

  v_total := v_product.harga_jual + v_method.biaya_admin - v_potongan;
  if v_total < 0 then
    v_total := 0;
  end if;

  v_ref := public.next_order_ref(v_brand.id);
  v_expires := now() + make_interval(mins => v_brand.batas_bayar_menit);

  insert into public.orders (
    brand_id, ref, service_id, product_id,
    nama_layanan, nama_produk, harga_modal, harga_jual,
    input_pembeli, nomor_tujuan, wa_pembeli,
    payment_method_id, metode_bayar, biaya_admin,
    voucher_kode, potongan, total,
    status, expires_at
  ) values (
    v_brand.id, v_ref, v_service.id, v_product.id,
    v_service.nama, v_product.nama, v_product.harga_modal, v_product.harga_jual,
    v_input, v_nomor, nullif(btrim(coalesce(v_input ->> 'wa_pembeli', '')), ''),
    v_method.id, v_method.nama, v_method.biaya_admin,
    v_kode, v_potongan, v_total,
    'menunggu_bayar', v_expires
  )
  returning id into v_order_id;

  insert into public.order_logs (brand_id, order_id, status_dari, status_ke, catatan)
  values (v_brand.id, v_order_id, null, 'menunggu_bayar', 'Order dibuat');

  return jsonb_build_object(
    'ref', v_ref,
    'total', v_total,
    'expires_at', v_expires
  );
end;
$$;

create or replace function public.create_bill_check(
  p_brand_slug text,
  p_service_id uuid,
  p_nomor_tujuan text,
  p_input jsonb,
  p_wa_pembeli text,
  p_payment_method_id uuid,
  p_voucher_kode text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_brand public.brands%rowtype;
  v_service public.services%rowtype;
  v_method public.payment_methods%rowtype;
  v_voucher public.vouchers%rowtype;
  v_nomor text := btrim(coalesce(p_nomor_tujuan, ''));
  v_input jsonb := coalesce(p_input, '{}'::jsonb);
  v_wa text := regexp_replace(coalesce(p_wa_pembeli, ''), '[^0-9]', '', 'g');
  v_kode text := nullif(btrim(upper(coalesce(p_voucher_kode, ''))), '');
  v_biaya_admin numeric;
  v_pending bigint;
  v_ref text;
  v_order_id uuid;
begin
  perform public.cancel_expired_orders();

  select * into v_brand
  from public.brands b
  where b.slug = p_brand_slug;
  if not found then
    raise exception 'Brand tidak ditemukan';
  end if;

  if v_nomor = '' then
    raise exception 'Nomor tujuan wajib diisi';
  end if;
  if jsonb_typeof(v_input) <> 'object' then
    raise exception 'Data pembeli tidak valid';
  end if;
  if length(v_wa) < 8 then
    raise exception 'Nomor WhatsApp wajib diisi';
  end if;

  select * into v_service
  from public.services s
  where s.id = p_service_id
    and s.brand_id = v_brand.id
    and s.aktif
    and s.jenis = 'tagihan';
  if not found then
    raise exception 'Layanan tidak tersedia';
  end if;

  perform public.validasi_input(v_service.input_fields, v_input);

  select * into v_method
  from public.payment_methods pm
  where pm.id = p_payment_method_id
    and pm.brand_id = v_brand.id
    and pm.aktif;
  if not found then
    raise exception 'Metode pembayaran tidak tersedia';
  end if;

  v_biaya_admin := v_method.biaya_admin + v_service.biaya_admin;

  if v_kode is not null then
    select * into v_voucher
    from public.vouchers v
    where v.brand_id = v_brand.id
      and v.kode = v_kode
      and v.aktif
      and (v.berlaku_sampai is null
           or v.berlaku_sampai >= (now() at time zone 'Asia/Jakarta')::date)
      and (coalesce(cardinality(v.service_ids), 0) = 0
           or v_service.id = any (v.service_ids));
    if not found then
      raise exception 'Voucher tidak valid';
    end if;
  end if;

  select count(*) into v_pending
  from public.orders o
  where o.brand_id = v_brand.id
    and o.nomor_tujuan = v_nomor
    and o.status in ('menunggu_cek', 'menunggu_bayar');
  if v_pending >= v_brand.maks_order_pending then
    raise exception 'Terlalu banyak pesanan menunggu untuk nomor ini';
  end if;

  v_ref := public.next_order_ref(v_brand.id);

  insert into public.orders (
    brand_id, ref, service_id,
    nama_layanan,
    input_pembeli, nomor_tujuan, wa_pembeli,
    payment_method_id, metode_bayar, biaya_admin,
    voucher_kode, potongan,
    status
  ) values (
    v_brand.id, v_ref, v_service.id,
    v_service.nama,
    v_input, v_nomor, v_wa,
    v_method.id, v_method.nama, v_biaya_admin,
    v_kode, 0,
    'menunggu_cek'
  )
  returning id into v_order_id;

  insert into public.order_logs (brand_id, order_id, status_dari, status_ke, catatan)
  values (v_brand.id, v_order_id, null, 'menunggu_cek', 'Cek tagihan dibuat');

  return jsonb_build_object(
    'ref', v_ref,
    'jam_cek_tagihan', v_brand.jam_cek_tagihan
  );
end;
$$;

create or replace function public.get_payment(p_ref text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_result jsonb;
  v_ref text := btrim(coalesce(p_ref, ''));
begin
  if v_ref = '' then
    raise exception 'Ref wajib diisi';
  end if;

  perform public.cancel_expired_orders();

  select jsonb_build_object(
    'ref', o.ref,
    'status', o.status,
    'total', o.total,
    'nama_layanan', o.nama_layanan,
    'nama_produk', o.nama_produk,
    'nomor_tujuan', public.mask_nomor(o.nomor_tujuan),
    'metode_bayar', o.metode_bayar,
    'tipe_metode', pm.tipe,
    'biaya_admin', o.biaya_admin,
    'potongan', o.potongan,
    'voucher_kode', o.voucher_kode,
    'qris_image_url', b.qris_image_url,
    'logo_url', b.logo_url,
    'nama_brand', b.nama,
    'wa_cs', b.wa_cs,
    'expires_at', o.expires_at,
    'jam_cek_tagihan', b.jam_cek_tagihan,
    'nominal_tagihan', o.nominal_tagihan,
    'denda', o.denda,
    'created_at', o.created_at
  )
  into v_result
  from public.orders o
  join public.brands b on b.id = o.brand_id
  left join public.payment_methods pm on pm.id = o.payment_method_id
  where o.ref = v_ref;

  if v_result is null then
    raise exception 'Order tidak ditemukan';
  end if;

  return v_result;
end;
$$;

create or replace function public.cek_voucher(
  p_brand_slug text,
  p_kode text,
  p_service_id uuid default null,
  p_subtotal numeric default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_brand_id uuid;
  v_kode text := nullif(btrim(upper(coalesce(p_kode, ''))), '');
  v_subtotal numeric := greatest(coalesce(p_subtotal, 0), 0);
  v_voucher public.vouchers%rowtype;
  v_potongan numeric := 0;
begin
  select b.id into v_brand_id
  from public.brands b
  where b.slug = p_brand_slug;
  if v_brand_id is null then
    raise exception 'Brand tidak ditemukan';
  end if;

  if v_kode is null then
    return jsonb_build_object('valid', false, 'potongan', 0, 'pesan', 'Kode voucher tidak valid.');
  end if;

  select * into v_voucher
  from public.vouchers v
  where v.brand_id = v_brand_id
    and v.kode = v_kode;

  if not found then
    return jsonb_build_object('valid', false, 'potongan', 0, 'pesan', 'Kode voucher tidak valid.');
  end if;

  if not v_voucher.aktif
     or (v_voucher.berlaku_sampai is not null
         and v_voucher.berlaku_sampai < (now() at time zone 'Asia/Jakarta')::date) then
    return jsonb_build_object('valid', false, 'potongan', 0, 'pesan', 'Kode voucher tidak valid.');
  end if;

  if p_service_id is not null
     and coalesce(cardinality(v_voucher.service_ids), 0) > 0
     and not (p_service_id = any (v_voucher.service_ids)) then
    return jsonb_build_object(
      'valid', false,
      'potongan', 0,
      'pesan', 'Voucher tidak berlaku untuk layanan ini.'
    );
  end if;

  if v_subtotal > 0 and v_voucher.min_transaksi > v_subtotal then
    return jsonb_build_object(
      'valid', false,
      'potongan', 0,
      'pesan', 'Minimal transaksi belum terpenuhi untuk voucher ini.'
    );
  end if;

  if v_subtotal > 0 then
    v_potongan := public.hitung_potongan_voucher(
      v_voucher.jenis,
      v_voucher.nilai,
      v_voucher.maks_potongan,
      v_subtotal
    );
  end if;

  return jsonb_build_object(
    'valid', true,
    'potongan', v_potongan,
    'pesan', 'Voucher dapat dipakai.'
  );
end;
$$;

create or replace function public.cek_order(
  p_brand_slug text,
  p_ref text default null,
  p_nomor_tujuan text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_brand_id uuid;
  v_ref text := nullif(btrim(coalesce(p_ref, '')), '');
  v_nomor text := nullif(btrim(coalesce(p_nomor_tujuan, '')), '');
  v_result jsonb;
begin
  select b.id into v_brand_id
  from public.brands b
  where b.slug = p_brand_slug;
  if v_brand_id is null then
    raise exception 'Brand tidak ditemukan';
  end if;

  if v_ref is null and v_nomor is null then
    raise exception 'Ref atau nomor tujuan wajib diisi';
  end if;

  perform public.cancel_expired_orders();

  select coalesce(jsonb_agg(item order by dibuat desc), '[]'::jsonb)
  into v_result
  from (
    select
      jsonb_build_object(
        'ref', o.ref,
        'layanan', o.nama_layanan,
        'produk', o.nama_produk,
        'nomor_tujuan', public.mask_nomor(o.nomor_tujuan),
        'total', o.total,
        'status', o.status,
        'sn', o.sn,
        'created_at', o.created_at,
        'expires_at', o.expires_at,
        'paid_at', o.paid_at,
        'completed_at', o.completed_at
      ) as item,
      o.created_at as dibuat
    from public.orders o
    where o.brand_id = v_brand_id
      and (
        case
          when v_ref is not null then o.ref = v_ref
          else o.nomor_tujuan = v_nomor
        end
      )
    order by o.created_at desc
    limit 10
  ) s;

  return coalesce(v_result, '[]'::jsonb);
end;
$$;

-- ============================================================
-- Function admin
-- ============================================================

create or replace function public.set_bill_amount(
  p_order_id uuid,
  p_nominal_tagihan numeric,
  p_denda numeric default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
  v_brand public.brands%rowtype;
  v_service public.services%rowtype;
  v_voucher public.vouchers%rowtype;
  v_nominal numeric := coalesce(p_nominal_tagihan, 0);
  v_denda numeric := coalesce(p_denda, 0);
  v_base numeric;
  v_potongan numeric := 0;
  v_total numeric;
  v_expires timestamptz;
  v_kode text;
  v_voucher_ok boolean := false;
  v_admin_id uuid;
  v_catatan text := 'Nominal tagihan ditetapkan';
begin
  select * into v_order
  from public.orders o
  where o.id = p_order_id
  for update;
  if not found then
    raise exception 'Order tidak ditemukan';
  end if;
  if not public.is_brand_admin(v_order.brand_id) then
    raise exception 'Akses ditolak';
  end if;
  if v_order.status <> 'menunggu_cek' then
    raise exception 'Order tidak dalam status menunggu_cek';
  end if;

  if v_nominal <= 0 then
    raise exception 'Nominal tagihan harus lebih dari 0';
  end if;
  if v_denda < 0 then
    raise exception 'Denda tidak boleh negatif';
  end if;

  select * into v_brand from public.brands b where b.id = v_order.brand_id;
  if not found then
    raise exception 'Brand tidak ditemukan';
  end if;

  select * into v_service from public.services s where s.id = v_order.service_id;
  if not found then
    raise exception 'Layanan tidak ditemukan';
  end if;
  if v_service.jenis <> 'tagihan' then
    raise exception 'Order ini bukan layanan tagihan';
  end if;
  if v_order.payment_method_id is null then
    raise exception 'Metode pembayaran order tidak tersedia';
  end if;

  v_base := v_nominal + v_denda;
  v_kode := nullif(btrim(upper(coalesce(v_order.voucher_kode, ''))), '');

  if v_kode is not null then
    select * into v_voucher
    from public.vouchers v
    where v.brand_id = v_order.brand_id
      and v.kode = v_kode;

    if found
       and v_voucher.aktif
       and (v_voucher.berlaku_sampai is null
            or v_voucher.berlaku_sampai >= (now() at time zone 'Asia/Jakarta')::date)
       and v_voucher.min_transaksi <= v_base
       and (coalesce(cardinality(v_voucher.service_ids), 0) = 0
            or v_order.service_id = any (v_voucher.service_ids)) then
      v_potongan := public.hitung_potongan_voucher(
        v_voucher.jenis,
        v_voucher.nilai,
        v_voucher.maks_potongan,
        v_base
      );
      v_voucher_ok := true;
    end if;
  end if;

  if v_kode is not null and not v_voucher_ok then
    v_catatan := v_catatan || ' (voucher ' || v_kode || ' tidak memenuhi syarat, tidak dipakai)';
  end if;

  v_total := v_base + v_order.biaya_admin - v_potongan;
  if v_total < 0 then
    v_total := 0;
  end if;
  v_expires := now() + make_interval(mins => v_brand.batas_bayar_menit);

  update public.orders
     set nominal_tagihan = v_nominal,
         denda = v_denda,
         harga_jual = v_base,
         harga_modal = v_nominal + coalesce(v_service.biaya_supplier, 0),
         potongan = v_potongan,
         voucher_kode = case when v_voucher_ok then v_kode else null end,
         total = v_total,
         status = 'menunggu_bayar',
         checked_at = now(),
         expires_at = v_expires
   where id = p_order_id;

  select a.id into v_admin_id
  from public.admins a
  where a.user_id = auth.uid()
    and a.aktif
    and (a.role = 'super_admin' or a.brand_id = v_order.brand_id)
  order by (a.role = 'super_admin') desc
  limit 1;

  insert into public.order_logs (brand_id, order_id, status_dari, status_ke, catatan, admin_id)
  values (v_order.brand_id, p_order_id, 'menunggu_cek', 'menunggu_bayar', v_catatan, v_admin_id);

  return jsonb_build_object(
    'ref', v_order.ref,
    'total', v_total,
    'expires_at', v_expires
  );
end;
$$;

create or replace function public.update_order_status(
  p_order_id uuid,
  p_status text,
  p_sn text default null,
  p_catatan text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.orders%rowtype;
  v_status text := lower(btrim(coalesce(p_status, '')));
  v_sn text := nullif(btrim(coalesce(p_sn, '')), '');
  v_catatan text := nullif(btrim(coalesce(p_catatan, '')), '');
  v_admin_id uuid;
  v_sn_final text;
  v_updated timestamptz;
begin
  select * into v_order
  from public.orders o
  where o.id = p_order_id
  for update;
  if not found then
    raise exception 'Order tidak ditemukan';
  end if;
  if not public.is_brand_admin(v_order.brand_id) then
    raise exception 'Akses ditolak';
  end if;

  if v_order.status = 'menunggu_bayar' and v_status = 'sudah_bayar' then
    update public.orders
       set status = 'sudah_bayar',
           paid_at = now()
     where id = p_order_id;
  elsif v_order.status = 'sudah_bayar' and v_status = 'sukses' then
    if v_sn is null then
      raise exception 'SN wajib diisi untuk status sukses';
    end if;
    update public.orders
       set status = 'sukses',
           sn = v_sn,
           completed_at = now()
     where id = p_order_id;
  elsif v_order.status in ('menunggu_cek', 'menunggu_bayar', 'sudah_bayar')
        and v_status = 'dibatalkan' then
    update public.orders
       set status = 'dibatalkan',
           cancelled_at = now(),
           cancel_reason = coalesce(v_catatan, 'Dibatalkan admin')
     where id = p_order_id;
  else
    raise exception 'Perubahan status dari % ke % tidak diizinkan', v_order.status, v_status;
  end if;

  select a.id into v_admin_id
  from public.admins a
  where a.user_id = auth.uid()
    and a.aktif
    and (a.role = 'super_admin' or a.brand_id = v_order.brand_id)
  order by (a.role = 'super_admin') desc
  limit 1;

  insert into public.order_logs (brand_id, order_id, status_dari, status_ke, catatan, admin_id)
  values (v_order.brand_id, p_order_id, v_order.status, v_status, v_catatan, v_admin_id);

  select o.sn, o.updated_at into v_sn_final, v_updated
  from public.orders o
  where o.id = p_order_id;

  return jsonb_build_object(
    'ref', v_order.ref,
    'status', v_status,
    'sn', v_sn_final,
    'updated_at', v_updated
  );
end;
$$;

create or replace function public.dashboard_summary(
  p_brand_id uuid default null,
  p_bulan date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_brand uuid;
  v_bulan date;
  v_start timestamptz;
  v_end timestamptz;
  v_omzet numeric := 0;
  v_modal numeric := 0;
  v_potongan numeric := 0;
  v_transaksi bigint := 0;
  v_batal bigint := 0;
  v_dibuat bigint := 0;
  v_cek bigint := 0;
  v_bayar bigint := 0;
  v_terlaris jsonb := '[]'::jsonb;
begin
  if p_brand_id is null then
    if public.is_super_admin() then
      v_brand := null;
    else
      select a.brand_id into v_brand
      from public.admins a
      where a.user_id = auth.uid()
        and a.aktif
        and a.brand_id is not null
      order by a.created_at
      limit 1;
      if v_brand is null then
        raise exception 'Akses ditolak';
      end if;
    end if;
  else
    if not public.is_brand_admin(p_brand_id) then
      raise exception 'Akses ditolak';
    end if;
    v_brand := p_brand_id;
  end if;

  v_bulan := date_trunc(
    'month',
    coalesce(p_bulan, (now() at time zone 'Asia/Jakarta')::date)
  )::date;
  v_start := (v_bulan::timestamp) at time zone 'Asia/Jakarta';
  v_end := ((v_bulan + interval '1 month')::timestamp) at time zone 'Asia/Jakarta';

  select
    coalesce(sum(o.total), 0),
    coalesce(sum(o.harga_modal), 0),
    coalesce(sum(o.potongan), 0),
    count(*)
  into v_omzet, v_modal, v_potongan, v_transaksi
  from public.orders o
  where (v_brand is null or o.brand_id = v_brand)
    and o.status = 'sukses'
    and o.completed_at >= v_start
    and o.completed_at < v_end;

  select
    count(*) filter (where o.status = 'dibatalkan'),
    count(*)
  into v_batal, v_dibuat
  from public.orders o
  where (v_brand is null or o.brand_id = v_brand)
    and o.created_at >= v_start
    and o.created_at < v_end;

  select
    count(*) filter (where o.status = 'menunggu_cek'),
    count(*) filter (where o.status = 'sudah_bayar')
  into v_cek, v_bayar
  from public.orders o
  where (v_brand is null or o.brand_id = v_brand);

  select coalesce(
    jsonb_agg(
      jsonb_build_object('nama', t.nama, 'jumlah', t.jumlah, 'omzet', t.omzet)
      order by t.jumlah desc, t.omzet desc
    ),
    '[]'::jsonb
  )
  into v_terlaris
  from (
    select
      o.nama_layanan as nama,
      count(*) as jumlah,
      coalesce(sum(o.total), 0) as omzet
    from public.orders o
    where (v_brand is null or o.brand_id = v_brand)
      and o.status = 'sukses'
      and o.completed_at >= v_start
      and o.completed_at < v_end
    group by o.nama_layanan
    order by count(*) desc, coalesce(sum(o.total), 0) desc
    limit 3
  ) t;

  return jsonb_build_object(
    'brand_id', v_brand,
    'bulan', v_bulan,
    'omzet', v_omzet,
    'total_modal', v_modal,
    'total_potongan_voucher', v_potongan,
    'net_profit', v_omzet - v_modal,
    'jumlah_transaksi', v_transaksi,
    'rata_rata', case when v_transaksi > 0 then round(v_omzet / v_transaksi, 2) else 0 end,
    'persentase_batal', case
      when v_dibuat > 0 then round((v_batal::numeric * 100) / v_dibuat, 2)
      else 0
    end,
    'layanan_terlaris', v_terlaris,
    'menunggu_cek', v_cek,
    'sudah_bayar', v_bayar
  );
end;
$$;

-- ============================================================
-- Pembatalan otomatis tiap menit (kalau pg_cron tersedia)
-- ============================================================

do $do$
declare
  v_job bigint;
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    begin
      execute 'create extension if not exists pg_cron';

      for v_job in
        execute 'select jobid from cron.job where jobname = ''cancel-expired-orders'''
      loop
        execute format('select cron.unschedule(%s)', v_job);
      end loop;

      execute $cron$
        select cron.schedule(
          'cancel-expired-orders',
          '* * * * *',
          'select public.cancel_expired_orders();'
        )
      $cron$;
    exception when others then
      raise notice 'pg_cron tidak dapat diaktifkan: %', sqlerrm;
    end;
  else
    raise notice 'pg_cron tidak tersedia; pembatalan otomatis hanya lewat get_payment/cek_order';
  end if;
end;
$do$;
