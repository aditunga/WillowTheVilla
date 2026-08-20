# Booking Data Import

The website is static and free. Admin users can import files selected on the phone or computer, but the site does not store Airbnb, Booking.com, or MakeMyTrip passwords.

## CSV Import

Use `examples/bookings-template.csv` as the format.

Required columns:

- `guestName`
- `phone`
- `platform`
- `checkIn`
- `checkOut`

Useful optional columns:

- `bookingId`
- `amountPaid`
- `checkInTime`
- `checkoutTime`
- `arrivalTime`
- `villaRoom`
- `adults`
- `children`
- `pets`
- `status`
- `idProof`
- `email`
- `vehicle`
- `requests`
- `notes`

Valid platform values:

- `airbnb`
- `booking`
- `makemytrip`
- `direct`

`amountPaid` is owner-only. It is imported/exported for Admin users but is not shown to caretakers.

## ICS Calendar Import

ICS files can add blocked/booked date ranges from platform calendar exports. They often do not include guest phone numbers. If the ICS file contains a phone number in the event description, the website will try to read it.

Use the import source selector before importing an ICS file so the booking gets the right color.

## Full Automatic Sync

Full automatic guest details and phone numbers require an authorized source:

- official platform API access
- a channel manager/PMS export
- a secure backend that reads booking confirmation emails

A public static website should not contain platform passwords or secret API keys. Supabase project URLs and publishable anon keys are allowed in browser code only when Row Level Security policies are enabled.
