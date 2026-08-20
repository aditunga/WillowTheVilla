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

// A stand-in for the Supabase client, so the shared-storage path can be exercised
// without a real project. Mirrors only the calls app.js actually makes.
function createSupabaseStub({
  publicRows = [],
  privateRows = [],
  earningsRows = [],
  failReads = false,
  missingTables = false,
  signInError = null,
} = {}) {
  const server = {
    publicRows: publicRows.map((row) => ({ ...row })),
    privateRows: privateRows.map((row) => ({ ...row })),
    earningsRows: earningsRows.map((row) => ({ ...row })),
    signedIn: false,
    ownerRole: "owner",
    upserts: [],
    deleted: [],
    reads: 0,
  };

  function table(name) {
    const builder = { table: name, mode: "select", filterIds: null, filterId: null };
    const settle = async () => {
      if (builder.mode === "select") {
        server.reads += 1;
        if (missingTables) {
          return {
            data: null,
            error: {
              code: "PGRST205",
              message: `Could not find the table 'public.${name}' in the schema cache`,
            },
          };
        }
        if (failReads) return { data: null, error: { message: "network down" } };
        if (name === "bookings") return { data: server.publicRows.map((row) => ({ ...row })), error: null };
        if (name === "monthly_earnings") {
          // Owner only, exactly as the policy enforces on the real table.
          if (!server.signedIn) return { data: null, error: { message: "permission denied" } };
          return { data: server.earningsRows.map((row) => ({ ...row })), error: null };
        }
        const rows = server.privateRows.filter(
          (row) => !builder.filterIds || builder.filterIds.includes(row.booking_id),
        );
        return { data: rows.map((row) => ({ ...row })), error: null };
      }
      if (builder.mode === "upsert") {
        if (!server.signedIn) return { error: { message: "row level security" } };
        const key = name === "bookings" ? "id" : "booking_id";
        const target = name === "bookings" ? server.publicRows : server.privateRows;
        builder.rows.forEach((row) => {
          server.upserts.push({ table: name, row });
          const index = target.findIndex((existing) => existing[key] === row[key]);
          if (index >= 0) target[index] = { ...row };
          else target.push({ ...row });
        });
        return { error: null };
      }
      if (!server.signedIn) return { error: { message: "row level security" } };
      server.deleted.push(builder.filterId);
      server.publicRows = server.publicRows.filter((row) => row.id !== builder.filterId);
      server.privateRows = server.privateRows.filter((row) => row.booking_id !== builder.filterId);
      return { error: null };
    };

    Object.assign(builder, {
      select() { return builder; },
      order() { return builder; },
      in(_column, values) { builder.filterIds = values; return builder; },
      eq(_column, value) { builder.filterId = value; return builder; },
      upsert(rows) { builder.mode = "upsert"; builder.rows = rows; return builder; },
      delete() { builder.mode = "delete"; return builder; },
      then(onFulfilled, onRejected) { return settle().then(onFulfilled, onRejected); },
    });
    return builder;
  }

  const client = {
    auth: {
      async signInWithPassword({ password }) {
        if (signInError) return { error: signInError };
        if (password !== TEST_PASSWORD) {
          return { error: { code: "invalid_credentials", message: "Invalid login credentials" } };
        }
        server.signedIn = true;
        return { error: null };
      },
      async getUser() {
        return {
          data: { user: { app_metadata: server.ownerRole ? { willow_role: server.ownerRole } : {} } },
          error: null,
        };
      },
      async signOut() {
        server.signedIn = false;
        return { error: null };
      },
    },
    from: table,
  };

  return { server, library: { createClient: () => client } };
}

function startApp({ bookings = [], lang = "en", supabase = null, session = null, visualViewport = null } = {}) {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const virtualConsole = new VirtualConsole();
  const errors = [];
  // jsdom cannot navigate and reports the attempt as an error, so treat that as the
  // page reload it stands for rather than a failure.
  const reloads = [];
  virtualConsole.on("jsdomError", (error) => {
    if (/Not implemented: navigation/.test(error.message)) reloads.push(error.message);
    else errors.push(error);
  });
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
  // Stands in for what survives a reload in the same tab.
  if (session) {
    Object.entries(session).forEach(([key, value]) => window.sessionStorage.setItem(key, value));
  }

  if (visualViewport) {
    Object.defineProperty(window, "visualViewport", { value: visualViewport, configurable: true });
  }

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

  // Always state the config a spec wants. Without this the specs would quietly
  // depend on whatever project the deployed supabase-config.js happens to name.
  let stub = null;
  if (supabase) {
    stub = createSupabaseStub(supabase);
    window.supabase = stub.library;
    window.WILLOW_SUPABASE_CONFIG = {
      url: "https://willow-test.supabase.co",
      anonKey: "test-anon-key",
      adminUsername: "Venu",
      adminEmail: "owner@example.com",
      ...(supabase.config || {}),
    };
  } else {
    window.WILLOW_SUPABASE_CONFIG = { url: "", anonKey: "", adminUsername: "Venu", adminEmail: "" };
  }
  window.eval(source);

  const query = (selector) => window.document.querySelector(selector);
  const queryAll = (selector) => [...window.document.querySelectorAll(selector)];

  const api = {
    window,
    errors,
    confirms,
    downloads,
    reloads,
    server: stub ? stub.server : null,
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
    // Signing in reloads the page in a real browser, and the fresh load reopens the
    // owner panel. jsdom cannot navigate, so open it here to stand in for that.
    loginAsOwner() {
      api.click("#adminButton");
      query("#adminUsername").value = "Venu";
      query("#adminPassword").value = TEST_PASSWORD;
      api.submit("#adminLoginForm");
      if (query("#adminPanelModal").hidden) api.click("#adminButton");
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

module.exports = {
  startApp,
  createSuite,
  assert,
  day,
  isoDate,
  TEST_PASSWORD,
  STORAGE_KEY,
  OWNER_SESSION_KEY: "willow-the-villa-owner-session",
  OWNER_PANEL_KEY: "willow-the-villa-open-owner-panel",
};
