// The owner's ways of adding a booking, and the list of bookings and payments.
const { startApp, createSuite, assert, day, OWNER_SESSION_KEY } = require("./harness");

const REMEMBER_KEY = "willow-the-villa-owner-remembered";

const seed = [
  {
    id: "a", guestName: "Ravi Kumar", phone: "+91 90000 11111", platform: "airbnb",
    checkIn: day(5), checkOut: day(8), checkInTime: "14:00", checkoutTime: "11:00",
    adults: 2, children: 0, pets: 0, status: "confirmed", idProof: "pending",
    villaRoom: "Willow Villa", amountPaid: "12000",
  },
  {
    id: "b", guestName: "Old Guest", phone: "", platform: "booking",
    checkIn: day(-20), checkOut: day(-18), checkInTime: "14:00", checkoutTime: "11:00",
    adults: 2, children: 0, pets: 0, status: "confirmed", idProof: "pending",
    villaRoom: "Willow Villa", amountPaid: "",
  },
];

const PASTED = `Airbnb
Confirmation code HMPASTE123
CHECK-IN
Mon, Mar 1, 2027
3:00 PM
CHECKOUT
Thu, Mar 4, 2027
11:00 AM
Guests
2 adults
Guest name Priya Ramesh
Phone +91 98480 12345
Total (INR) Rs 9,500`;

const remoteRows = [
  {
    id: "remote-1", guest_name: "Rajesh Gupta", phone: "+91 90000 12345", platform: "airbnb",
    check_in: day(2), check_in_time: "14:00", check_out: day(4), checkout_time: "11:00",
    arrival_time: null, villa_room: "Willow Villa", adults: 2, children: 0, pets: 0,
    status: "confirmed", requests: null, notes: null,
  },
  {
    id: "remote-2", guest_name: "Latha S", phone: "9848011111", platform: "booking",
    check_in: day(10), check_in_time: "14:00", check_out: day(12), checkout_time: "11:00",
    arrival_time: null, villa_room: "Willow Villa", adults: 4, children: 1, pets: 0,
    status: "confirmed", requests: null, notes: null,
  },
];

const settleBoot = async (app) => {
  for (let tick = 0; tick < 8; tick += 1) await app.settle();
};

module.exports = async function run() {
  const test = createSuite("owner: adding bookings");
  const app = startApp({ bookings: seed, lang: "en" });
  const { $, $$ } = app;
  const platformValue = () => $("#bookingForm").elements.platform.value;

  await test("a caretaker sees none of the owner's add controls", () => {
    assert($("#ownerAddFab").hidden, "add button shown to a caretaker");
    app.click(`#monthGrid [data-date="${day(10)}"]`);
    assert(!$("#selectedBookings [data-action='add']"), "add-from-date shown to a caretaker");
    app.press(null, "Escape");
    assert(!$$(".ledger-row").length, "payments list rendered for a caretaker");
    return "no add button, no add-from-date, no payments list";
  });

  await test("signing in with 'keep me signed in' remembers this phone", () => {
    app.click("#adminButton");
    $("#adminUsername").value = "Venu";
    $("#adminPassword").value = require("./harness").TEST_PASSWORD;
    $("#adminRemember").checked = true;
    app.submit("#adminLoginForm");
    assert(app.window.localStorage.getItem(REMEMBER_KEY) === "1", "phone not remembered");
    assert(!$("#ownerAddFab").hidden, "add button hidden for the owner");
    return "remembered, add button showing";
  });

  await test("the owner panel lists each booking with its payment", () => {
    if ($("#adminPanelModal").hidden) app.click("#adminButton");
    const upcoming = $$("#ledgerList .ledger-row").map((row) => row.textContent.replace(/\s+/g, " ").trim());
    assert(upcoming.length === 1, `${upcoming.length} upcoming rows`);
    assert(/Ravi Kumar/.test(upcoming[0]) && /12,000/.test(upcoming[0]), upcoming[0]);
    app.click("#ledgerTabs [data-ledger='past']");
    const past = $$("#ledgerList .ledger-row").map((row) => row.textContent.replace(/\s+/g, " ").trim());
    assert(past.length === 1 && /Old Guest/.test(past[0]) && /No amount/.test(past[0]), past.join(" | "));
    return `${upcoming[0]}  ||  ${past[0]}`;
  });

  await test("tapping a row in the list opens that booking for editing", () => {
    app.click("#ledgerTabs [data-ledger='upcoming']");
    app.click("#ledgerList .ledger-row");
    assert($("#adminPanelModal").hidden, "panel still open");
    assert(!$("#formModal").hidden, "form did not open");
    assert($("#guestName").value === "Ravi Kumar", $("#guestName").value);
    assert($("#amountPaid").value === "12000", $("#amountPaid").value);
    app.click("#closeFormModal");
  });

  await test("a day the owner taps offers to add a booking starting that day", () => {
    app.click(`#monthGrid [data-date="${day(10)}"]`);
    app.click("#selectedBookings [data-action='add']");
    assert(!$("#formModal").hidden, "form did not open");
    assert($("#checkIn").value === day(10), `check-in ${$("#checkIn").value}`);
    assert($("#checkOut").value === day(11), `check-out ${$("#checkOut").value}`);
    return `${$("#checkIn").value} -> ${$("#checkOut").value}`;
  });

  await test("the nights buttons move the check-out", () => {
    app.click("#bookingForm [data-nights='1']");
    app.click("#bookingForm [data-nights='1']");
    assert($("#checkOut").value === day(13), `check-out ${$("#checkOut").value}`);
    assert($("#nightsCount").textContent === "3", `nights ${$("#nightsCount").textContent}`);
    app.click("#bookingForm [data-nights='-1']");
    app.click("#bookingForm [data-nights='-1']");
    app.click("#bookingForm [data-nights='-1']");
    assert($("#checkOut").value === day(11), `never below one night: ${$("#checkOut").value}`);
    app.click("#bookingForm [data-nights='1']");
    app.click("#bookingForm [data-nights='1']");
    return "3 nights, and never fewer than 1";
  });

  await test("moving the check-in keeps the number of nights", () => {
    app.fill("checkIn", day(20));
    assert($("#checkOut").value === day(23), `check-out ${$("#checkOut").value}`);
    return `${day(20)} -> ${$("#checkOut").value}`;
  });

  await test("tapping elsewhere in the form leaves the dates alone", () => {
    ["#guestName", "#phone", "#amountPaid", "#notes", "#nightsCount", "#bookingForm"].forEach((target) => {
      app.click(target);
    });
    $("#bookingForm input[name='platform'][value='direct']").click();
    $("#bookingForm input[name='platform'][value='airbnb']").click();
    assert($("#checkOut").value === day(23), `check-out moved to ${$("#checkOut").value}`);
    return "still 3 nights";
  });

  await test("the guest buttons count up and never go below the minimum", () => {
    app.click("#bookingForm [data-step='adults'][data-delta='1']");
    app.click("#bookingForm [data-step='children'][data-delta='-1']");
    assert($("#adults").value === "3", `adults ${$("#adults").value}`);
    assert($("#children").value === "0", `children ${$("#children").value}`);
  });

  await test("a clash shows while picking the dates", () => {
    app.fill("checkIn", day(6));
    assert(!$("#overlapWarning").hidden, "no warning for overlapping dates");
    assert(/Ravi Kumar/.test($("#overlapWarning").textContent), $("#overlapWarning").textContent);
    const shown = $("#overlapWarning").textContent;
    app.fill("checkIn", day(30));
    assert($("#overlapWarning").hidden, "warning left up after moving the dates");
    return shown;
  });

  await test("the source is one tap and is saved with the booking", async () => {
    $("#bookingForm input[name='platform'][value='booking']").click();
    assert(platformValue() === "booking", platformValue());
    app.fill("guestName", "New Guest");
    app.submit("#bookingForm");
    await app.settle();
    const saved = app.stored().find((booking) => booking.guestName === "New Guest");
    assert(saved, "not saved");
    assert(saved.platform === "booking", saved.platform);
    assert(saved.adults === 3, `adults ${saved.adults}`);
    assert(saved.checkIn === day(30) && saved.checkOut === day(33), `${saved.checkIn} -> ${saved.checkOut}`);
    assert($("#formModal").hidden, "form left open after saving");
    return `${saved.guestName}, ${saved.platform}, ${saved.checkIn} -> ${saved.checkOut}`;
  });

  await test("the add button on the calendar opens a fresh form", () => {
    app.click("#ownerAddFab");
    assert(!$("#formModal").hidden, "form did not open");
    assert(!$("#guestName").value, `name left over: ${$("#guestName").value}`);
    assert(platformValue() === "airbnb", `source ${platformValue()}`);
  });

  await test("a pasted confirmation fills the form", () => {
    $("#pasteBox").open = true;
    $("#pasteText").value = PASTED;
    app.click("#pasteFill");
    assert($("#guestName").value === "Priya Ramesh", `name ${$("#guestName").value}`);
    assert(/98480/.test($("#phone").value), `phone ${$("#phone").value}`);
    assert($("#checkIn").value === "2027-03-01", `check-in ${$("#checkIn").value}`);
    assert($("#checkOut").value === "2027-03-04", `check-out ${$("#checkOut").value}`);
    assert(platformValue() === "airbnb", platformValue());
    assert($("#amountPaid").value === "9500", `amount ${$("#amountPaid").value}`);
    assert(!$("#pasteBox").open, "paste box left open");
    return `${$("#guestName").value}, ${$("#checkIn").value} -> ${$("#checkOut").value}, ${$("#amountPaid").value}`;
  });

  await test("saving keeps the confirmation code the form has no field for", async () => {
    app.submit("#bookingForm");
    await app.settle();
    const saved = app.stored().find((booking) => booking.guestName === "Priya Ramesh");
    assert(saved, "not saved");
    assert(saved.bookingId === "HMPASTE123", `code ${saved.bookingId}`);
    return saved.bookingId;
  });

  await test("text with no booking in it says so", () => {
    app.click("#ownerAddFab");
    $("#pasteText").value = "Hello, see you soon!";
    app.click("#pasteFill");
    const shown = $$(".toast").at(-1).textContent;
    assert(/No booking details/.test(shown), shown);
    assert(!$("#guestName").value, "name filled from nothing");
    app.click("#closeFormModal");
  });

  await test("logging out forgets this phone", async () => {
    app.click("#adminButton");
    app.click("#adminLogout");
    await app.settle();
    assert(app.window.localStorage.getItem(REMEMBER_KEY) === null, "still remembered");
    assert($("#ownerAddFab").hidden, "add button still showing");
  });

  await test("no uncaught page errors", () => {
    assert(!app.errors.length, app.errors.map((e) => e.message).join(" | "));
  });
  app.close();

  // --- two devices: a delete on one must not be undone by a save on the other ---
  await test("a save does not bring back a booking deleted on another device", async () => {
    const phone = startApp({
      bookings: [],
      lang: "en",
      supabase: { publicRows: remoteRows },
      session: { [OWNER_SESSION_KEY]: "1" },
    });
    phone.server.signedIn = true;
    await settleBoot(phone);
    assert(phone.stored().length === 2, `loaded ${phone.stored().length}`);

    // Deleted elsewhere after this phone loaded.
    phone.server.publicRows = phone.server.publicRows.filter((row) => row.id !== "remote-2");

    phone.click("#ownerAddFab");
    phone.fill("guestName", "Second Phone Guest");
    phone.fill("checkIn", day(50));
    phone.submit("#bookingForm");
    await settleBoot(phone);

    const ids = phone.server.publicRows.map((row) => row.guest_name);
    assert(ids.includes("Second Phone Guest"), `new booking missing: ${ids.join(", ")}`);
    assert(!ids.includes("Latha S"), `deleted booking came back: ${ids.join(", ")}`);
    const sent = phone.server.upserts.filter((upsert) => upsert.table === "bookings").map((u) => u.row.guest_name);
    phone.close();
    return `sent only: ${sent.join(", ")}`;
  });

  return test.report();
};

if (require.main === module) module.exports().then((f) => process.exit(f ? 1 : 0));
