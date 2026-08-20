// Runs every spec in-process so `npm test` stays a single command.
const specs = ["./caretaker.test.js", "./owner.test.js", "./import.test.js"];

(async () => {
  let failures = 0;
  for (const spec of specs) {
    failures += await require(spec)();
  }
  console.log(failures ? `\n${failures} failing` : "\nall green");
  process.exit(failures ? 1 : 0);
})();
