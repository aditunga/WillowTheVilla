// Confirms the Supabase project named in supabase-config.js is set up correctly.
// Uses only the publishable key, so it is safe to run anywhere.
//
//   npm run check:supabase
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "supabase-config.js"), "utf8");

const read = (key) => (source.match(new RegExp(`${key}:\\s*"([^"]*)"`)) || [])[1] || "";
const url = read("url");
const anonKey = read("anonKey");
const adminEmail = read("adminEmail");

const results = [];
const record = (ok, label, detail = "") => results.push({ ok, label, detail });

if (!url || !anonKey) {
  record(false, "supabase-config.js has a url and a key", "still blank — the site runs on device storage only");
} else {
  record(true, "supabase-config.js has a url and a key", url);

  if (/service_role|sb_secret_/.test(source)) {
    record(false, "no secret key in browser config", "a secret key is in supabase-config.js — roll it now");
  } else {
    record(true, "no secret key in browser config");
  }

  const headers = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };
  const call = async (path) => {
    try {
      const response = await fetch(`${url}/rest/v1/${path}`, { headers });
      let body = null;
      try {
        body = await response.json();
      } catch {
        body = null;
      }
      return { status: response.status, body };
    } catch (error) {
      return { status: 0, body: { message: error.message } };
    }
  };

  const bookings = await call("bookings?select=id,guest_name,check_in&limit=5");
  if (bookings.status === 0) {
    record(false, "project reachable", bookings.body.message);
  } else if (bookings.status === 401 || bookings.status === 403) {
    record(false, "publishable key accepted", `HTTP ${bookings.status} — key rejected`);
  } else if (bookings.status === 404) {
    record(true, "project reachable and key accepted", url);
    record(
      false,
      "bookings table exists",
      "run supabase/migrations/20260820000000_willow_bookings.sql in the SQL editor",
    );
  } else if (bookings.status === 200) {
    record(true, "project reachable and key accepted", url);
    record(true, "bookings table exists", `${bookings.body.length} row(s) readable without logging in`);
  } else {
    record(false, "bookings table exists", `HTTP ${bookings.status} ${JSON.stringify(bookings.body)}`);
  }

  if (bookings.status === 200) {
    const priv = await call("booking_private_details?select=booking_id&limit=1");
    const hidden = priv.status === 200 ? priv.body.length === 0 : true;
    record(
      hidden,
      "owner-only table is closed to visitors",
      hidden ? "row level security is doing its job" : "PRIVATE ROWS ARE PUBLIC — check the policies",
    );
  }
}

record(Boolean(adminEmail), "adminEmail is set", adminEmail || "owner sign-in stays blocked until this is filled in");

let failed = 0;
console.log("");
for (const { ok, label, detail } of results) {
  if (!ok) failed += 1;
  console.log(`  ${ok ? "OK  " : "TODO"}  ${label}${detail ? `  — ${detail}` : ""}`);
}
console.log(failed ? `\n  ${failed} step(s) still to do\n` : "\n  shared storage is ready\n");
process.exit(failed ? 1 : 0);
