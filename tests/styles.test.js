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
