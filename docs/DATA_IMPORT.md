# Booking Data Import

The website is static and free. Admin users can import files selected on the phone or computer, but the site does not store Airbnb, Booking.com, or MakeMyTrip passwords.

## CSV Import

Use `examples/bookings-template.csv` as the format. Column names are matched loosely, so
a platform export with its own header names usually imports without editing.

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

## Airbnb Earnings / Transaction Export

This is the file to use for booking history. In the Airbnb host account, open
`Earnings`, then `Get report` / `Transaction history`, choose the year, and download the
CSV. Each reservation is one row with the confirmation code, guest name, start date,
nights, listing, and gross earnings.

The Airbnb **Earnings report PDF** is a different file and cannot be used for this. It
only holds monthly totals, with no guest names, dates, or confirmation codes in it.

Three things about the export are handled automatically:

- Payout and adjustment rows have no stay attached, so they are skipped.
- Airbnb writes dates month first (`05/10/2023` is 10 May), while Indian exports write
  them day first. The importer reads the whole date column first and works out which
  order the file uses, so both import correctly without a setting.
- When a row has a start date and a night count but no end date, the check-out date is
  worked out from the nights.

Set the import source to Airbnb before importing, because the export does not name the
platform in a column.

## Excel Import

MakeMyTrip hands over bookings as Excel files, so `.xlsx`, `.xlsm`, and older `.xls`
files import the same way a CSV does. The first sheet in the file is read.

The columns do not have to be named exactly like the CSV template. Headers are matched
loosely, so `Guest Name`, `Mobile No`, `Email ID`, `Hotel Booking ID`, `Check In Date`,
`Check Out Date`, `No. of Adults`, `No. of Children`, and `Total Amount` are all
understood, along with the CSV column names.

Platform exports usually put a report title and a blank line above the real header row.
The website looks down the first twenty rows for the header instead of assuming it is
the first line, so those files import without editing.

Date cells are read as dates, not as text, so a sheet showing `04/09/2026` imports as
4 September whatever the computer's date settings are.

A row is skipped when it has no check-in and check-out date, which is how blank trailing
rows at the end of an export are ignored.

Reading an Excel file needs an internet connection the first time, because the reader is
downloaded from a CDN.

## ICS Calendar Import

ICS files can add blocked/booked date ranges from platform calendar exports. They often do not include guest phone numbers. If the ICS file contains a phone number in the event description, the website will try to read it.

Use the import source selector before importing an ICS file so the booking gets the right color.

## PDF Confirmation Import

Select a booking confirmation PDF the same way as a CSV or ICS file. The website reads
the text out of the PDF and fills the booking form, then waits for the owner to check
the details and press Save. Nothing is stored until Save is pressed, because a PDF has
no fixed layout and the reading is a best guess.

What it looks for:

- check-in and check-out dates, in `2026-09-04`, `4 Sep 2026`, `Sep 4, 2026`, and
  `04/09/2026` form. Slash dates are read day first, the Indian way.
- guest name, after a label such as `Guest name`, `Booked by`, or `Primary guest`
- confirmation code, booking number, or reservation ID
- phone number and email address
- guest counts from text such as `3 adults, 1 child`
- total amount, from `Total`, `Amount paid`, `Grand total`, or a `₹`/`INR` figure
- the platform, if the words Airbnb, Booking.com, or MakeMyTrip appear anywhere

Anything it cannot find is left blank or falls back to the import source selector, so
set that selector before importing a PDF that does not name its platform.

Reading a PDF needs an internet connection the first time, because the PDF reader is
downloaded from a CDN. Scanned or photographed PDFs hold no text, so they cannot be
read.

## Full Automatic Sync

Full automatic guest details and phone numbers require an authorized source:

- official platform API access
- a channel manager/PMS export
- a secure backend that reads booking confirmation emails

A public static website should not contain platform passwords or secret API keys. Supabase project URLs and publishable anon keys are allowed in browser code only when Row Level Security policies are enabled.
