import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artifact = resolve(root, ".pages", "gitee");
const remote = process.env.GITEE_PAGES_REMOTE;
if (!remote)
  throw new Error(
    "Set GITEE_PAGES_REMOTE to the writable Gitee repository URL",
  );
if (!existsSync(resolve(artifact, "index.html")))
  throw new Error("Run pnpm pages:gitee:prepare first");

const run = (...args) => {
  const result = spawnSync("git", args, {
    cwd: artifact,
    stdio: "inherit",
    shell: false,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

run("init");
run("add", "--all");
run(
  "-c",
  "user.name=cluoub-pages",
  "-c",
  "user.email=pages@cluoub.local",
  "commit",
  "--allow-empty",
  "-m",
  "Deploy demo",
);
run("push", "--force", remote, "HEAD:gh-pages");
