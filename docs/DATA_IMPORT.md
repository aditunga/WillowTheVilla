# Booking Data Import

The caretaker website is static and free. It can import files selected on the phone or computer, but it does not store Airbnb, Booking.com, or MakeMyTrip passwords.

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

No paid amount column is supported.

## ICS Calendar Import

ICS files can add blocked/booked date ranges from platform calendar exports. They often do not include guest phone numbers. If the ICS file contains a phone number in the event description, the website will try to read it.

Use the import source selector before importing an ICS file so the booking gets the right color.

## Full Automatic Sync

Full automatic guest details and phone numbers require an authorized source:

- official platform API access
- a channel manager/PMS export
- a secure backend that reads booking confirmation emails

A public static website should not contain platform passwords or secret API keys.
