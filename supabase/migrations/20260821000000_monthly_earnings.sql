-- Monthly platform earnings for the owner view.
--
-- These are month level totals from the Airbnb earnings report, not bookings.
-- The report carries no guest names, stay dates or confirmation codes, so it
-- cannot produce bookings; it is kept as its own financial history instead.
--
-- Owner only: caretakers must never read these figures.

create table if not exists public.monthly_earnings (
  id text primary key,
  platform text not null default 'airbnb',
  month date not null,
  gross numeric(12, 2) not null default 0,
  net numeric(12, 2) not null default 0,
  source_note text,
  updated_at timestamptz not null default now(),
  constraint monthly_earnings_platform_check check (
    platform in ('airbnb', 'booking', 'makemytrip', 'direct')
  ),
  constraint monthly_earnings_amounts_check check (gross >= 0 and net >= 0),
  constraint monthly_earnings_unique unique (platform, month)
);

drop trigger if exists monthly_earnings_touch_updated_at on public.monthly_earnings;
create trigger monthly_earnings_touch_updated_at
before update on public.monthly_earnings
for each row execute function public.touch_updated_at();

alter table public.monthly_earnings enable row level security;

revoke all on table public.monthly_earnings from anon, authenticated;
grant select, insert, update, delete on table public.monthly_earnings to authenticated;

drop policy if exists "Owners can manage monthly earnings" on public.monthly_earnings;
create policy "Owners can manage monthly earnings"
on public.monthly_earnings
for all
to authenticated
using (public.is_willow_owner())
with check (public.is_willow_owner());

insert into public.monthly_earnings (id, platform, month, gross, net, source_note) values
  ('airbnb:2023-05', 'airbnb', '2023-05-01', 30850.00, 28382.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2023-06', 'airbnb', '2023-06-01', 78000.00, 71760.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2023-07', 'airbnb', '2023-07-01', 77300.00, 71116.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2023-08', 'airbnb', '2023-08-01', 73500.00, 69460.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2023-09', 'airbnb', '2023-09-01', 77100.00, 70932.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2023-10', 'airbnb', '2023-10-01', 95315.00, 87689.80, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2023-11', 'airbnb', '2023-11-01', 61252.35, 56396.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2023-12', 'airbnb', '2023-12-01', 96125.00, 88435.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2024-01', 'airbnb', '2024-01-01', 15100.00, 13892.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2024-02', 'airbnb', '2024-02-01', 29300.00, 26956.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2024-03', 'airbnb', '2024-03-01', 65823.14, 33174.14, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2024-04', 'airbnb', '2024-04-01', 16200.00, 14904.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2024-05', 'airbnb', '2024-05-01', 48400.00, 44528.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2024-06', 'airbnb', '2024-06-01', 19200.00, 17664.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2024-07', 'airbnb', '2024-07-01', 46500.00, 42780.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2024-08', 'airbnb', '2024-08-01', 11935.00, 10980.20, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2024-09', 'airbnb', '2024-09-01', 63350.00, 58282.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2024-10', 'airbnb', '2024-10-01', 7100.00, 6532.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2024-11', 'airbnb', '2024-11-01', 26300.00, 24196.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2024-12', 'airbnb', '2024-12-01', 57689.00, 53150.60, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2025-01', 'airbnb', '2025-01-01', 59200.00, 54464.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2025-02', 'airbnb', '2025-02-01', 7100.00, 6532.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2025-03', 'airbnb', '2025-03-01', 21248.60, 19548.71, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2025-04', 'airbnb', '2025-04-01', 21048.00, 19364.16, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2025-05', 'airbnb', '2025-05-01', 12200.00, 11224.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2025-06', 'airbnb', '2025-06-01', 65160.00, 59947.20, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2025-07', 'airbnb', '2025-07-01', 13650.00, 12558.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2025-08', 'airbnb', '2025-08-01', 0.00, 0.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2025-09', 'airbnb', '2025-09-01', 13100.00, 12052.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2025-10', 'airbnb', '2025-10-01', 26100.00, 24012.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2025-11', 'airbnb', '2025-11-01', 0.00, 0.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2025-12', 'airbnb', '2025-12-01', 20200.00, 18584.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2026-01', 'airbnb', '2026-01-01', 7600.00, 6992.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2026-02', 'airbnb', '2026-02-01', 19330.00, 17783.60, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2026-03', 'airbnb', '2026-03-01', 0.00, 0.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2026-04', 'airbnb', '2026-04-01', 11880.00, 10929.60, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2026-05', 'airbnb', '2026-05-01', 12790.00, 11766.80, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2026-06', 'airbnb', '2026-06-01', 0.00, 0.00, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2026-07', 'airbnb', '2026-07-01', 40476.40, 37238.29, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026'),
  ('airbnb:2026-08', 'airbnb', '2026-08-01', 38840.00, 35732.80, 'Airbnb earnings report 1 Jan 2022 - 20 Aug 2026');
on conflict (id) do update
  set gross = excluded.gross,
      net = excluded.net,
      source_note = excluded.source_note;
