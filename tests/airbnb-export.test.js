// Airbnb's own earnings / transaction export, which is where the booking history
// before 2025 has to come from. It differs from the CSV template in three ways:
// payout rows carry no booking, dates are US month-first, and a stay is given as a
// start date plus a night count.
const { startApp, createSuite, assert } = require("./harness");

const AIRBNB_CSV = [
  "Date,Arriving by date,Type,Confirmation code,Book date,Start date,End date,Nights,Guest,Listing,Details,Reference,Currency,Amount,Paid out,Host fee,Cleaning fee,Gross earnings,Earnings year",
  "05/12/2023,,Payout,,,,,,,,Transfer to T PADMAVATHY,,INR,,45000.00,,,,2023",
  "05/10/2023,05/10/2023,Reservation,HMABC12345,04/28/2023,05/10/2023,05/13/2023,3,Ravi Kumar,Willow - The Villa,,,INR,30850.00,,-2468.00,1500.00,28382.00,2023",
  "06/22/2023,06/22/2023,Reservation,HMXYZ98765,06/01/2023,06/22/2023,,2,Meera Nair,Willow - The Villa,,,INR,18000.00,,-1440.00,1500.00,16560.00,2023",
  "12/03/2024,12/03/2024,Reservation,HMQRS55555,11/20/2024,12/03/2024,12/09/2024,6,Sunil Prasad,Willow - The Villa,,,INR,57689.00,,-4615.00,1500.00,53150.60,2024",
];

// The same three stays written the Indian way, to prove the order is read from the
// data rather than hard-coded either way.
const INDIAN_CSV = [
  "Guest,Confirmation code,Start date,End date,Amount",
  "Ravi Kumar,HMABC12345,10/05/2023,13/05/2023,30850.00",
  "Meera Nair,HMXYZ98765,22/06/2023,24/06/2023,18000.00",
];

module.exports = async function run() {
  const app = startApp({ bookings: [], lang: "en" });
  const { $ } = app;
  const test = createSuite("airbnb export");

  app.loginAsOwner();

  const importCsv = async (name, text) => {
    app.click("#adminButton");
    app.click("#adminImportBookings");
    $("#importSource").value = "airbnb";
    app.attachFile(name, text);
    app.click("#importButton");
    await app.settle();
    await app.settle();
  };

  await test("payout rows are skipped, reservation rows import", async () => {
    await importCsv("airbnb-earnings.csv", AIRBNB_CSV.join("\n"));
    const rows = app.stored();
    assert(rows.length === 3, `imported ${rows.length}`);
    assert(rows.every((booking) => booking.guestName.trim()), "a nameless row got through");
    return rows.map((booking) => booking.guestName).join(", ");
  });

  await test("US month-first dates are read as written", () => {
    const ravi = app.stored().find((booking) => booking.guestName === "Ravi Kumar");
    assert(ravi.checkIn === "2023-05-10", `check-in ${ravi.checkIn}`);
    assert(ravi.checkOut === "2023-05-13", `check-out ${ravi.checkOut}`);
    const sunil = app.stored().find((booking) => booking.guestName === "Sunil Prasad");
    assert(sunil.checkIn === "2024-12-03", `check-in ${sunil.checkIn}`);
    assert(sunil.checkOut === "2024-12-09", `check-out ${sunil.checkOut}`);
    return `${ravi.checkIn}→${ravi.checkOut}, ${sunil.checkIn}→${sunil.checkOut}`;
  });

  await test("a missing end date is worked out from the night count", () => {
    const meera = app.stored().find((booking) => booking.guestName === "Meera Nair");
    assert(meera.checkIn === "2023-06-22", `check-in ${meera.checkIn}`);
    assert(meera.checkOut === "2023-06-24", `check-out ${meera.checkOut}`);
    return `${meera.checkIn} + 2 nights → ${meera.checkOut}`;
  });

  await test("confirmation code, listing and earnings are kept", () => {
    const ravi = app.stored().find((booking) => booking.guestName === "Ravi Kumar");
    assert(ravi.bookingId === "HMABC12345", `code ${ravi.bookingId}`);
    assert(ravi.villaRoom === "Willow - The Villa", `listing ${ravi.villaRoom}`);
    assert(ravi.platform === "airbnb", `platform ${ravi.platform}`);
    // Gross earnings sits to the right of Amount, so it is the value that lands.
    assert(ravi.amountPaid === "28382.00", `amount ${ravi.amountPaid}`);
    return `${ravi.bookingId}, ${ravi.villaRoom}, ₹${ravi.amountPaid}`;
  });

  await test("the same stays written day-first import to the same dates", async () => {
    const other = startApp({ bookings: [], lang: "en" });
    other.loginAsOwner();
    other.click("#adminImportBookings");
    other.$("#importSource").value = "airbnb";
    other.attachFile("indian-export.csv", INDIAN_CSV.join("\n"));
    other.click("#importButton");
    await other.settle();
    await other.settle();

    const ravi = other.stored().find((booking) => booking.guestName === "Ravi Kumar");
    const meera = other.stored().find((booking) => booking.guestName === "Meera Nair");
    assert(ravi.checkIn === "2023-05-10", `check-in ${ravi.checkIn}`);
    assert(ravi.checkOut === "2023-05-13", `check-out ${ravi.checkOut}`);
    assert(meera.checkIn === "2023-06-22", `check-in ${meera.checkIn}`);
    other.close();
    return `${ravi.checkIn}→${ravi.checkOut}`;
  });

  await test("re-importing the export does not duplicate the history", async () => {
    await importCsv("airbnb-earnings.csv", AIRBNB_CSV.join("\n"));
    assert(app.stored().length === 3, `rows ${app.stored().length}`);
  });

  await test("no uncaught page errors", () => {
    assert(!app.errors.length, app.errors.map((error) => error.message).join(" | "));
  });

  const failures = test.report();
  app.close();
  return failures;
};

if (require.main === module) module.exports().then((f) => process.exit(f ? 1 : 0));
