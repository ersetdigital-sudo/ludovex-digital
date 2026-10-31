-- 07 — storage logo & QRIS per brand
-- Path wajib: <brand_id>/<nama-file>

create or replace function public.storage_brand_id(p_name text)
returns uuid
language plpgsql
immutable
set search_path = pg_catalog, pg_temp
as $$
declare
  v_folder text;
begin
  v_folder := split_part(coalesce(p_name, ''), '/', 1);
  if v_folder ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return v_folder::uuid;
  end if;
  return null;
end;
$$;

revoke execute on function public.storage_brand_id(text) from PUBLIC, anon;
grant execute on function public.storage_brand_id(text) to authenticated;

insert into storage.buckets (id, name, public)
values
  ('brand-logos', 'brand-logos', true),
  ('brand-qris', 'brand-qris', true)
on conflict (id) do nothing;

drop policy if exists "brand assets public read" on storage.objects;
create policy "brand assets public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id in ('brand-logos', 'brand-qris'));

drop policy if exists "brand assets admin insert" on storage.objects;
create policy "brand assets admin insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id in ('brand-logos', 'brand-qris')
    and public.is_brand_admin(public.storage_brand_id(name))
  );

drop policy if exists "brand assets admin update" on storage.objects;
create policy "brand assets admin update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id in ('brand-logos', 'brand-qris')
    and public.is_brand_admin(public.storage_brand_id(name))
  )
  with check (
    bucket_id in ('brand-logos', 'brand-qris')
    and public.is_brand_admin(public.storage_brand_id(name))
  );

drop policy if exists "brand assets admin delete" on storage.objects;
create policy "brand assets admin delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id in ('brand-logos', 'brand-qris')
    and public.is_brand_admin(public.storage_brand_id(name))
  );
