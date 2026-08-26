import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const budgets = JSON.parse(
  readFileSync(new URL("../bundle-budgets.json", import.meta.url), "utf8"),
);
let failed = false;
for (const [file, budget] of Object.entries(budgets)) {
  const gzipBytes = gzipSync(
    readFileSync(new URL(`../${file}`, import.meta.url)),
  ).byteLength;
  const gzipKb = (gzipBytes / 1024).toFixed(2);
  const maxKb = (budget.maxGzipBytes / 1024).toFixed(2);
  console.log(`${file}: ${gzipKb} kB gzip (budget ${maxKb} kB)`);
  if (gzipBytes > budget.maxGzipBytes) failed = true;
}
if (failed) throw new Error("Bundle size budget exceeded");
