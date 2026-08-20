// The shared-storage path: what happens once supabase-config.js is filled in.
// Exercised against a stubbed server so it can run without a real project.
const {
  startApp,
  createSuite,
  assert,
  day,
  TEST_PASSWORD,
  OWNER_SESSION_KEY,
  OWNER_PANEL_KEY,
} = require("./harness");

const publicRows = [
  {
    id: "remote-1", guest_name: "Rajesh Gupta", phone: "+91 90000 12345", platform: "airbnb",
    check_in: day(0), check_in_time: "14:00", check_out: day(3), checkout_time: "11:00",
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

const earningsRows = [
  { id: "airbnb:2023-05", platform: "airbnb", month: "2023-05-01", gross: "30850.00", net: "28382.00", source_note: "Airbnb earnings report" },
  { id: "airbnb:2023-06", platform: "airbnb", month: "2023-06-01", gross: "78000.00", net: "71760.00", source_note: "Airbnb earnings report" },
  { id: "airbnb:2024-01", platform: "airbnb", month: "2024-01-01", gross: "15100.00", net: "13892.00", source_note: "Airbnb earnings report" },
];

const privateRows = [
  {
    booking_id: "remote-1", external_booking_id: "HMREMOTE1", amount_paid: 24000,
    id_proof: "collected", email: "rajesh@example.com", vehicle: "TS09XY4321",
  },
];

const settleBoot = async (app) => {
  for (let tick = 0; tick < 8; tick += 1) await app.settle();
};

module.exports = async function run() {
  const test = createSuite("shared storage");

  // --- a caretaker phone with nothing saved locally -------------------------
  const phone = startApp({ bookings: [], lang: "en", supabase: { publicRows, privateRows } });
  await settleBoot(phone);

  await test("a phone with empty storage still shows the shared bookings", () => {
    assert(phone.stored().length === 2, `stored ${phone.stored().length}`);
    phone.click(`#monthGrid [data-date="${day(0)}"]`);
    const text = phone.$("#selectedBookings").textContent;
    assert(text.includes("Rajesh Gupta"), "booking not shown");
    phone.press(null, "Escape");
    return phone.stored().map((booking) => booking.guestName).join(", ");
  });

  await test("the sync line reports when the data arrived", () => {
    const status = phone.$("#syncStatus").textContent;
    assert(/^Updated /.test(status), status);
    assert(!phone.$("#refreshButton").hidden, "refresh button hidden");
    return status;
  });

  await test("owner-only fields are not sent to a caretaker phone", () => {
    const text = phone.$("#selectedBookings").textContent;
    assert(!text.includes("HMREMOTE1"), "booking id leaked");
    assert(!text.includes("rajesh@example.com"), "email leaked");
    const saved = phone.stored().find((booking) => booking.guestName === "Rajesh Gupta");
    assert(!saved.amountPaid, `amount kept on device: ${saved.amountPaid}`);
    assert(!saved.email, `email kept on device: ${saved.email}`);
  });

  await test("refresh picks up a booking added elsewhere", async () => {
    phone.server.publicRows.push({
      id: "remote-3", guest_name: "New Guest", phone: "9999900000", platform: "direct",
      check_in: day(20), check_in_time: "14:00", check_out: day(21), checkout_time: "11:00",
      arrival_time: null, villa_room: "Willow Villa", adults: 2, children: 0, pets: 0,
      status: "confirmed", requests: null, notes: null,
    });
    phone.click("#refreshButton");
    await settleBoot(phone);
    assert(phone.stored().length === 3, `stored ${phone.stored().length}`);
    return phone.stored().map((booking) => booking.guestName).join(", ");
  });

  await test("losing the network keeps the last copy and says so", async () => {
    phone.server.publicRows.length = 0;
    const failing = startApp({
      bookings: [{
        id: "cached-1", guestName: "Cached Guest", phone: "", platform: "direct",
        checkIn: day(1), checkOut: day(2), checkInTime: "14:00", checkoutTime: "11:00",
        adults: 2, children: 0, pets: 0, status: "confirmed", idProof: "pending",
        villaRoom: "Willow Villa",
      }],
      lang: "en",
      supabase: { publicRows: [], failReads: true },
    });
    await settleBoot(failing);
    assert(failing.$("#syncStatus").textContent === "Offline — showing saved copy", failing.$("#syncStatus").textContent);
    assert(failing.stored().length === 1, "cached booking lost");
    failing.close();
  });

  await test("a project without the schema says so, not \"offline\"", async () => {
    const bare = startApp({
      bookings: [],
      lang: "en",
      supabase: { publicRows: [], missingTables: true },
    });
    await settleBoot(bare);
    const status = bare.$("#syncStatus").textContent;
    assert(status === "Cloud storage is not set up yet", status);
    bare.close();
    return status;
  });

  phone.close();

  // --- the owner's device ---------------------------------------------------
  const owner = startApp({ bookings: [], lang: "en", supabase: { publicRows, privateRows } });
  await settleBoot(owner);

  await test("signing in reloads the page and keeps the session", async () => {
    owner.click("#adminButton");
    owner.$("#adminUsername").value = "Venu";
    owner.$("#adminPassword").value = TEST_PASSWORD;
    owner.submit("#adminLoginForm");
    await settleBoot(owner);
    assert(owner.reloads.length === 1, `reloads ${owner.reloads.length}`);
    assert(owner.window.sessionStorage.getItem(OWNER_SESSION_KEY) === "1", "session not remembered");
    assert(owner.window.sessionStorage.getItem(OWNER_PANEL_KEY) === "1", "panel not queued");
  });

  await test("a wrong password neither signs in nor reloads", async () => {
    const other = startApp({ bookings: [], lang: "en", supabase: { publicRows, privateRows } });
    await settleBoot(other);
    other.click("#adminButton");
    other.$("#adminUsername").value = "Venu";
    other.$("#adminPassword").value = "wrong";
    other.submit("#adminLoginForm");
    await settleBoot(other);
    assert(!other.reloads.length, `reloaded ${other.reloads.length} times`);
    assert(!other.$("#adminLoginError").hidden, "no error shown");
    assert(other.window.sessionStorage.getItem(OWNER_SESSION_KEY) !== "1", "session remembered anyway");
    other.close();
  });

  await test("an unconfirmed owner email says so, not \"wrong password\"", async () => {
    const unconfirmed = startApp({
      bookings: [],
      lang: "en",
      supabase: {
        publicRows,
        privateRows,
        signInError: { code: "email_not_confirmed", message: "Email not confirmed" },
      },
    });
    await settleBoot(unconfirmed);
    unconfirmed.click("#adminButton");
    unconfirmed.$("#adminUsername").value = "Venu";
    unconfirmed.$("#adminPassword").value = TEST_PASSWORD;
    unconfirmed.submit("#adminLoginForm");
    await settleBoot(unconfirmed);
    const shown = unconfirmed.$("#adminLoginError").textContent;
    assert(/not been confirmed/.test(shown), shown);
    assert(!unconfirmed.reloads.length, "reloaded on a failed sign-in");
    unconfirmed.close();
    return shown;
  });

  await test("a slow cloud client never falls back to the built-in password", async () => {
    const slow = startApp({ bookings: [], lang: "en", supabase: { publicRows, privateRows } });
    // Sign in immediately, before boot has had a chance to create the client.
    slow.click("#adminButton");
    slow.$("#adminUsername").value = "Venu";
    slow.$("#adminPassword").value = TEST_PASSWORD;
    slow.submit("#adminLoginForm");
    await settleBoot(slow);
    await settleBoot(slow);
    const shown = slow.$("#adminLoginError").hidden ? "" : slow.$("#adminLoginError").textContent;
    assert(!/Wrong username or password/.test(shown), `reported as a bad password: ${shown}`);
    assert(slow.server.signedIn, "did not sign in against the server");
    slow.close();
    return "signed in against Supabase, not the local hash";
  });

  owner.close();

  // --- landing back on the page after that reload ---------------------------
  const reloaded = startApp({
    bookings: [],
    lang: "en",
    supabase: { publicRows, privateRows, earningsRows },
    session: { [OWNER_SESSION_KEY]: "1", [OWNER_PANEL_KEY]: "1" },
  });
  reloaded.server.signedIn = true;
  await settleBoot(reloaded);

  await test("the reload lands back in owner view with the panel open", () => {
    assert(reloaded.$("#adminButtonLabel").textContent === "Owner view", reloaded.$("#adminButtonLabel").textContent);
    assert(!reloaded.$("#adminPanelModal").hidden, "owner panel did not reopen");
    assert(reloaded.$("#financeTotal").textContent.includes("24,000"), reloaded.$("#financeTotal").textContent);
    return reloaded.$("#financeTotal").textContent;
  });

  await test("the owner panel shows platform earnings by year", () => {
    const block = reloaded.$("#earningsBlock");
    assert(!block.hidden, "earnings block hidden for the owner");
    const cards = reloaded.$$("#earningsYears .earnings-card");
    // all time + 2023 + 2024
    assert(cards.length === 3, `${cards.length} cards`);
    const allTime = cards[0].textContent;
    assert(/1,23,950/.test(allTime), allTime);
    const months = reloaded.$$("#earningsMonths .earnings-row");
    assert(months.length === 3, `${months.length} month rows`);
    return cards.map((c) => c.querySelector("strong").textContent).join("  |  ");
  });

  await test("a caretaker never sees the earnings block", async () => {
    const caretaker = startApp({
      bookings: [],
      lang: "en",
      supabase: { publicRows, privateRows, earningsRows },
    });
    await settleBoot(caretaker);
    assert(caretaker.$("#earningsBlock").hidden, "earnings shown without signing in");
    assert(!caretaker.$("#earningsYears").textContent.trim(), "earnings rendered anyway");
    caretaker.close();
  });

  await test("the owner sees the private details a caretaker does not", () => {
    reloaded.click("#closeAdminPanel");
    reloaded.click(`#monthGrid [data-date="${day(0)}"]`);
    const text = reloaded.$("#selectedBookings").textContent;
    assert(text.includes("HMREMOTE1"), "booking id missing");
    assert(text.includes("rajesh@example.com"), "email missing");
    reloaded.press(null, "Escape");
  });

  await test("an edit is written to the server, not just the device", async () => {
    reloaded.click(`#monthGrid [data-date="${day(0)}"]`);
    reloaded.click("#selectedBookings [data-action='edit']");
    reloaded.fill("guestName", "Rajesh Gupta Jr");
    reloaded.submit("#bookingForm");
    await settleBoot(reloaded);
    const saved = reloaded.server.publicRows.find((row) => row.id === "remote-1");
    assert(saved.guest_name === "Rajesh Gupta Jr", `server has ${saved.guest_name}`);
    return `server updated to ${saved.guest_name}`;
  });

  await test("a delete removes the row from the server", async () => {
    reloaded.click("#todayButton");
    reloaded.click(`#monthGrid [data-date="${day(10)}"]`);
    reloaded.click("#selectedBookings [data-action='delete']");
    await settleBoot(reloaded);
    assert(reloaded.server.deleted.includes("remote-2"), `deleted ${reloaded.server.deleted.join(",")}`);
    assert(!reloaded.server.publicRows.some((row) => row.id === "remote-2"), "row still on server");
  });

  await test("signing out clears the session and reloads", async () => {
    const before = reloaded.reloads.length;
    reloaded.click("#adminButton");
    reloaded.click("#adminLogout");
    await settleBoot(reloaded);
    assert(reloaded.reloads.length === before + 1, `reloads ${reloaded.reloads.length - before}`);
    assert(reloaded.window.sessionStorage.getItem(OWNER_SESSION_KEY) !== "1", "session kept");
    assert(!reloaded.server.signedIn, "still signed in on the server");
  });

  await test("no uncaught page errors", () => {
    assert(!reloaded.errors.length, reloaded.errors.map((error) => error.message).join(" | "));
  });

  reloaded.close();

  // --- first run: local bookings get pushed up ------------------------------
  const migrating = startApp({
    bookings: [{
      id: "local-1", guestName: "Existing Local", phone: "9848012345", platform: "airbnb",
      checkIn: day(5), checkOut: day(8), checkInTime: "14:00", checkoutTime: "11:00",
      adults: 2, children: 0, pets: 0, status: "confirmed", idProof: "pending",
      villaRoom: "Willow Villa", amountPaid: "15000",
    }],
    lang: "en",
    supabase: { publicRows: [], privateRows: [] },
  });
  await settleBoot(migrating);

  await test("the first owner sign-in uploads what was saved on this device", async () => {
    migrating.click("#adminButton");
    migrating.$("#adminUsername").value = "Venu";
    migrating.$("#adminPassword").value = TEST_PASSWORD;
    migrating.submit("#adminLoginForm");
    await settleBoot(migrating);
    const uploaded = migrating.server.publicRows.find((row) => row.guest_name === "Existing Local");
    assert(uploaded, "nothing uploaded");
    assert(uploaded.check_in === day(5), `check-in ${uploaded.check_in}`);
    const money = migrating.server.privateRows.find((row) => row.booking_id === uploaded.id);
    assert(money && Number(money.amount_paid) === 15000, `amount ${money && money.amount_paid}`);
    return `${uploaded.guest_name} pushed to the server with its amount`;
  });

  await test("no uncaught page errors during migration", () => {
    assert(!migrating.errors.length, migrating.errors.map((error) => error.message).join(" | "));
  });

  migrating.close();

  return test.report();
};

if (require.main === module) module.exports().then((f) => process.exit(f ? 1 : 0));
