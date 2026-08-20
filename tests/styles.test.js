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
