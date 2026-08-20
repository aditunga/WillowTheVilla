// Reading a booking out of a confirmation PDF.
const { startApp, createSuite, assert } = require("./harness");

const AIRBNB_PDF = `Airbnb
Confirmation code HMABC12345
Willow The Villa
CHECK-IN
Fri, Sep 4, 2026
3:00 PM
CHECKOUT
Mon, Sep 7, 2026
10:00 AM
Guests
3 adults, 1 child
Guest name Ravi Kumar
Phone +91 98480 12345
Email ravi@example.com
Total (INR) Rs 18,500`;

const BOOKING_PDF = `Booking.com
Booking number 4213 9987 55
Guest name: Priya Ramesh
Special requests: Early check-in if possible
Check-in: 12/09/2026
Check-out: 14/09/2026
2 adults, 1 pet
Mobile: 98480 11111
Total amount INR 9,000`;

module.exports = async function run() {
  const app = startApp({ bookings: [], lang: "en" });
  const { $ } = app;
  const test = createSuite("pdf import");

  app.loginAsOwner();

  const importPdf = async (name, pages) => {
    app.click("#adminButton");
    app.click("#adminImportBookings");
    app.stubPdf(pages);
    app.attachFile(name, "%PDF-1.4", "application/pdf");
    app.click("#importButton");
    await app.settle();
    await app.settle();
    await app.settle();
  };

  await test("an Airbnb confirmation fills the form instead of saving itself", async () => {
    await importPdf("airbnb-confirmation.pdf", [AIRBNB_PDF]);
    assert($("#importModal").hidden, "import modal still open");
    assert(!$("#formModal").hidden, "form did not open");
    assert(!app.stored().length, "saved without review");
    assert($("#guestName").value === "Ravi Kumar", `name ${$("#guestName").value}`);
    assert($("#checkIn").value === "2026-09-04", `check-in ${$("#checkIn").value}`);
    assert($("#checkOut").value === "2026-09-07", `check-out ${$("#checkOut").value}`);
    assert($("#platform").value === "airbnb", `platform ${$("#platform").value}`);
    assert($("#bookingId").value === "HMABC12345", `code ${$("#bookingId").value}`);
    assert($("#adults").value === "3", `adults ${$("#adults").value}`);
    assert($("#children").value === "1", `children ${$("#children").value}`);
    assert($("#phone").value === "+91 98480 12345", `phone ${$("#phone").value}`);
    assert($("#email").value === "ravi@example.com", `email ${$("#email").value}`);
    assert($("#amountPaid").value === "18500", `amount ${$("#amountPaid").value}`);
    return `${$("#guestName").value}, ${$("#checkIn").value}→${$("#checkOut").value}, ₹${$("#amountPaid").value}`;
  });

  await test("saving the reviewed form stores the booking", async () => {
    app.submit("#bookingForm");
    await app.settle();
    const rows = app.stored();
    assert(rows.length === 1, `stored ${rows.length}`);
    assert(rows[0].guestName === "Ravi Kumar", rows[0].guestName);
    assert(rows[0].id, "no id assigned");
    return rows[0].id ? "saved with a fresh id" : "";
  });

  await test("a Booking.com confirmation reads dd/mm/yyyy and its own labels", async () => {
    await importPdf("booking-confirmation.pdf", [BOOKING_PDF]);
    assert($("#guestName").value === "Priya Ramesh", `name ${$("#guestName").value}`);
    assert($("#platform").value === "booking", `platform ${$("#platform").value}`);
    assert($("#checkIn").value === "2026-09-12", `check-in ${$("#checkIn").value}`);
    assert($("#checkOut").value === "2026-09-14", `check-out ${$("#checkOut").value}`);
    assert($("#adults").value === "2", `adults ${$("#adults").value}`);
    assert($("#pets").value === "1", `pets ${$("#pets").value}`);
    assert($("#amountPaid").value === "9000", `amount ${$("#amountPaid").value}`);
    assert(/Early check-in/.test($("#requests").value), `requests ${$("#requests").value}`);
    app.click("#closeFormModal");
    return `${$("#checkIn").value}→${$("#checkOut").value}`;
  });

  await test("a PDF with no dates is reported, not guessed", async () => {
    const before = app.stored().length;
    await importPdf("receipt.pdf", ["Willow The Villa\nThank you for your stay."]);
    assert($("#formModal").hidden, "form opened without a date");
    assert(app.stored().length === before, "stored something");
    const toast = app.$$(".toast").at(-1).textContent;
    assert(/No booking details/.test(toast), toast);
    app.click("#closeImportModal");
  });

  await test("an unreadable PDF says so instead of failing silently", async () => {
    const before = app.stored().length;
    await importPdf("broken.pdf", null);
    assert(app.stored().length === before, "stored something");
    const toast = app.$$(".toast").at(-1).textContent;
    assert(/Could not read/.test(toast), toast);
    app.click("#closeImportModal");
  });

  await test("the import source is used when the PDF names no platform", async () => {
    app.click("#adminButton");
    app.click("#adminImportBookings");
    $("#importSource").value = "makemytrip";
    app.stubPdf(["Reservation\nCheck-in 2026-11-02\nCheck-out 2026-11-05\nGuest name Anil K"]);
    app.attachFile("plain.pdf", "%PDF-1.4", "application/pdf");
    app.click("#importButton");
    await app.settle();
    await app.settle();
    await app.settle();
    assert($("#platform").value === "makemytrip", `platform ${$("#platform").value}`);
    assert($("#checkIn").value === "2026-11-02", `check-in ${$("#checkIn").value}`);
    app.click("#closeFormModal");
  });

  await test("no uncaught page errors", () => {
    assert(!app.errors.length, app.errors.map((error) => error.message).join(" | "));
  });

  const failures = test.report();
  app.close();
  return failures;
};

if (require.main === module) module.exports().then((f) => process.exit(f ? 1 : 0));
