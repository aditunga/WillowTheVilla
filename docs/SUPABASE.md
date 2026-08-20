# Supabase Setup

This upgrade keeps the site static and cheap, but moves shared booking data and owner-only fields into Supabase.

## What Becomes Safer

- Caretakers can read active calendar booking basics.
- Only the owner login can add, edit, delete, import, and export.
- Financials, external booking IDs, ID proof status, email, and vehicle number are stored in `booking_private_details`, not in the public caretaker table.
- Supabase Row Level Security decides access on the server side.

The public/publishable Supabase anon key is allowed in browser code. Never put the Supabase `service_role` key in this website.

## 1. Create Supabase Project

1. Create a free Supabase project.
2. Open `Project Settings` -> `API`.
3. Copy the project URL.
4. Copy the publishable/anon key.

## 2. Run The Schema

The SQL lives at `supabase/migrations/20260820000000_willow_bookings.sql`.

If the Supabase project is linked to this GitHub repository, the integration picks
that file up from `supabase/migrations/` and applies it on push. `supabase/config.toml`
must carry the project reference, which is the part of the project URL before
`.supabase.co`.

Otherwise open the Supabase SQL editor and paste the contents of that file. It is safe
to run more than once.

That creates:

- `public.bookings`: caretaker-safe shared booking fields.
- `public.booking_private_details`: owner-only private/financial fields.
- `public.monthly_earnings`: owner-only month totals from platform earnings reports.
- RLS policies for public read and owner-only writes.

`supabase/migrations/20260821000000_monthly_earnings.sql` also seeds the Airbnb
earnings report figures for May 2023 to August 2026. Re-running it updates the
existing rows rather than duplicating them.

## 3. Create Owner Login

In Supabase Auth, create one user for the owner. Use any owner email you control and the private Admin password you chose. Do not commit that password to GitHub.

Then mark that Auth user as owner. In the SQL editor, replace the email and run:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || '{"willow_role":"owner"}'::jsonb
where email = 'OWNER_EMAIL_HERE';
```

## 4. Configure The Website

Edit `supabase-config.js`:

```js
window.WILLOW_SUPABASE_CONFIG = {
  url: "https://YOUR_PROJECT.supabase.co",
  anonKey: "sb_publishable_...",
  adminUsername: "Venu",
  adminEmail: "OWNER_EMAIL_HERE",
};
```

Commit and push that file.

Supabase issues two keys on that page and only one of them belongs here:

- `sb_publishable_...` is the publishable key. It is designed to sit in browser code,
  and Row Level Security is what actually protects the data. This is the one to use.
- `sb_secret_...` is the secret key, formerly the service-role key. It bypasses Row
  Level Security entirely. It must never go in this file, in this repository, or in a
  chat or screenshot. If it is exposed, roll it in `Project Settings` -> `API Keys`
  straight away.

## 5. Check It

```sh
npm run check:supabase
```

It reads `supabase-config.js`, calls the project with the publishable key, and lists
what is done and what is left.

Migrations can also be applied by GitHub Actions on push. See
`.github/workflows/supabase-migrations.yml`, which needs two repository secrets,
`SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD`. Without them it skips.

## 6. First Login Migration

If this browser already has local bookings saved and the Supabase tables are empty, the first successful owner login will copy the local bookings into Supabase.

After that, caretakers on other phones will read the shared Supabase bookings instead of each phone having separate local data.

## Current Privacy Boundary

Caretaker access is still link-based: anyone with the site URL can read the caretaker-safe calendar data. Owner-only data is protected by Supabase Auth/RLS.

If guest names and phone numbers must also be private from anyone without a caretaker password, the next step is to add separate caretaker logins and change the `bookings` select policy from `anon` to `authenticated`.
