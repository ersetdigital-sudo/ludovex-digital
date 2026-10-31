-- 06 — RLS, hak akses publik, dan hak eksekusi function

alter table public.brands enable row level security;
alter table public.admins enable row level security;
alter table public.services enable row level security;
alter table public.products enable row level security;
alter table public.payment_methods enable row level security;
alter table public.vouchers enable row level security;
alter table public.orders enable row level security;
alter table public.order_logs enable row level security;

-- ============================================================
-- brands
-- ============================================================

drop policy if exists brands_public_read on public.brands;
create policy brands_public_read
  on public.brands for select
  to anon
  using (true);

drop policy if exists brands_admin_read on public.brands;
create policy brands_admin_read
  on public.brands for select
  to authenticated
  using (public.is_brand_admin(id));

drop policy if exists brands_admin_update on public.brands;
create policy brands_admin_update
  on public.brands for update
  to authenticated
  using (public.is_brand_admin(id))
  with check (public.is_brand_admin(id));

drop policy if exists brands_super_insert on public.brands;
create policy brands_super_insert
  on public.brands for insert
  to authenticated
  with check (public.is_super_admin());

drop policy if exists brands_super_delete on public.brands;
create policy brands_super_delete
  on public.brands for delete
  to authenticated
  using (public.is_super_admin());

-- ============================================================
-- admins
-- ============================================================

drop policy if exists admins_select on public.admins;
create policy admins_select
  on public.admins for select
  to authenticated
  using (
    public.is_super_admin()
    or user_id = auth.uid()
    or public.is_brand_admin(brand_id)
  );

drop policy if exists admins_insert on public.admins;
create policy admins_insert
  on public.admins for insert
  to authenticated
  with check (
    public.is_super_admin()
    or (
      brand_id is not null
      and public.is_brand_owner(brand_id)
      and role in ('owner', 'admin')
    )
  );

drop policy if exists admins_update on public.admins;
create policy admins_update
  on public.admins for update
  to authenticated
  using (public.is_super_admin() or public.is_brand_owner(brand_id))
  with check (
    public.is_super_admin()
    or (
      brand_id is not null
      and public.is_brand_owner(brand_id)
      and role in ('owner', 'admin')
    )
  );

drop policy if exists admins_delete on public.admins;
create policy admins_delete
  on public.admins for delete
  to authenticated
  using (public.is_super_admin() or public.is_brand_owner(brand_id));

-- ============================================================
-- katalog publik
-- ============================================================

drop policy if exists services_public_read on public.services;
create policy services_public_read
  on public.services for select
  to anon
  using (aktif);

drop policy if exists services_admin_read on public.services;
create policy services_admin_read
  on public.services for select
  to authenticated
  using (public.is_brand_admin(brand_id));

drop policy if exists services_admin_write on public.services;
create policy services_admin_write
  on public.services for all
  to authenticated
  using (public.is_brand_admin(brand_id))
  with check (public.is_brand_admin(brand_id));

drop policy if exists products_public_read on public.products;
create policy products_public_read
  on public.products for select
  to anon
  using (aktif);

drop policy if exists products_admin_read on public.products;
create policy products_admin_read
  on public.products for select
  to authenticated
  using (public.is_brand_admin(brand_id));

drop policy if exists products_admin_write on public.products;
create policy products_admin_write
  on public.products for all
  to authenticated
  using (public.is_brand_admin(brand_id))
  with check (public.is_brand_admin(brand_id));

drop policy if exists payment_methods_public_read on public.payment_methods;
create policy payment_methods_public_read
  on public.payment_methods for select
  to anon
  using (aktif);

drop policy if exists payment_methods_admin_read on public.payment_methods;
create policy payment_methods_admin_read
  on public.payment_methods for select
  to authenticated
  using (public.is_brand_admin(brand_id));

drop policy if exists payment_methods_admin_write on public.payment_methods;
create policy payment_methods_admin_write
  on public.payment_methods for all
  to authenticated
  using (public.is_brand_admin(brand_id))
  with check (public.is_brand_admin(brand_id));

-- ============================================================
-- voucher (tidak pernah dibaca anon)
-- ============================================================

drop policy if exists vouchers_admin_all on public.vouchers;
create policy vouchers_admin_all
  on public.vouchers for all
  to authenticated
  using (public.is_brand_admin(brand_id))
  with check (public.is_brand_admin(brand_id));

-- ============================================================
-- orders & order_logs (admin hanya baca; perubahan lewat RPC)
-- ============================================================

drop policy if exists orders_admin_read on public.orders;
create policy orders_admin_read
  on public.orders for select
  to authenticated
  using (public.is_brand_admin(brand_id));

drop policy if exists order_logs_admin_read on public.order_logs;
create policy order_logs_admin_read
  on public.order_logs for select
  to authenticated
  using (public.is_brand_admin(brand_id));

-- ============================================================
-- Hak tabel
-- ============================================================

revoke all on table
  public.brands,
  public.admins,
  public.services,
  public.products,
  public.payment_methods,
  public.vouchers,
  public.orders,
  public.order_logs
from anon;

revoke all on table
  public.brands,
  public.admins,
  public.services,
  public.products,
  public.payment_methods,
  public.vouchers,
  public.orders,
  public.order_logs
from authenticated;

-- Publik: hanya kolom aman, dan hanya baris yang lolos RLS.
grant select (
  id, nama, slug, domain, tagline, logo_url, warna_utama,
  wa_cs, qris_image_url, batas_bayar_menit, jam_cek_tagihan
) on public.brands to anon;

grant select (
  id, brand_id, nama, slug, jenis, input_fields, biaya_admin, urutan, aktif
) on public.services to anon;

grant select (
  id, brand_id, service_id, nama, harga_jual, urutan, aktif
) on public.products to anon;

grant select (
  id, brand_id, nama, tipe, biaya_admin, urutan, aktif
) on public.payment_methods to anon;

-- Admin: RLS membatasi per brand. Orders/logs hanya baca langsung.
grant select, insert, update, delete on public.brands to authenticated;
grant select, insert, update, delete on public.admins to authenticated;
grant select, insert, update, delete on public.services to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.payment_methods to authenticated;
grant select, insert, update, delete on public.vouchers to authenticated;
grant select on public.orders to authenticated;
grant select on public.order_logs to authenticated;

-- ============================================================
-- Hak eksekusi function
-- ============================================================

-- Helper akses dipakai oleh policy RLS dan function.
revoke execute on function public.is_super_admin() from PUBLIC, anon;
revoke execute on function public.is_brand_admin(uuid) from PUBLIC, anon;
revoke execute on function public.is_brand_owner(uuid) from PUBLIC, anon;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.is_brand_admin(uuid) to authenticated;
grant execute on function public.is_brand_owner(uuid) to authenticated;

-- Helper internal tidak boleh dipanggil langsung oleh client.
revoke execute on function public.validasi_input(jsonb, jsonb) from PUBLIC, anon, authenticated;
revoke execute on function public.next_order_ref(uuid) from PUBLIC, anon, authenticated;
revoke execute on function public.hitung_potongan_voucher(text, numeric, numeric, numeric) from PUBLIC, anon, authenticated;
revoke execute on function public.mask_nomor(text) from PUBLIC, anon, authenticated;
revoke execute on function public.cancel_expired_orders() from PUBLIC, anon, authenticated;

-- Function publik.
revoke execute on function public.create_order(text, uuid, uuid, text, jsonb, uuid, text) from PUBLIC, anon, authenticated;
revoke execute on function public.create_bill_check(text, uuid, text, jsonb, text, uuid, text) from PUBLIC, anon, authenticated;
revoke execute on function public.get_payment(text) from PUBLIC, anon, authenticated;
revoke execute on function public.cek_voucher(text, text, uuid, numeric) from PUBLIC, anon, authenticated;
revoke execute on function public.cek_order(text, text, text) from PUBLIC, anon, authenticated;

grant execute on function public.create_order(text, uuid, uuid, text, jsonb, uuid, text) to anon, authenticated;
grant execute on function public.create_bill_check(text, uuid, text, jsonb, text, uuid, text) to anon, authenticated;
grant execute on function public.get_payment(text) to anon, authenticated;
grant execute on function public.cek_voucher(text, text, uuid, numeric) to anon, authenticated;
grant execute on function public.cek_order(text, text, text) to anon, authenticated;

-- Function admin.
revoke execute on function public.set_bill_amount(uuid, numeric, numeric) from PUBLIC, anon, authenticated;
revoke execute on function public.update_order_status(uuid, text, text, text) from PUBLIC, anon, authenticated;
revoke execute on function public.dashboard_summary(uuid, date) from PUBLIC, anon, authenticated;

grant execute on function public.set_bill_amount(uuid, numeric, numeric) to authenticated;
grant execute on function public.update_order_status(uuid, text, text, text) to authenticated;
grant execute on function public.dashboard_summary(uuid, date) to authenticated;
