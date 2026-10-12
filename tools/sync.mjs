#!/usr/bin/env node
// Vendor the pstack-claude generated plugin tree into this ZCode port, apply
// the port's token substitutions, and overlay the port-owned files. This is
// the port's equivalent of upstream's tools/sync.mjs: rerun it to pick up a
// newer pstack-claude release, then review the diff.
//
// Usage: node tools/sync.mjs --src /path/to/pstack-claude [--keep]
//
// --src  a checkout of michael-denyer/pstack-claude (default /tmp/pstack-claude)
// --keep do not delete an existing plugins/pstack first (not recommended)
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const repoRoot = join(import.meta.dirname, "..");
const args = process.argv.slice(2);
const srcFlag = args.indexOf("--src");
const src = srcFlag >= 0 ? args[srcFlag + 1] : "/tmp/pstack-claude";
const sourcePlugin = join(src, "plugins", "pstack");
if (!existsSync(join(sourcePlugin, "skills"))) {
  console.error(`sync: ${sourcePlugin} has no skills/ — pass --src pointing at a pstack-claude checkout`);
  process.exit(1);
}
const version = readFileSync(join(src, "VERSION"), "utf8").trim();
// Port releases append a suffix so each port change is a new plugin version
// (marketplace update detection keys on it, and a fresh version guarantees a
// fresh agent-registry scan rather than any per-version caching).
const fullVersion = `${version}-${readFileSync(join(repoRoot, "port", "RELEASE"), "utf8").trim()}`;
const sourceCommit = execGitShort(src);
const target = join(repoRoot, "plugins", "pstack");

// 1. Vendor the runtime-neutral tree. Runtime-specific trees stay behind:
// pi/, .github/ (Copilot), .claude-plugin/, .codex-plugin/ — ZCode reads the
// port's own .zcode-plugin manifest. Hook scripts are shared across runtimes
// (session-start.sh takes the runtime name); codex/copilot hook *wiring*
// files are dropped because the ZCode wiring is port-owned.
if (!args.includes("--keep") && existsSync(target)) rmSync(target, { recursive: true });
mkdirSync(target, { recursive: true });
for (const entry of ["skills", "agents", "effort-agents", "hooks", "assets", "models.json"]) {
  cpSync(join(sourcePlugin, entry), join(target, entry), { recursive: true });
}
// Hook *scripts* are shared across runtimes (session-start.sh takes the
// runtime name), but hook *wiring* files are runtime-specific — hooks.json
// wires the Claude branch and would be picked up by ZCode's hooks/hooks.json
// file convention even though the manifest names zcode-hooks.json.
for (const hooksFile of ["codex-hooks.json", "copilot-hooks.json", "hooks.json"]) {
  rmSync(join(target, "hooks", hooksFile), { force: true });
}
for (const rootFile of ["LICENSE", "LICENSE-cursor-team-kit", "NOTICE.md", "NOTICE-skills.md"]) {
  cpSync(join(src, rootFile), join(repoRoot, rootFile));
}
cpSync(join(src, "LICENSE"), join(repoRoot, "LICENSE-pstack-claude"));
const noticeZcode = readFileSync(join(repoRoot, "port", "NOTICE-zcode.md"), "utf8");
if (!readFileSync(join(repoRoot, "NOTICE.md"), "utf8").includes("ZCode port layer")) {
  writeFileSync(join(repoRoot, "NOTICE.md"), readFileSync(join(repoRoot, "NOTICE.md"), "utf8") + noticeZcode);
}

// 2. Apply the port's substitutions over every vendored text file.
const { substitutions } = JSON.parse(readFileSync(join(repoRoot, "tools", "substitutions.json"), "utf8"));
const applied = new Map(substitutions.map((s) => [JSON.stringify(s), 0]));
const textExtensions = new Set([".md", ".sh", ".ps1", ".awk", ".json", ".ts", ".mjs"]);
(function walk(dir) {
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) { walk(path); continue; }
    if (!textExtensions.has(extOf(name))) continue;
    const rel = relativePath(target, path);
    let text = readFileSync(path, "utf8");
    for (const sub of substitutions) {
      if (sub.files && !new RegExp(sub.files).test(rel)) continue;
      if (!text.includes(sub.pattern)) continue;
      text = text.split(sub.pattern).join(sub.replacement);
      applied.set(JSON.stringify(sub), applied.get(JSON.stringify(sub)) + 1);
    }
    writeFileSync(path, text);
  }
})(target);
const missing = substitutions.filter((s) => applied.get(JSON.stringify(s)) === 0);
if (missing.length) {
  console.error(`sync: substitutions that matched nothing (upstream wording moved?):`);
  for (const s of missing) console.error(`  - ${s.pattern.slice(0, 90)}…`);
  process.exit(1);
}

// 3. Overlay port-owned files, stamping the vendored version where marked.
// First, register the effort agents: ZCode only turns `agents/*.md` into
// dispatchable agent types (the manifest's agents list is not executed), so
// the ten `effort-agents/*.md` files are copied beside the two native ones —
// with the Claude Code-only `effort:` frontmatter key stripped, which ZCode's
// agent parser rejects (verified: 12 files with it → 2 registered). The body
// still states the effort level, and zcode-tools.md maps levels to the
// model's `$<level>` reasoning suffix. Upstream references agents by type
// NAME, not path, and `effort-agents/` stays vendored for clean diffs.
for (const name of readdirSync(join(target, "effort-agents")).sort()) {
  if (!name.endsWith(".md")) continue;
  const text = readFileSync(join(target, "effort-agents", name), "utf8");
  const stripped = text.replace(/^effort:.*\n/m, "");
  writeFileSync(join(target, "agents", name), stripped);
}
(function overlay(dir) {
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) { overlay(path); continue; }
    const rel = relativePath(join(repoRoot, "port"), path);
    const dest = join(target, rel);
    mkdirSync(join(dest, ".."), { recursive: true });
    writeFileSync(dest, readFileSync(path, "utf8").replaceAll("__PSTACK_VERSION__", fullVersion));
  }
})(join(repoRoot, "port"));

// 4. Stamp marketplace entries with the vendored version.
for (const marketplacePath of [join(repoRoot, "marketplace.json"), join(repoRoot, ".claude-plugin", "marketplace.json")]) {
  const marketplace = JSON.parse(readFileSync(marketplacePath, "utf8"));
  for (const plugin of marketplace.plugins) if (plugin.name === "pstack") plugin.version = fullVersion;
  writeFileSync(marketplacePath, `${JSON.stringify(marketplace, null, 2)}\n`);
}

const skills = readdirSync(join(target, "skills")).filter((n) => statSync(join(target, "skills", n)).isDirectory()).length;
console.log(`sync: vendored pstack ${fullVersion} (pstack-claude @ ${sourceCommit}), ${skills} skills, substitutions applied`);

function extOf(name) { const dot = name.lastIndexOf("."); return dot < 0 ? "" : name.slice(dot); }
function relativePath(from, to) { return to.slice(from.length + 1); }
function execGitShort(cwd) {
  try { return execSync("git rev-parse --short HEAD", { cwd }).toString().trim(); }
  catch { return "unknown"; }
}
