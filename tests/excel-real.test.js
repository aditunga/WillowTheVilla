// Checks the one thing the stubbed spec cannot: that a real .xlsx round-trips its
// dates to the right calendar day. Excel stores a date cell with no timezone, and a
// booking landing a day early would be an expensive bug at a villa.
//
// SheetJS is not on the npm registry past 0.18.5, so this spec is opt-in:
//   npm install https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
// Without it the spec skips instead of failing.
const { startApp, createSuite, assert } = require("./harness");

let XLSX = null;
try {
  XLSX = require("xlsx");
} catch {
  XLSX = null;
}

function buildWorkbookBuffer() {
  const rows = [
    ["MakeMyTrip Hotel Bookings Report"],
    [],
    [
      "Guest Name",
      "Mobile No",
      "Hotel Booking ID",
      "Check In Date",
      "Check Out Date",
      "No. of Adults",
      "Total Amount",
    ],
    ["Anil Verma", "9848012345", "NH7001234567", new Date(2026, 8, 4), new Date(2026, 8, 7), 3, 18500],
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows, { cellDates: true });
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Sheet1");
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" });
}

module.exports = async function run() {
  const test = createSuite("excel import (real library)");

  if (!XLSX) {
    await test("skipped — install SheetJS to run this spec", () => "npm install https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz");
    return test.report();
  }

  const app = startApp({ bookings: [], lang: "en" });
  const { $ } = app;
  const buffer = buildWorkbookBuffer();

  app.loginAsOwner();
  app.window.XLSX = XLSX;
  app.click("#adminImportBookings");
  $("#importSource").value = "makemytrip";
  Object.defineProperty($("#importFile"), "files", {
    value: [
      {
        name: "makemytrip-bookings.xlsx",
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        arrayBuffer: async () => buffer,
      },
    ],
    configurable: true,
  });
  app.click("#importButton");
  await app.settle();
  await app.settle();
  await app.settle();

  await test("a real .xlsx imports with the dates the sheet shows", () => {
    const rows = app.stored();
    assert(rows.length === 1, `imported ${rows.length}`);
    const [booking] = rows;
    assert(booking.guestName === "Anil Verma", `name ${booking.guestName}`);
    assert(booking.checkIn === "2026-09-04", `check-in ${booking.checkIn}`);
    assert(booking.checkOut === "2026-09-07", `check-out ${booking.checkOut}`);
    assert(booking.adults === 3, `adults ${booking.adults}`);
    assert(booking.bookingId === "NH7001234567", `booking id ${booking.bookingId}`);
    assert(booking.amountPaid === "18500", `amount ${booking.amountPaid}`);
    return `${booking.checkIn} → ${booking.checkOut} in ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
  });

  await test("no uncaught page errors", () => {
    assert(!app.errors.length, app.errors.map((error) => error.message).join(" | "));
  });

  const failures = test.report();
  app.close();
  return failures;
};

if (require.main === module) module.exports().then((f) => process.exit(f ? 1 : 0));
