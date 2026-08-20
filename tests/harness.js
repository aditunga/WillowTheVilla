// Boots index.html + app.js inside jsdom so the specs can drive the real UI.
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const STORAGE_KEY = "willow-the-villa-bookings-v1";
const LANGUAGE_KEY = "willow-the-villa-language";
const TEST_PASSWORD = "villa-test";

function credentialHash(value) {
  let hash = 5381;
  for (const char of value) hash = ((hash << 5) + hash) ^ char.charCodeAt(0);
  return hash >>> 0;
}

function isoDate(date) {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
  return copy.toISOString().slice(0, 10);
}

function startApp({ bookings = [], lang = "en" } = {}) {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const virtualConsole = new VirtualConsole();
  const errors = [];
  virtualConsole.on("jsdomError", (error) => errors.push(error));
  virtualConsole.on("warn", () => {});

  const dom = new JSDOM(html, {
    url: "https://example.com/",
    runScripts: "outside-only",
    pretendToBeVisual: true,
    virtualConsole,
  });
  const { window } = dom;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  window.localStorage.setItem(LANGUAGE_KEY, lang);

  const confirms = [];
  window.confirm = (message) => {
    confirms.push(message);
    return true;
  };
  // jsdom Blobs are opaque, so record what the app writes into them instead.
  const downloads = [];
  const NativeBlob = window.Blob;
  window.Blob = function RecordingBlob(parts = [], options) {
    downloads.push(parts.map(String).join(""));
    return new NativeBlob(parts, options);
  };
  window.URL.createObjectURL = () => "blob:test";
  window.URL.revokeObjectURL = () => {};
  window.HTMLAnchorElement.prototype.click = function noop() {};

  // The local fallback password only exists as a hash in the source, so swap in
  // a known one rather than shipping a test account.
  const source = fs
    .readFileSync(path.join(ROOT, "app.js"), "utf8")
    .replace(
      /const ADMIN_PASSWORD_HASH = \d+;/,
      `const ADMIN_PASSWORD_HASH = ${credentialHash(TEST_PASSWORD)};`,
    );
  window.eval(fs.readFileSync(path.join(ROOT, "supabase-config.js"), "utf8"));
  window.eval(source);

  const query = (selector) => window.document.querySelector(selector);
  const queryAll = (selector) => [...window.document.querySelectorAll(selector)];

  const api = {
    window,
    errors,
    confirms,
    downloads,
    $: query,
    $$: queryAll,
    click(target) {
      const element = typeof target === "string" ? query(target) : target;
      if (!element) throw new Error(`nothing to click: ${target}`);
      element.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
    },
    press(target, key) {
      const element = typeof target === "string" ? query(target) : target;
      (element || window.document).dispatchEvent(
        new window.KeyboardEvent("keydown", { key, bubbles: true }),
      );
    },
    fill(id, value) {
      const element = window.document.getElementById(id);
      if (!element) throw new Error(`no field ${id}`);
      element.value = value;
      element.dispatchEvent(new window.Event("input", { bubbles: true }));
    },
    submit(selector) {
      query(selector).dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
    },
    attachFile(name, text, type = "") {
      Object.defineProperty(query("#importFile"), "files", {
        value: [
          {
            name,
            type,
            text: async () => text,
            arrayBuffer: async () => new TextEncoder().encode(text).buffer,
          },
        ],
        configurable: true,
      });
    },
    // Stands in for SheetJS. Pass rows of raw cell values (strings, numbers, Dates),
    // or null to make reading fail the way an offline phone would.
    stubExcel(rows) {
      if (rows === null) {
        window.XLSX = {
          read() {
            throw new Error("xlsx unavailable");
          },
          utils: { sheet_to_json: () => [] },
        };
        return;
      }
      window.XLSX = {
        read: () => ({ SheetNames: ["Sheet1"], Sheets: { Sheet1: rows } }),
        utils: { sheet_to_json: (sheet) => sheet.map((row) => [...row]) },
      };
    },
    // Stands in for the pdf.js module the app pulls from the CDN. Pass an array of
    // page strings, or null to make loading fail the way an offline phone would.
    stubPdf(pages) {
      if (pages === null) {
        window.pdfjsLib = {
          GlobalWorkerOptions: {},
          getDocument() {
            return { promise: Promise.reject(new Error("pdf.js unavailable")) };
          },
        };
        return;
      }
      window.pdfjsLib = {
        GlobalWorkerOptions: {},
        getDocument: () => ({
          promise: Promise.resolve({
            numPages: pages.length,
            getPage: async (pageNumber) => ({
              getTextContent: async () => ({
                items: pages[pageNumber - 1]
                  .split("\n")
                  .map((line) => ({ str: line, hasEOL: true })),
              }),
            }),
          }),
        }),
      };
    },
    stored() {
      return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    },
    settle() {
      return new Promise((resolve) => setTimeout(resolve, 0));
    },
    loginAsOwner() {
      api.click("#adminButton");
      query("#adminUsername").value = "Venu";
      query("#adminPassword").value = TEST_PASSWORD;
      api.submit("#adminLoginForm");
    },
    close() {
      dom.window.close();
    },
  };
  return api;
}

function createSuite(title) {
  const results = [];
  const run = async (name, body) => {
    try {
      results.push([true, name, (await body()) ?? ""]);
    } catch (error) {
      results.push([false, name, error.message]);
    }
  };
  run.report = () => {
    console.log(`\n${title}`);
    let failures = 0;
    for (const [ok, name, detail] of results) {
      if (!ok) failures += 1;
      console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
    }
    return failures;
  };
  return run;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const day = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return isoDate(date);
};

module.exports = { startApp, createSuite, assert, day, isoDate, TEST_PASSWORD };
