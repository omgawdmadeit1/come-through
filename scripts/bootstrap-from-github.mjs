/**
 * Vercel install helper: pull latest app source from the public GitHub repo
 * so production stays in sync with main without shipping huge deploy payloads.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const REPO = process.env.COME_THROUGH_REPO || "https://github.com/omgawdmadeit1/come-through.git";
const REF = process.env.COME_THROUGH_REF || "main";
const root = process.cwd();

function run(cmd) {
  console.log("[bootstrap]", cmd);
  execSync(cmd, { stdio: "inherit", cwd: root, env: process.env });
}

const marker = path.join(root, "src/routes/index.tsx");
if (fs.existsSync(marker) && fs.existsSync(path.join(root, "vite.config.ts"))) {
  console.log("[bootstrap] source already present — skip clone");
  process.exit(0);
}

const tmp = path.join(root, ".bootstrap-src");
fs.rmSync(tmp, { recursive: true, force: true });
run(`git clone --depth 1 --branch ${REF} ${REPO} ${tmp}`);

// copy essential trees
for (const rel of [
  "src",
  "public",
  "scripts",
  "migrations",
  "ios",
  "ios-assets",
  "native-shell",
  "appstore",
  "vite.config.ts",
  "tsconfig.json",
  "capacitor.config.ts",
  "vercel.json",
  "eslint.config.mjs",
  "package.json",
  "package-lock.json",
  "APP_STORE.md",
  "README.md",
]) {
  const from = path.join(tmp, rel);
  const to = path.join(root, rel);
  if (!fs.existsSync(from)) continue;
  fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, { recursive: true });
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log("[bootstrap] source synced from", REPO, REF);
