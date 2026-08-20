// The migration files are pasted into the SQL editor by hand, so a stray
// statement terminator is not caught by anything else until it fails there.
const fs = require("fs");
const path = require("path");
const { createSuite, assert } = require("./harness");

const dir = path.join(__dirname, "..", "supabase", "migrations");
const files = fs.readdirSync(dir).filter((name) => name.endsWith(".sql"));

// Strip comments and dollar-quoted function bodies, which contain their own
// semicolons, then split into statements.
function statementsIn(sql) {
  const withoutComments = sql.replace(/^\s*--.*$/gm, "");
  const withoutBodies = withoutComments.replace(/\$\$[\s\S]*?\$\$/g, "$$BODY$$");
  return withoutBodies
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

module.exports = async function run() {
  const test = createSuite("migrations");

  assert(files.length, "no migration files found");

  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    const statements = statementsIn(sql);

    await test(`${file} has no orphaned clauses`, () => {
      // "on conflict", "set", "with check" and friends belong to the statement
      // before them. Finding one at the start of a statement means a semicolon
      // landed too early.
      const orphans = statements.filter((statement) =>
        /^(on conflict|set |with check|using |returning|values)\b/i.test(statement),
      );
      assert(
        !orphans.length,
        orphans.map((statement) => `${statement.slice(0, 48)}...`).join(" | "),
      );
      return `${statements.length} statements`;
    });

    await test(`${file} has balanced brackets and quotes`, () => {
      const code = sql.replace(/^\s*--.*$/gm, "");
      const depth = [...code].reduce((total, ch) => total + (ch === "(") - (ch === ")"), 0);
      assert(depth === 0, `parentheses off by ${depth}`);
      const quotes = (code.match(/'/g) || []).length;
      assert(quotes % 2 === 0, `${quotes} single quotes, expected an even number`);
    });

    await test(`${file} can be re-run`, () => {
      // Everything must be idempotent: these get pasted more than once.
      const creates = statements.filter((s) => /^create (table|policy|trigger|extension)/i.test(s));
      const unsafe = creates.filter(
        (s) => !/if not exists/i.test(s) && !/^create policy/i.test(s) && !/^create trigger/i.test(s),
      );
      assert(!unsafe.length, unsafe.map((s) => s.slice(0, 44)).join(" | "));

      const policies = statements.filter((s) => /^create policy/i.test(s));
      policies.forEach((policy) => {
        const name = /"([^"]+)"/.exec(policy);
        assert(name, `unnamed policy: ${policy.slice(0, 40)}`);
        assert(
          statements.some((s) => /^drop policy if exists/i.test(s) && s.includes(name[1])),
          `policy ${name[1]} has no matching drop`,
        );
      });
      return `${creates.length} creates, ${policies.length} policies, all safe to re-run`;
    });
  }

  return test.report();
};

if (require.main === module) module.exports().then((f) => process.exit(f ? 1 : 0));
