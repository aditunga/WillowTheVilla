# Willow The Villa Calendar

Static, mobile-first booking calendar for Willow The Villa caretakers.

## What This Version Does

- Shows one unified calendar for Airbnb, Booking.com, MakeMyTrip, and Direct bookings.
- Uses Telugu first, with an English toggle.
- Shows source colors on calendar dates.
- Shows caretakers the guest name, phone number, dates, check-in/checkout times, booking source, arrival time, guest count, requests, and caretaker notes after tapping a date.
- Adds an Admin / Owner view for adding bookings, importing, CSV export, edit/delete, full booking details, and financials.
- Keeps paid amount and owner-only fields out of the caretaker view.
- Imports CSV files with full guest details.
- Imports ICS calendar files for platform date ranges.
- Saves bookings in the browser with `localStorage`.

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

See `docs/DATA_IMPORT.md` and `examples/bookings-template.csv`.
