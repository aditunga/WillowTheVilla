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

  await test("the grid shows this month only, in whole weeks", () => {
    const cells = $$("#monthGrid .day-cell");
    const days = $$("#monthGrid [data-date]");
    assert(cells.length % 7 === 0, `${cells.length} cells is not whole weeks`);

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    assert(days.length === daysInMonth, `${days.length} day cells for a ${daysInMonth} day month`);

    // Neighbouring months are spacers: no number, nothing to tap.
    const spacers = $$("#monthGrid .day-cell.outside");
    assert(cells.length === days.length + spacers.length, "unexpected cells");
    spacers.forEach((cell) => {
      assert(!cell.textContent.trim(), `spacer shows "${cell.textContent.trim()}"`);
      assert(!cell.hasAttribute("data-date"), "spacer is still tappable");
    });
    return `${days.length} days + ${spacers.length} spacers = ${cells.length}`;
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

  await test("the stay is stated once, not as four repeating tiles", () => {
    const english = startApp({ lang: "en", bookings: seed });
    english.click(`#monthGrid [data-date="${day(0)}"]`);
    const card = english.$$("#selectedBookings .guest-card").find((c) => /Sita/.test(c.textContent));
    assert(card, "no card for Sita");

    const summary = card.querySelector(".stay-summary");
    assert(summary, "no stay summary");
    const legs = summary.querySelectorAll(".stay-leg");
    assert(legs.length === 2, `${legs.length} legs`);
    assert(/Check-in/i.test(legs[0].textContent), legs[0].textContent);
    assert(/2:00/.test(legs[0].textContent), `no check-in time: ${legs[0].textContent}`);
    assert(/11:00/.test(legs[1].textContent), `no checkout time: ${legs[1].textContent}`);

    // The tiles that repeated all of this are gone.
    const labels = [...card.querySelectorAll(".detail span")].map((n) => n.textContent);
    ["Dates", "Check-in time", "Arrival time", "Checkout time"].forEach((gone) => {
      assert(!labels.includes(gone), `"${gone}" tile is still there`);
    });
    const result = `${summary.querySelector(".stay-nights").textContent.trim()}, tiles: ${labels.join(", ")}`;
    english.close();
    return result;
  });

  await test("one night reads as a night, not 1 nights", () => {
    const single = startApp({
      lang: "en",
      bookings: [{
        id: "one", guestName: "One Night", phone: "", platform: "airbnb",
        checkIn: "2026-08-20", checkOut: "2026-08-21", checkInTime: "14:00",
        checkoutTime: "11:00", adults: 1, children: 0, pets: 0,
        status: "confirmed", idProof: "pending", villaRoom: "Willow Villa",
      }],
    });
    single.click(`#monthGrid [data-date="2026-08-20"]`);
    const nights = single.$(".stay-nights").textContent.trim();
    assert(nights === "1 night", `reads "${nights}"`);
    single.close();
    return nights;
  });

  await test("an arrival time is kept, not dropped with the tiles", () => {
    const late = startApp({
      lang: "en",
      bookings: [{
        id: "late", guestName: "Late Arrival", phone: "", platform: "airbnb",
        checkIn: "2026-08-20", checkOut: "2026-08-22", checkInTime: "14:00",
        checkoutTime: "11:00", arrivalTime: "18:30", adults: 1, children: 0, pets: 0,
        status: "confirmed", idProof: "pending", villaRoom: "Willow Villa",
      }],
    });
    late.click(`#monthGrid [data-date="2026-08-20"]`);
    const leg = late.$(".stay-leg");
    assert(/6:30/.test(leg.textContent), `arrival time lost: ${leg.textContent}`);
    late.close();
    return leg.textContent.replace(/\s+/g, " ").trim();
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

  await test("every bar is one span with a name on it", () => {
    app.click("#todayButton");
    const bars = $$("#monthGrid .booking-overlay .booking-bar");
    assert(bars.length, "no bars drawn");
    bars.forEach((bar) => {
      const name = bar.querySelector(".booking-bar-name");
      assert(name, `bar with no name: ${bar.className}`);
      assert(name.textContent.trim().length >= 2, `name too short: "${name.textContent}"`);
      assert(/grid-column:\s*\d+\s*\/\s*span\s*\d+/.test(bar.getAttribute("style")), bar.getAttribute("style"));
    });
    return `${bars.length} bars, each one span with a name`;
  });

  await test("a stay runs from midday of arrival to midday of departure", () => {
    // A three night stay inside one week: half of the arrival day, two whole days,
    // half of the departure day = 6 half columns.
    const single = startApp({
      lang: "en",
      bookings: [{
        id: "mid", guestName: "Midday Guest", phone: "", platform: "airbnb",
        checkIn: "2026-08-17", checkOut: "2026-08-20", checkInTime: "14:00",
        checkoutTime: "11:00", adults: 1, children: 0, pets: 0,
        status: "confirmed", idProof: "pending", villaRoom: "Willow Villa",
      }],
    });
    // 17 Aug 2026 is a Monday: day index 1, so half columns 4..9.
    const bar = single.$$("#monthGrid .booking-bar").find((b) => /Midday/.test(b.textContent));
    assert(bar, "no bar drawn");
    const style = bar.getAttribute("style");
    const [, start, span] = style.match(/grid-column:\s*(\d+)\s*\/\s*span\s*(\d+)/);
    assert(Number(start) === 4, `starts at half column ${start}, expected 4`);
    assert(Number(span) === 6, `spans ${span} half columns, expected 6`);
    assert(bar.classList.contains("opens") && bar.classList.contains("closes"), bar.className);
    single.close();
    return `half columns ${start}..${Number(start) + Number(span) - 1}`;
  });

  await test("a turnover day carries the departing and arriving halves", () => {
    const turnover = startApp({
      lang: "en",
      bookings: [
        { id: "out", guestName: "Leaves Wed", phone: "", platform: "airbnb",
          checkIn: "2026-08-17", checkOut: "2026-08-19", checkInTime: "14:00",
          checkoutTime: "11:00", adults: 1, children: 0, pets: 0,
          status: "confirmed", idProof: "pending", villaRoom: "Willow Villa" },
        { id: "in", guestName: "Arrives Wed", phone: "", platform: "direct",
          checkIn: "2026-08-19", checkOut: "2026-08-21", checkInTime: "14:00",
          checkoutTime: "11:00", adults: 1, children: 0, pets: 0,
          status: "confirmed", idProof: "pending", villaRoom: "Willow Villa" },
      ],
    });
    const bars = turnover.$$("#monthGrid .booking-bar");
    const spans = bars.map((bar) => {
      const [, start, span] = bar.getAttribute("style").match(/grid-column:\s*(\d+)\s*\/\s*span\s*(\d+)/);
      return { start: Number(start), end: Number(start) + Number(span) - 1, lane: bar.getAttribute("style").match(/--lane: (\d+)/)[1] };
    });
    // Wed 19 Aug is day index 3: its halves are 7 and 8. One stay ends at 7,
    // the next begins at 8, so they meet without overlapping.
    const leaving = spans.find((s) => s.start === 4);
    const arriving = spans.find((s) => s.start === 8);
    assert(leaving && leaving.end === 7, `departing bar ends at ${leaving && leaving.end}, expected 7`);
    assert(arriving && arriving.start === 8, "arriving bar does not start at the second half of the day");
    assert(spans.every((s) => s.lane === "0"), "they were stacked despite not overlapping");
    turnover.close();
    return `leaves ends ${leaving.end}, arrives starts ${arriving.start}`;
  });

  await test("a stay running into the next week is named again on the Sunday", () => {
    // 5 to 12 August 2026 crosses the Saturday/Sunday break inside one month.
    const long = startApp({
      lang: "en",
      bookings: [{
        id: "long", guestName: "Sateesan Nair", phone: "9848012345", platform: "makemytrip",
        checkIn: "2026-08-05", checkOut: "2026-08-12", checkInTime: "14:00", checkoutTime: "11:00",
        adults: 2, children: 0, pets: 0, status: "confirmed", idProof: "pending",
        villaRoom: "Willow Villa",
      }],
    });
    const bars = long.$$("#monthGrid .booking-overlay .booking-bar");
    assert(bars.length >= 2, `${bars.length} bars for a stay crossing a week`);
    bars.forEach((bar) => {
      const name = bar.querySelector(".booking-bar-name");
      assert(name && name.textContent.includes("Sateesan"), `named "${name && name.textContent}"`);
    });
    // Only the true ends are rounded; the week break is left square so it reads as
    // one continuing stay.
    assert(bars.filter((bar) => bar.classList.contains("opens")).length === 1, "more than one opening end");
    assert(bars.filter((bar) => bar.classList.contains("closes")).length === 1, "more than one closing end");
    const named = bars[0].querySelector(".booking-bar-name").textContent;
    long.close();
    return `${bars.length} row segments, all reading "${named}"`;
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

  await test("no bar is drawn on a day that cannot be tapped", () => {
    // A stay in the previous month, overlapping the spacer cells of this one.
    const spill = startApp({
      lang: "en",
      bookings: [
        { id: "prev", guestName: "Previous Month", phone: "", platform: "booking",
          checkIn: "2026-07-28", checkOut: "2026-07-31", checkInTime: "14:00",
          checkoutTime: "11:00", adults: 1, children: 0, pets: 0,
          status: "confirmed", idProof: "pending", villaRoom: "Willow Villa" },
        { id: "across", guestName: "Across The Turn", phone: "", platform: "airbnb",
          checkIn: "2026-07-30", checkOut: "2026-08-03", checkInTime: "14:00",
          checkoutTime: "11:00", adults: 1, children: 0, pets: 0,
          status: "confirmed", idProof: "pending", villaRoom: "Willow Villa" },
      ],
    });
    const bars = spill.$$("#monthGrid .booking-bar");
    // The July-only stay has nothing to show in August.
    assert(!bars.some((bar) => /Previous/.test(bar.textContent)), "a bar was drawn for another month");
    // The one crossing the turn starts at 1 August with a square end, so it reads
    // as continuing rather than beginning.
    // Only the crossing stay is left, as two row segments: the Saturday 1 August
    // sliver and the rest of the following week.
    assert(bars.length === 2, `${bars.length} bars`);
    assert(!bars.some((bar) => bar.classList.contains("opens")), "it claims to begin this month");
    assert(bars.filter((bar) => bar.classList.contains("closes")).length === 1, "wrong number of ends");
    const starts = bars.map((bar) => Number(bar.getAttribute("style").match(/grid-column:\s*(\d+)/)[1]));
    // 1 Aug 2026 is a Saturday: day index 6, so its first half column is 13. The
    // next segment picks up at the start of the following row.
    assert(starts.includes(13) && starts.includes(1), `starts at ${starts.join(", ")}`);
    spill.close();
    return `spacer days carry no bars; segments start at ${starts.join(" and ")}`;
  });

  await test("a turnover day lists the arriving guest before the leaving one", () => {
    // Ravi leaves on day(2); give someone an arrival the same day.
    const turnover = startApp({
      lang: "en",
      bookings: [
        { id: "out", guestName: "Leaving Guest", phone: "", platform: "airbnb",
          checkIn: day(0), checkOut: day(2), checkInTime: "14:00", checkoutTime: "11:00",
          adults: 2, children: 0, pets: 0, status: "confirmed", idProof: "pending",
          villaRoom: "Willow Villa" },
        { id: "in", guestName: "Arriving Guest", phone: "", platform: "direct",
          checkIn: day(2), checkOut: day(4), checkInTime: "14:00", checkoutTime: "11:00",
          adults: 2, children: 0, pets: 0, status: "confirmed", idProof: "pending",
          villaRoom: "Willow Villa" },
      ],
    });
    turnover.click(`#monthGrid [data-date="${day(2)}"]`);
    const names = turnover.$$("#selectedBookings .guest-name h3").map((n) => n.textContent);
    assert(names.length === 2, `${names.length} cards`);
    assert(names[0] === "Arriving Guest", `first card is ${names[0]}`);
    turnover.close();
    return names.join(" then ");
  });

  await test("no uncaught page errors", () => {
    assert(!app.errors.length, app.errors.map((e) => e.message).join(" | "));
  });

  const failures = test.report();
  app.close();
  return failures;
};

if (require.main === module) module.exports().then((f) => process.exit(f ? 1 : 0));
