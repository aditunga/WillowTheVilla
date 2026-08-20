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

Open the Supabase SQL editor and run:

```sql
-- paste the contents of supabase/schema.sql
```

That creates:

- `public.bookings`: caretaker-safe shared booking fields.
- `public.booking_private_details`: owner-only private/financial fields.
- RLS policies for public read and owner-only writes.

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
  anonKey: "YOUR_PUBLISHABLE_OR_ANON_KEY",
  adminUsername: "Venu",
  adminEmail: "OWNER_EMAIL_HERE",
};
```

Commit and push that file. The anon key is not a secret, but the service-role key is secret and must never be added.

## 5. First Login Migration

If this browser already has local bookings saved and the Supabase tables are empty, the first successful owner login will copy the local bookings into Supabase.

After that, caretakers on other phones will read the shared Supabase bookings instead of each phone having separate local data.

## Current Privacy Boundary

Caretaker access is still link-based: anyone with the site URL can read the caretaker-safe calendar data. Owner-only data is protected by Supabase Auth/RLS.

If guest names and phone numbers must also be private from anyone without a caretaker password, the next step is to add separate caretaker logins and change the `bookings` select policy from `anon` to `authenticated`.
