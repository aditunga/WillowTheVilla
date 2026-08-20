-- Willow The Villa shared booking storage.
-- Run this in the Supabase SQL editor for the project used by supabase-config.js.

create extension if not exists pgcrypto;

create table if not exists public.bookings (
  id text primary key default gen_random_uuid()::text,
  guest_name text not null,
  phone text,
  platform text not null default 'direct',
  check_in date not null,
  check_in_time time not null default '14:00',
  check_out date not null,
  checkout_time time not null default '11:00',
  arrival_time time,
  villa_room text not null default 'Willow Villa',
  adults integer not null default 1,
  children integer not null default 0,
  pets integer not null default 0,
  status text not null default 'confirmed',
  requests text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_platform_check check (
    platform in ('airbnb', 'booking', 'makemytrip', 'direct')
  ),
  constraint bookings_status_check check (
    status in ('confirmed', 'arriving', 'staying', 'checkout', 'completed', 'cancelled')
  ),
  constraint bookings_dates_check check (check_out > check_in),
  constraint bookings_guests_check check (adults >= 1 and children >= 0 and pets >= 0)
);

create table if not exists public.booking_private_details (
  booking_id text primary key references public.bookings(id) on delete cascade,
  external_booking_id text,
  amount_paid numeric(12, 2),
  id_proof text not null default 'pending',
  email text,
  vehicle text,
  updated_at timestamptz not null default now(),
  constraint booking_private_id_proof_check check (id_proof in ('pending', 'collected')),
  constraint booking_private_amount_check check (amount_paid is null or amount_paid >= 0)
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bookings_touch_updated_at on public.bookings;
create trigger bookings_touch_updated_at
before update on public.bookings
for each row execute function public.touch_updated_at();

drop trigger if exists booking_private_touch_updated_at on public.booking_private_details;
create trigger booking_private_touch_updated_at
before update on public.booking_private_details
for each row execute function public.touch_updated_at();

create or replace function public.is_willow_owner()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'willow_role') = 'owner', false);
$$;

alter table public.bookings enable row level security;
alter table public.booking_private_details enable row level security;

revoke all on table public.bookings from anon, authenticated;
revoke all on table public.booking_private_details from anon, authenticated;

grant select on table public.bookings to anon, authenticated;
grant insert, update, delete on table public.bookings to authenticated;
grant select, insert, update, delete on table public.booking_private_details to authenticated;

drop policy if exists "Caretakers can read active booking basics" on public.bookings;
create policy "Caretakers can read active booking basics"
on public.bookings
for select
to anon, authenticated
using (status <> 'cancelled' or public.is_willow_owner());

drop policy if exists "Owners can insert bookings" on public.bookings;
create policy "Owners can insert bookings"
on public.bookings
for insert
to authenticated
with check (public.is_willow_owner());

drop policy if exists "Owners can update bookings" on public.bookings;
create policy "Owners can update bookings"
on public.bookings
for update
to authenticated
using (public.is_willow_owner())
with check (public.is_willow_owner());

drop policy if exists "Owners can delete bookings" on public.bookings;
create policy "Owners can delete bookings"
on public.bookings
for delete
to authenticated
using (public.is_willow_owner());

drop policy if exists "Owners can manage private booking details" on public.booking_private_details;
create policy "Owners can manage private booking details"
on public.booking_private_details
for all
to authenticated
using (public.is_willow_owner())
with check (public.is_willow_owner());
