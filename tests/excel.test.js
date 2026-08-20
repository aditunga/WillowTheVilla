// Excel exports, which is how MakeMyTrip hands over bookings.
const { startApp, createSuite, assert } = require("./harness");

const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// A title row, a blank row, then the real header — the shape platform exports use.
const MAKEMYTRIP_SHEET = [
  ["MakeMyTrip Hotel Bookings Report", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  [
    "Guest Name",
    "Mobile No",
    "Email ID",
    "Hotel Booking ID",
    "Check In Date",
    "Check Out Date",
    "No. of Adults",
    "No. of Children",
    "Total Amount",
    "Status",
  ],
  [
    "Anil Verma",
    "9848012345",
    "anil@example.com",
    "NH7001234567",
    new Date(2026, 8, 4),
    new Date(2026, 8, 7),
    3,
    1,
    18500,
    "Confirmed",
  ],
  [
    "Meera Nair",
    "9848099999",
    "",
    "NH7009876543",
    new Date(2026, 8, 18),
    new Date(2026, 8, 20),
    2,
    0,
    9000,
    "Confirmed",
  ],
  ["", "", "", "", "", "", "", "", "", ""],
];

module.exports = async function run() {
  const app = startApp({ bookings: [], lang: "en" });
  const { $ } = app;
  const test = createSuite("excel import");

  app.loginAsOwner();

  const importExcel = async (name, rows, type = XLSX_TYPE) => {
    app.click("#adminButton");
    app.click("#adminImportBookings");
    app.stubExcel(rows);
    app.attachFile(name, "PK", type);
    app.click("#importButton");
    await app.settle();
    await app.settle();
    await app.settle();
  };

  await test("a MakeMyTrip sheet imports past its title rows", async () => {
    $("#importSource").value = "makemytrip";
    await importExcel("makemytrip-bookings.xlsx", MAKEMYTRIP_SHEET);
    const rows = app.stored();
    assert(rows.length === 2, `imported ${rows.length}`);
    return rows.map((booking) => `${booking.guestName} ${booking.checkIn}→${booking.checkOut}`).join(" | ");
  });

  await test("date cells keep their calendar day", () => {
    const anil = app.stored().find((booking) => booking.guestName === "Anil Verma");
    assert(anil.checkIn === "2026-09-04", `check-in ${anil.checkIn}`);
    assert(anil.checkOut === "2026-09-07", `check-out ${anil.checkOut}`);
    return `${anil.checkIn} → ${anil.checkOut}`;
  });

  await test("platform column names are matched", () => {
    const anil = app.stored().find((booking) => booking.guestName === "Anil Verma");
    assert(anil.phone === "9848012345", `phone ${anil.phone}`);
    assert(anil.email === "anil@example.com", `email ${anil.email}`);
    assert(anil.bookingId === "NH7001234567", `booking id ${anil.bookingId}`);
    assert(anil.adults === 3, `adults ${anil.adults}`);
    assert(anil.children === 1, `children ${anil.children}`);
    assert(anil.amountPaid === "18500", `amount ${anil.amountPaid}`);
    assert(anil.platform === "makemytrip", `platform ${anil.platform}`);
    return "name, phone, email, booking id, guests, amount, platform";
  });

  await test("blank trailing rows are skipped", () => {
    assert(!app.stored().some((booking) => !booking.guestName.trim()), "empty booking stored");
  });

  await test("re-importing the same sheet updates rather than duplicating", async () => {
    const changed = MAKEMYTRIP_SHEET.map((row) => [...row]);
    changed[3][1] = "9848000000";
    await importExcel("makemytrip-bookings.xlsx", changed);
    const rows = app.stored();
    assert(rows.length === 2, `rows ${rows.length}`);
    const anil = rows.find((booking) => booking.guestName === "Anil Verma");
    assert(anil.phone === "9848000000", `phone not updated: ${anil.phone}`);
  });

  await test("a legacy .xls file takes the same path", async () => {
    const before = app.stored().length;
    await importExcel(
      "old-export.xls",
      [
        ["Guest", "Arrival", "Departure", "Adults"],
        ["Sunil P", new Date(2026, 10, 2), new Date(2026, 10, 5), 2],
      ],
      "application/vnd.ms-excel",
    );
    assert(app.stored().length === before + 1, `stored ${app.stored().length}`);
    const sunil = app.stored().find((booking) => booking.guestName === "Sunil P");
    assert(sunil.checkIn === "2026-11-02", `check-in ${sunil.checkIn}`);
    return `${sunil.checkIn} → ${sunil.checkOut}`;
  });

  await test("a sheet with no recognisable columns is rejected", async () => {
    const before = app.stored().length;
    await importExcel("notes.xlsx", [["Some notes"], ["nothing useful here"]]);
    assert(app.stored().length === before, "stored something");
    assert(!$("#importModal").hidden, "modal closed on a failed import");
    const toast = app.$$(".toast").at(-1).textContent;
    assert(/Choose a valid/.test(toast), toast);
    app.click("#closeImportModal");
  });

  await test("an unreadable Excel file says so instead of failing silently", async () => {
    const before = app.stored().length;
    await importExcel("broken.xlsx", null);
    assert(app.stored().length === before, "stored something");
    const toast = app.$$(".toast").at(-1).textContent;
    assert(/Could not read that Excel/.test(toast), toast);
    app.click("#closeImportModal");
  });

  await test("no uncaught page errors", () => {
    assert(!app.errors.length, app.errors.map((error) => error.message).join(" | "));
  });

  const failures = test.report();
  app.close();
  return failures;
};

if (require.main === module) module.exports().then((f) => process.exit(f ? 1 : 0));
