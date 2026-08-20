// What a caretaker can do without logging in.
const { startApp, createSuite, assert, day } = require("./harness");

const seed = [
  {
    id: "a", guestName: "Ravi Kumar", phone: "+91 90000 11111", platform: "airbnb",
    checkIn: day(-1), checkOut: day(2), checkInTime: "14:00", checkoutTime: "11:00",
    adults: 2, children: 1, pets: 0, status: "confirmed", idProof: "collected",
    villaRoom: "Willow Villa", bookingId: "HMABC123", email: "ravi@example.com",
    notes: "late check in, need extra towels",
  },
  {
    id: "b", guestName: "Sita Devi", phone: "9876543210", platform: "booking",
    checkIn: day(0), checkOut: day(3), checkInTime: "14:00", checkoutTime: "11:00",
    adults: 2, children: 0, pets: 0, status: "confirmed", idProof: "pending",
    villaRoom: "Willow Villa",
  },
  {
    id: "c", guestName: "Old Guest", phone: "", platform: "direct",
    checkIn: day(-30), checkOut: day(-28), checkInTime: "14:00", checkoutTime: "11:00",
    adults: 1, children: 0, pets: 0, status: "confirmed", idProof: "pending",
    villaRoom: "Willow Villa",
  },
];

module.exports = async function run() {
  const app = startApp({ bookings: seed, lang: "te" });
  const { $, $$ } = app;
  const test = createSuite("caretaker view");

  await test("calendar renders a six week grid", () => {
    assert($$("#monthGrid [data-date]").length === 42, "cells");
  });

  await test("sync line reports local-only storage", () => {
    assert($("#refreshButton").hidden, "refresh shown without Supabase");
    assert($("#syncStatus").textContent.length > 0, "empty status");
    return $("#syncStatus").textContent;
  });

  await test("day cells carry a spoken label and a single tab stop", () => {
    const cell = $(`#monthGrid [data-date="${day(0)}"]`);
    assert(cell.getAttribute("aria-current") === "date", "aria-current missing");
    assert(/Ravi|Sita/.test(cell.getAttribute("aria-label")), cell.getAttribute("aria-label"));
    assert($$("#monthGrid [data-date]").filter((c) => c.tabIndex === 0).length === 1, "tab stops");
    return cell.getAttribute("aria-label");
  });

  await test("tapping a day lists that day's guests", () => {
    app.click(`#monthGrid [data-date="${day(0)}"]`);
    assert(!$("#bookingModal").hidden, "modal closed");
    assert($$("#selectedBookings .guest-card").length === 2, "cards");
    return $("#selectedTitle").textContent;
  });

  await test("status chip is derived from today, not the stored value", () => {
    const chips = $$("#selectedBookings .status-chip").map((c) => c.className);
    assert(chips.some((c) => c.includes("staying")), chips.join(" | "));
    assert(chips.some((c) => c.includes("arriving")), chips.join(" | "));
    return chips.join(" | ");
  });

  await test("owner-only fields stay hidden", () => {
    const text = $("#selectedBookings").textContent;
    assert(!text.includes("HMABC123"), "booking id leaked");
    assert(!text.includes("ravi@example.com"), "email leaked");
    assert(!$$("#selectedBookings [data-action='edit']").length, "edit button shown");
  });

  await test("escape closes the top modal only", () => {
    app.press(null, "Escape");
    assert($("#bookingModal").hidden, "still open");
  });

  await test("search matches names and phone digits", () => {
    app.fill("searchInput", "ravi");
    assert($$(".search-hit").length === 1, "name hits");
    app.fill("searchInput", "98765");
    assert($$(".search-hit").length === 1, "phone hits");
    const label = $(".search-hit").textContent.replace(/\s+/g, " ").trim();
    app.fill("searchInput", "zzzz");
    assert($(".search-empty"), "no empty state");
    app.fill("searchInput", "");
    assert($("#searchResults").hidden, "results still open");
    return label;
  });

  await test("a search hit jumps to the booking", () => {
    app.fill("searchInput", "sita");
    app.click(".search-hit");
    assert(!$("#bookingModal").hidden, "modal closed");
    assert($("#searchResults").hidden, "results still open");
    app.press(null, "Escape");
  });

  await test("arrow keys walk the grid", () => {
    const start = $(`#monthGrid [data-date="${day(0)}"]`);
    start.focus();
    app.press(start, "ArrowRight");
    const focused = app.window.document.activeElement;
    assert(focused.dataset.date === day(1), `focused ${focused.dataset.date}`);
    return focused.dataset.date;
  });

  await test("language toggle rewrites the page", () => {
    app.click("#languageToggle");
    assert(app.window.document.documentElement.lang === "en", "html lang");
    assert($("#todayButton").textContent === "Today", $("#todayButton").textContent);
    assert($("#searchInput").placeholder.startsWith("Guest name"), $("#searchInput").placeholder);
  });

  await test("every visible bar carries a readable name", () => {
    app.click("#todayButton");
    const pills = $$("#monthGrid .booking-pill");
    assert(pills.length, "no bars drawn");
    assert(!$$("#monthGrid .booking-avatar").length, "avatar still taking room from the name");

    const starts = $$("#monthGrid .booking-pill.start, #monthGrid .booking-pill.same-day");
    assert(starts.length, "no arrival bars");
    starts.forEach((pill) => {
      const name = pill.querySelector(".booking-name");
      assert(name, `arrival bar with no name: ${pill.className}`);
      assert(name.textContent.trim().length >= 2, `name too short: "${name.textContent}"`);
    });
    return `${starts.length} arrival bars, all named`;
  });

  await test("a stay running into the next week is named again on the Sunday", () => {
    // A fortnight is guaranteed to cross a Sunday whatever day the test runs.
    const long = startApp({
      lang: "en",
      bookings: [{
        id: "long", guestName: "Sateesan Nair", phone: "9848012345", platform: "makemytrip",
        checkIn: day(1), checkOut: day(15), checkInTime: "14:00", checkoutTime: "11:00",
        adults: 2, children: 0, pets: 0, status: "confirmed", idProof: "pending",
        villaRoom: "Willow Villa",
      }],
    });
    const sundayMiddles = long.$$("#monthGrid .day-cell.dow-0 .booking-pill.middle");
    assert(sundayMiddles.length >= 1, "no week continuation bar found");
    sundayMiddles.forEach((pill) => {
      const name = pill.querySelector(".booking-name");
      assert(name, "week continuation bar has no name");
      assert(name.textContent.includes("Sateesan"), `named "${name.textContent}"`);
    });
    const named = sundayMiddles[0].querySelector(".booking-name").textContent;
    long.close();
    return `${sundayMiddles.length} continuation bars, first reads "${named}"`;
  });

  await test("overlays follow the visual viewport when a keyboard opens", () => {
    const root = app.window.document.documentElement;
    // jsdom has no visualViewport, so the app must simply not fall over.
    assert(!app.errors.length, "viewport tracking threw");

    const viewport = { height: 380, offsetTop: 0, addEventListener() {}, removeEventListener() {} };
    const keyboard = startApp({ lang: "en", bookings: [], visualViewport: viewport });
    const styled = keyboard.window.document.documentElement.style;
    assert(styled.getPropertyValue("--viewport-height") === "380px", styled.getPropertyValue("--viewport-height"));
    keyboard.close();
    void root;
    return "modal height follows the keyboard";
  });

  await test("no uncaught page errors", () => {
    assert(!app.errors.length, app.errors.map((e) => e.message).join(" | "));
  });

  const failures = test.report();
  app.close();
  return failures;
};

if (require.main === module) module.exports().then((f) => process.exit(f ? 1 : 0));
