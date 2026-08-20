// CSV and ICS import, plus the Telugu note preview owners rely on.
const { startApp, createSuite, assert } = require("./harness");

const CSV = [
  "Guest Name,Mobile Number,Booked Through,Confirmation Code,Amount,Arrival,Departure,Adults,Kids,Status,Notes",
  '"Kumar, Anil",+91 98480 12345,Airbnb,HMXYZ1,"18,500",2026-09-04,2026-09-07,3,1,Confirmed,"late check in"',
  "Priya R,9848011111,MakeMyTrip,MMT77,9000,05/09/2026,08/09/2026,2,0,Confirmed,",
  "Row Without Dates,,,,,,,,,,",
].join("\n");

const ICS = [
  "BEGIN:VCALENDAR",
  "BEGIN:VEVENT",
  "UID:abc-123@airbnb",
  "DTSTART;VALUE=DATE:20261010",
  "DTEND;VALUE=DATE:20261013",
  "SUMMARY:Meera S",
  "DESCRIPTION:Phone: +91 90000 22222\\nEmail: meera@example.com",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

module.exports = async function run() {
  const app = startApp({ bookings: [], lang: "en" });
  const { $ } = app;
  const test = createSuite("import");

  app.loginAsOwner();

  await test("CSV import handles aliases, quotes and dd/mm/yyyy", async () => {
    app.click("#adminImportBookings");
    app.attachFile("bookings.csv", CSV);
    app.click("#importButton");
    await app.settle();
    const rows = app.stored();
    assert(rows.length === 2, `imported ${rows.length}`);

    const anil = rows.find((booking) => booking.guestName.startsWith("Kumar"));
    assert(anil.phone === "+91 98480 12345", `phone ${anil.phone}`);
    assert(anil.platform === "airbnb", `platform ${anil.platform}`);
    assert(anil.bookingId === "HMXYZ1", `bookingId ${anil.bookingId}`);
    assert(anil.adults === 3 && anil.children === 1, `guests ${anil.adults}/${anil.children}`);

    const priya = rows.find((booking) => booking.guestName === "Priya R");
    assert(priya.checkIn === "2026-09-05", `check-in ${priya.checkIn}`);
    assert(priya.checkOut === "2026-09-08", `check-out ${priya.checkOut}`);
    assert(priya.platform === "makemytrip", `platform ${priya.platform}`);
    return rows.map((b) => `${b.guestName} ${b.checkIn}→${b.checkOut}`).join(" | ");
  });

  await test("re-importing updates rather than duplicating", async () => {
    app.click("#adminButton");
    app.click("#adminImportBookings");
    app.attachFile(
      "bookings.csv",
      CSV.replace("+91 98480 12345", "+91 98480 99999"),
    );
    app.click("#importButton");
    await app.settle();
    const rows = app.stored();
    assert(rows.length === 2, `rows ${rows.length}`);
    const anil = rows.find((booking) => booking.guestName.startsWith("Kumar"));
    assert(anil.phone === "+91 98480 99999", `phone not updated: ${anil.phone}`);
  });

  await test("ICS import reads dates, phone and email", async () => {
    app.click("#adminButton");
    app.click("#adminImportBookings");
    $("#importSource").value = "booking";
    app.attachFile("airbnb.ics", ICS);
    app.click("#importButton");
    await app.settle();
    const meera = app.stored().find((booking) => booking.guestName === "Meera S");
    assert(meera, "not imported");
    assert(meera.checkIn === "2026-10-10", `check-in ${meera.checkIn}`);
    assert(meera.checkOut === "2026-10-13", `check-out ${meera.checkOut}`);
    assert(meera.phone === "+91 90000 22222", `phone ${meera.phone}`);
    assert(meera.email === "meera@example.com", `email ${meera.email}`);
    assert(meera.platform === "booking", `platform ${meera.platform}`);
    return `${meera.checkIn} → ${meera.checkOut}`;
  });

  await test("a file with no usable rows is rejected", async () => {
    const before = app.stored().length;
    app.click("#adminButton");
    app.click("#adminImportBookings");
    app.attachFile("empty.csv", "guestName,checkIn,checkOut\n,,\n");
    app.click("#importButton");
    await app.settle();
    assert(app.stored().length === before, "rows changed");
    assert(!$("#importModal").hidden, "modal closed on a failed import");
    app.click("#closeImportModal");
  });

  await test("the same stay under a different source updates, not duplicates", async () => {
    const before = app.stored().length;
    app.click("#adminButton");
    app.click("#adminImportBookings");
    $("#importSource").value = "makemytrip";
    // Same guest, same nights, imported again with the source dropdown changed.
    app.attachFile(
      "again.csv",
      [
        "Guest Name,Arrival,Departure",
        '"Kumar, Anil",2026-09-04,2026-09-07',
      ].join("\n"),
    );
    app.click("#importButton");
    await app.settle();
    assert(app.stored().length === before, `rows went from ${before} to ${app.stored().length}`);
    const anil = app.stored().filter((booking) => booking.guestName.startsWith("Kumar"));
    assert(anil.length === 1, `${anil.length} copies of the same stay`);
    return "still one row";
  });

  await test("owner sees the Telugu the caretaker will read", () => {
    app.click("#adminButton");
    app.click("#adminAddBooking");
    app.fill("notes", "late check in, need extra towels");
    assert(!$("#notePreview").hidden, "preview hidden");
    const preview = $("#notePreview").textContent;
    assert(/[ఀ-౿]/.test(preview), `no Telugu: ${preview}`);
    return preview;
  });

  await test("no uncaught page errors", () => {
    assert(!app.errors.length, app.errors.map((error) => error.message).join(" | "));
  });

  const failures = test.report();
  app.close();
  return failures;
};

if (require.main === module) module.exports().then((f) => process.exit(f ? 1 : 0));
