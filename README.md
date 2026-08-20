# Willow The Villa Calendar

Static, mobile-first booking calendar for Willow The Villa caretakers.

## What This Version Does

- Shows one unified calendar for Airbnb, Booking.com, MakeMyTrip, and Direct bookings.
- Uses Telugu first, with an English toggle.
- Shows source colors on calendar dates.
- Searches bookings by guest name, phone number, or booking ID and jumps to the date.
- Shows caretakers the guest name, phone number, dates, check-in/checkout times, booking source, arrival time, guest count, requests, and caretaker notes after tapping a date.
- Shows a live status chip (arriving / staying / checking out / completed) worked out from today's date.
- Adds an Admin / Owner view for adding bookings, importing, CSV export, edit/delete, full booking details, and financials.
- Warns the owner before saving a booking that overlaps another stay in the same villa/room.
- Keeps paid amount and owner-only fields out of the caretaker view.
- Imports CSV files with full guest details.
- Imports Excel exports (`.xlsx`, `.xlsm`, `.xls`), including the MakeMyTrip report format.
- Imports the Airbnb earnings/transaction export, skipping payout rows and reading US month-first dates.
- Imports ICS calendar files for platform date ranges.
- Reads a booking confirmation PDF and fills the booking form for the owner to check before saving.
- Uses Supabase shared storage when configured, with browser `localStorage` fallback.
- Re-checks the cloud when the phone comes back to the app or back online, and shows when the data was last updated.
- Installs to a phone home screen and keeps working offline from the last loaded copy.

## Keyboard And Screen Readers

- Arrow keys move across calendar days and roll into the next or previous month.
- `Escape` closes the top-most popup; `Tab` stays inside an open popup.
- Day cells announce the date, the number of bookings, and the guest names.

## Tests

The published site is still plain HTML, CSS, and JavaScript with no build step. The
tests are the only thing that needs Node, and they drive the real `index.html` in
jsdom:

```sh
npm install
npm test
```

`npm run check:supabase` reports whether shared storage is wired up: whether the
project answers, whether the schema has been applied, whether owner-only rows are
closed to visitors, and whether owner sign-in is configured. It uses only the
publishable key.

`npm run serve` starts a local static server on <http://localhost:4173> if you want
to click through the site by hand.

One spec, `tests/excel-real.test.js`, checks a genuine `.xlsx` file end to end. SheetJS
is not on the npm registry past 0.18.5, so that spec skips unless the reader is
installed on purpose:

```sh
npm install --no-save https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
```

## Free Hosting

The cheapest static hosting path is GitHub Pages from the `aditunga` GitHub account. Push these files to a public repository and enable Pages from the `main` branch root.

DuckDNS is useful if the site is served from a home machine or local server, because it points a `duckdns.org` hostname to a changing public IP. GitHub Pages already hosts the site, so it does not need DuckDNS unless you specifically want a separate home-hosted URL.

See `docs/DEPLOY.md`.

## Booking Website Data

The public Airbnb listing URL is included as the Airbnb source reference:

```text
https://airbnb.com/h/willowthevilla
```

To automatically pull full guest details and phone numbers, the website needs an authorized data source such as an official API, partner/channel-manager feed, platform export, or booking confirmation email feed. A static GitHub Pages site should not store Airbnb, Booking.com, or MakeMyTrip passwords in browser code.

Calendar export links can usually provide booked dates, but they generally do not provide every guest detail or phone number. The current UI is ready for those details once a secure connector is added later.

See `docs/SUPABASE.md`, `docs/DATA_IMPORT.md`, and `examples/bookings-template.csv`.
