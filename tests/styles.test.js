// Guards the stylesheet rules a popup depends on. jsdom never loads styles.css, so
// these are read from the file rather than from a computed style.
const fs = require("fs");
const path = require("path");
const { createSuite, assert } = require("./harness");

// Comments can sit between declarations, so drop them before parsing.
const css = fs
  .readFileSync(path.join(__dirname, "..", "styles.css"), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "");

// Very small parser: selector -> declarations, in source order.
function rulesFor(property) {
  const found = [];
  const pattern = /([^{}]+)\{([^{}]*)\}/g;
  let match = pattern.exec(css);
  while (match) {
    const [, selector, body] = match;
    const declaration = new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`, "i").exec(body);
    if (declaration) found.push({ selector: selector.trim(), value: declaration[1].trim() });
    match = pattern.exec(css);
  }
  return found;
}

module.exports = async function run() {
  const test = createSuite("stylesheet");

  await test("nothing clips the scrolling popup panels", () => {
    // .entry-card and .import-card ARE the form and import panels. A later rule
    // setting overflow:hidden on them beats the panels' overflow:auto and puts
    // "More details" out of reach with no way to scroll to it.
    const offenders = rulesFor("overflow").filter(
      (rule) =>
        /\.(entry-card|import-card)\b/.test(rule.selector) &&
        !/summary|::/.test(rule.selector) &&
        /hidden/.test(rule.value),
    );
    assert(!offenders.length, offenders.map((r) => `${r.selector} { overflow: ${r.value} }`).join(" | "));
  });

  await test("the popup panels scroll their own content", () => {
    const panel = rulesFor("overflow").find((rule) => /\.form-modal-panel/.test(rule.selector));
    assert(panel, "no overflow rule on the form panel");
    assert(/auto|scroll/.test(panel.value), `form panel overflow is ${panel.value}`);
    return `${panel.selector.split(",")[0].trim()} { overflow: ${panel.value} }`;
  });

  await test("toasts sit above the popups", () => {
    const layers = rulesFor("z-index");
    const toast = layers.find((rule) => /^\.toast\b/.test(rule.selector));
    const modal = layers.find((rule) => /\.form-modal\b/.test(rule.selector));
    assert(toast && modal, "missing z-index rules");
    assert(
      Number(toast.value) > Number(modal.value),
      `toast ${toast.value} is not above modal ${modal.value}`,
    );
    return `toast ${toast.value} > modal ${modal.value}`;
  });

  await test("the bar overlay is laid out exactly like the day grid", () => {
    // Bars are positioned by grid line, so any difference in column count or gap
    // between the two grids slides every bar off its day.
    const columns = rulesFor("grid-template-columns");
    const grid = columns.find((rule) => /^\.month-grid\b/.test(rule.selector));
    const overlay = columns.find((rule) => /^\.booking-overlay\b/.test(rule.selector));
    assert(grid && overlay, "missing a grid-template-columns rule");
    assert(grid.value === overlay.value, `grid ${grid.value} vs overlay ${overlay.value}`);

    const gaps = rulesFor("column-gap");
    const gridGap = gaps.find((rule) => /^\.month-grid\b/.test(rule.selector));
    const overlayGap = gaps.find((rule) => /^\.booking-overlay\b/.test(rule.selector));
    assert(gridGap && overlayGap, "missing a column-gap rule");
    assert(gridGap.value === overlayGap.value, `grid ${gridGap.value} vs overlay ${overlayGap.value}`);

    const rowGaps = rulesFor("row-gap");
    const gridRow = rowGaps.find((rule) => /^\.month-grid\b/.test(rule.selector));
    const overlayRow = rowGaps.find((rule) => /^\.booking-overlay\b/.test(rule.selector));
    assert(gridRow.value === overlayRow.value, `grid ${gridRow.value} vs overlay ${overlayRow.value}`);
    return `${grid.value}, gap ${gridGap.value}/${gridRow.value}`;
  });

  await test("no shorthand gap quietly reinstates a column gap on the grid", () => {
    // A later `.month-grid { gap: 3px }` overrode column-gap:0 at equal specificity
    // and slid every bar off its day. The shorthand sets both axes.
    const shorthand = rulesFor("gap").filter((rule) => /\.month-grid\b/.test(rule.selector));
    assert(
      !shorthand.length,
      `shorthand gap on the grid: ${shorthand.map((r) => `${r.selector} { gap: ${r.value} }`).join(" | ")}`,
    );
    // The weekday header shares the day pitch, so it must not carry one either.
    const header = rulesFor("gap").filter(
      (rule) => /\.weekday-row\b/.test(rule.selector) && rule.value !== "0",
    );
    assert(!header.length, `weekday header gap: ${header.map((r) => r.value).join(", ")}`);
  });

  await test("the bar overlay paints above a selected day", () => {
    // .day-cell.selected is opaque white at z-index 4; without its own layer the
    // overlay loses to it and every bar crossing the selected day disappears.
    const layers = rulesFor("z-index");
    const overlay = layers.find((rule) => /^\.booking-overlay\b/.test(rule.selector));
    const selected = layers.find((rule) => /\.day-cell\.selected\b/.test(rule.selector));
    assert(overlay, "the overlay has no z-index of its own");
    assert(selected, "no z-index on the selected day");
    assert(
      Number(overlay.value) > Number(selected.value),
      `overlay ${overlay.value} is not above the selected day ${selected.value}`,
    );
    const modal = layers.find((rule) => /\.form-modal\b/.test(rule.selector));
    assert(Number(overlay.value) < Number(modal.value), "the overlay would cover the popups");
    return `selected ${selected.value} < overlay ${overlay.value} < modal ${modal.value}`;
  });

  await test("bar labels have enough contrast to read", () => {
    const luminance = (hex) => {
      const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
      const linear = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    };
    const ratio = (hex) => (1.05) / (luminance(hex) + 0.05);

    const tokens = {};
    const rootMatch = /:root\s*\{([\s\S]*?)\}/.exec(css);
    for (const [, name, value] of rootMatch[1].matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)) {
      tokens[name] = value;
    }
    // Every colour a booking bar can take, all carrying white label text.
    const surfaces = ["airbnb-ink", "booking", "makemytrip", "direct"];
    const failures = surfaces
      .map((name) => ({ name, value: tokens[name], contrast: ratio(tokens[name]) }))
      .filter((entry) => entry.contrast < 4.5);
    assert(
      !failures.length,
      failures.map((f) => `--${f.name} ${f.value} = ${f.contrast.toFixed(2)}:1`).join(" | "),
    );
    return surfaces
      .map((name) => `${name} ${ratio(tokens[name]).toFixed(2)}`)
      .join(", ");
  });

  await test("both grids take their row gap from the same place", () => {
    // A breakpoint changed row-gap on .month-grid only, so the overlay rows drifted
    // away from the day rows. Both must read one variable.
    const rowGaps = rulesFor("row-gap");
    const grid = rowGaps.find((rule) => /^\.month-grid\b/.test(rule.selector));
    const overlay = rowGaps.find((rule) => /^\.booking-overlay\b/.test(rule.selector));
    assert(grid.value === overlay.value, `grid ${grid.value} vs overlay ${overlay.value}`);
    assert(grid.value.includes("var("), `row-gap is hard coded: ${grid.value}`);

    const overrides = rowGaps.filter(
      (rule) => /\.(month-grid|booking-overlay)\b/.test(rule.selector) && !rule.value.includes("var("),
    );
    assert(!overrides.length, overrides.map((r) => `${r.selector} { row-gap: ${r.value} }`).join(" | "));
    return `both read ${grid.value}`;
  });

  await test("the weekday header does not take a day row's height", () => {
    // Sharing grid-auto-rows with .month-grid left a tall empty band under the
    // weekday labels.
    const autoRows = rulesFor("grid-auto-rows");
    const offender = autoRows.find((rule) => /\.weekday-row\b/.test(rule.selector));
    assert(!offender, `${offender && offender.selector} sets grid-auto-rows`);
  });

  await test("popups follow the visual viewport", () => {
    const heights = rulesFor("height").filter((rule) => /\.form-modal\b/.test(rule.selector));
    assert(
      heights.some((rule) => rule.value.includes("--viewport-height")),
      "modal height does not track the visual viewport",
    );
  });

  return test.report();
};

if (require.main === module) module.exports().then((f) => process.exit(f ? 1 : 0));
