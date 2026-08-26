import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "demo-dist");
const target = resolve(root, ".pages", "gitee");
if (!existsSync(source))
  throw new Error("demo-dist is missing; run pnpm build:demo first");
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });
writeFileSync(resolve(target, ".nojekyll"), "");
console.log(`Prepared the shared Pages artifact at ${target}`);
