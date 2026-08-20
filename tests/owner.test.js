// What changes once the owner logs in.
const { startApp, createSuite, assert, day } = require("./harness");

const seed = [
  {
    id: "a", guestName: "Ravi Kumar", phone: "+91 90000 11111", platform: "airbnb",
    checkIn: day(1), checkOut: day(4), checkInTime: "14:00", checkoutTime: "11:00",
    adults: 2, children: 1, pets: 0, status: "confirmed", idProof: "collected",
    villaRoom: "Willow Villa", amountPaid: "12000", bookingId: "HMABC123",
    email: "ravi@example.com", vehicle: "TS09AB1234",
  },
];

module.exports = async function run() {
  const app = startApp({ bookings: seed, lang: "en" });
  const { $, $$ } = app;
  const test = createSuite("owner view");

  await test("login opens the owner panel with totals", () => {
    app.loginAsOwner();
    assert($("#adminLoginModal").hidden, "login still open");
    assert(!$("#adminPanelModal").hidden, "panel closed");
    assert($("#financeTotal").textContent.includes("12,000"), $("#financeTotal").textContent);
    return [$("#financeTotal"), $("#financeNights")].map((n) => n.textContent).join(" / ");
  });

  await test("a wrong password is rejected", async () => {
    app.click("#adminLogout");
    await app.settle();
    app.click("#adminButton");
    $("#adminUsername").value = "Venu";
    $("#adminPassword").value = "not-the-password";
    app.submit("#adminLoginForm");
    assert(!$("#adminLoginError").hidden, "no error shown");
    assert($("#adminPanelModal").hidden, "panel opened anyway");
    app.click("#closeAdminLogin");
    app.loginAsOwner();
  });

  await test("add opens a form prefilled with the selected dates", () => {
    app.click("#adminAddBooking");
    assert(!$("#formModal").hidden, "form closed");
    assert($("#adminPanelModal").hidden, "panel still open");
    return `${$("#checkIn").value} -> ${$("#checkOut").value}`;
  });

  await test("overlapping dates ask before saving", async () => {
    app.confirms.length = 0;
    app.fill("guestName", "Overlap Guest");
    app.fill("checkIn", day(2));
    app.fill("checkOut", day(3));
    app.submit("#bookingForm");
    await app.settle();
    assert(app.confirms.length === 1, `confirms: ${app.confirms.length}`);
    assert(/Ravi Kumar/.test(app.confirms[0]), app.confirms[0]);
    assert(app.stored().length === 2, `stored ${app.stored().length}`);
    return app.confirms[0].replace(/\n+/g, " ");
  });

  await test("an overlap is caught even when the property is named differently", async () => {
    app.confirms.length = 0;
    app.click("#adminButton");
    app.click("#adminAddBooking");
    app.fill("guestName", "Different Listing Name");
    app.fill("checkIn", day(2));
    app.fill("checkOut", day(3));
    // Ravi's booking came in as "Willow Villa"; an Airbnb export would call the
    // same property "Willow - The Villa". It is still the same villa.
    const before = app.stored().length;
    const answerYes = app.window.confirm;
    app.window.confirm = (message) => {
      app.confirms.push(message);
      return false; // decline, so nothing is stored and later counts hold
    };
    app.submit("#bookingForm");
    await app.settle();
    app.window.confirm = answerYes;

    assert(app.confirms.length === 1, `confirms: ${app.confirms.length}`);
    assert(/Ravi Kumar/.test(app.confirms[0]), app.confirms[0]);
    assert(app.stored().length === before, "saved despite the prompt being declined");
    app.click("#closeFormModal");
    return "clash found across differing property names, and declining saved nothing";
  });

  await test("free dates save without a prompt", async () => {
    app.confirms.length = 0;
    app.click("#adminButton");
    app.click("#adminAddBooking");
    app.fill("guestName", "Clear Guest");
    app.fill("checkIn", day(20));
    app.fill("checkOut", day(22));
    app.submit("#bookingForm");
    await app.settle();
    assert(!app.confirms.length, app.confirms[0]);
    assert(app.stored().length === 3, `stored ${app.stored().length}`);
  });

  await test("check-out before check-in is refused", async () => {
    app.click("#adminButton");
    app.click("#adminAddBooking");
    app.fill("guestName", "Backwards Guest");
    app.fill("checkIn", day(40));
    app.fill("checkOut", day(39));
    app.submit("#bookingForm");
    await app.settle();
    assert(app.stored().length === 3, `stored ${app.stored().length}`);
    assert($(".toast"), "no toast shown");
    app.click("#closeFormModal");
  });

  await test("an expanded section collapses when its popup closes", () => {
    app.click("#adminButton");
    const details = $(".earnings-months");
    assert(details, "no expandable section in the owner panel");

    details.open = true;
    app.click("#closeAdminPanel");
    assert(!details.open, "still open after closing the panel");

    // And via Escape, which closes the popup without going through the button.
    app.click("#adminButton");
    details.open = true;
    app.press(null, "Escape");
    assert(!details.open, "still open after Escape");
    return "collapses both ways";
  });

  await test("the short form no longer carries the fields it dropped", () => {
    app.click("#adminButton");
    app.click("#adminAddBooking");
    ["bookingId", "arrivalTime", "villaRoom", "bookingStatus", "idProof", "email", "vehicle", "requests"]
      .forEach((field) => assert(!$(`#${field}`), `#${field} is still on the form`));
    assert($("#amountPaid"), "the price is missing from the form");
    app.click("#closeFormModal");
    return "price kept, the rest gone";
  });

  await test("editing through the short form keeps the fields it cannot show", async () => {
    app.click("#todayButton");
    app.click(`#monthGrid [data-date="${day(1)}"]`);
    app.click("#selectedBookings [data-action='edit']");
    // Change a field the form does carry, leaving the name for later tests.
    app.fill("phone", "+91 90000 22222");
    app.submit("#bookingForm");
    await app.settle();

    const saved = app.stored().find((booking) => booking.phone === "+91 90000 22222");
    assert(saved, "the edit did not save");
    assert(saved.bookingId === "HMABC123", `confirmation code wiped: ${saved.bookingId}`);
    assert(saved.email === "ravi@example.com", `email wiped: ${saved.email}`);
    assert(saved.vehicle === "TS09AB1234", `vehicle wiped: ${saved.vehicle}`);
    assert(saved.idProof === "collected", `id proof wiped: ${saved.idProof}`);
    assert(saved.villaRoom === "Willow Villa", `villa wiped: ${saved.villaRoom}`);
    return "code, email, vehicle, id proof and villa all intact";
  });

  await test("owner sees private details and row actions", () => {
    app.click("#todayButton");
    app.click(`#monthGrid [data-date="${day(1)}"]`);
    const text = $("#selectedBookings").textContent;
    assert(text.includes("HMABC123"), "booking id missing");
    assert(text.includes("ravi@example.com"), "email missing");
    assert($$("#selectedBookings [data-action='edit']").length >= 1, "no edit button");
  });

  await test("edit loads the booking into the form", () => {
    app.click("#selectedBookings [data-action='edit']");
    assert($("#guestName").value === "Ravi Kumar", $("#guestName").value);
    assert($("#amountPaid").value === "12000", $("#amountPaid").value);
    app.click("#closeFormModal");
  });

  await test("delete asks first, then removes the booking", async () => {
    app.confirms.length = 0;
    app.click("#todayButton");
    app.click(`#monthGrid [data-date="${day(1)}"]`);
    app.click("#selectedBookings [data-action='delete']");
    await app.settle();
    assert(app.confirms.length === 1, "no confirm");
    assert(!app.stored().some((b) => b.guestName === "Ravi Kumar"), "still stored");
    return app.stored().map((b) => b.guestName).join(", ");
  });

  await test("CSV export writes every column", () => {
    app.click("#adminButton");
    app.click("#adminExportCsv");
    const text = app.downloads.at(-1);
    const columns = text.split("\n")[0].split('","').length;
    assert(columns === 20, `columns ${columns}`);
    return `${columns} columns, ${text.split("\n").length - 1} rows`;
  });

  await test("logout hides owner data but keeps the local-only copy", async () => {
    app.click("#adminButton");
    app.click("#adminLogout");
    await app.settle();
    await app.settle();
    assert(app.stored().length === 2, `bookings lost: ${app.stored().length}`);
    app.click("#todayButton");
    app.click(`#monthGrid [data-date="${day(2)}"]`);
    assert(!$$("#selectedBookings [data-action='edit']").length, "edit still shown");
    assert(!$("#selectedBookings").textContent.includes("Booking ID"), "owner detail still shown");
    return `${app.stored().length} kept on device`;
  });

  await test("no uncaught page errors", () => {
    assert(!app.errors.length, app.errors.map((e) => e.message).join(" | "));
  });

  const failures = test.report();
  app.close();
  return failures;
};

if (require.main === module) module.exports().then((f) => process.exit(f ? 1 : 0));
