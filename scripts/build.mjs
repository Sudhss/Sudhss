/* Build every profile image into dist/, in both themes.
 *
 *   node scripts/build.mjs            fetch live data, render
 *   node scripts/build.mjs --offline  render from the last data.json only
 *
 * The workflow publishes dist/ to the `output` branch; the README points at
 * raw.githubusercontent.com/Sudhss/Sudhss/output/<name>-<theme>.svg.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { fetchAll } from "./fetch.mjs";
import { THEMES } from "./svg/kit.mjs";
import { hero } from "./svg/hero.mjs";
import { scoreboard } from "./svg/scoreboard.mjs";
import { city } from "./svg/city.mjs";
import { card } from "./svg/cards.mjs";
import { now } from "./svg/now.mjs";
import { stack } from "./svg/stack.mjs";
import { button, BUTTONS } from "./svg/buttons.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const offline = process.argv.includes("--offline");

async function previousData(cfg) {
  try {
    return JSON.parse(await readFile(path.join(dist, "data.json"), "utf8"));
  } catch {}
  try {
    const res = await fetch(`https://raw.githubusercontent.com/${cfg.github}/${cfg.github}/output/data.json`, { signal: AbortSignal.timeout(15000) });
    if (res.ok) return await res.json();
  } catch {}
  // First run ever, or the output branch is gone: start from the committed seed.
  try {
    return JSON.parse(await readFile(path.join(root, "scripts", "seed.json"), "utf8"));
  } catch {}
  return {};
}

const cfg = JSON.parse(await readFile(path.join(root, "profile.config.json"), "utf8"));
const previous = await previousData(cfg);
const data = offline ? { ...previous, generatedAt: new Date().toISOString(), stale: ["all (offline)"] } : await fetchAll(cfg, previous);

const images = {
  hero: (t) => hero(cfg, data, t),
  scoreboard: (t) => scoreboard(data, t),
  city: (t) => (data.contributions ? city(data.contributions, t) : null),
  now: (t) => now(data.activity, data.generatedAt, t),
  stack: (t) => stack(cfg, t),
  ...Object.fromEntries(cfg.projects.map((p) => [`card-${p.id}`, (t) => card(p, t)])),
  ...Object.fromEntries(BUTTONS.map((k) => [`btn-${k}`, (t) => button(k, t)])),
};

await mkdir(dist, { recursive: true });
let count = 0;
for (const [name, render] of Object.entries(images)) {
  for (const t of Object.values(THEMES)) {
    try {
      const out = render(t);
      if (!out) continue;
      await writeFile(path.join(dist, `${name}-${t.name}.svg`), out);
      count += 1;
    } catch (error) {
      // One broken image must not take the whole profile down.
      console.error(`x ${name}-${t.name}: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
await writeFile(path.join(dist, "data.json"), JSON.stringify(data, null, 2));

// A local preview: the README as GitHub lays it out, pointed at dist/.
const readme = (await readFile(path.join(root, "README.md"), "utf8"))
  .replaceAll(`https://raw.githubusercontent.com/${cfg.github}/${cfg.github}/output/`, "")
  .replace(/^### (.*)$/gm, "<h3>$1</h3>");
await writeFile(path.join(dist, "preview.html"), `<!doctype html><meta charset="utf-8"><title>profile preview</title>
<style>
  body { margin: 0; font: 16px/1.5 -apple-system, "Segoe UI", sans-serif; background: #0d1117; color: #e6edf3; }
  body.light { background: #fff; color: #1f2328; }
  main { max-width: 896px; margin: 24px auto; padding: 24px; border: 1px solid #30363d; border-radius: 6px; }
  body.light main { border-color: #d0d7de; }
  a { color: #4493f8; } p { margin: 16px 0; } img { max-width: 100%; }
  button { position: fixed; top: 12px; right: 12px; font: inherit; padding: 6px 14px; border-radius: 6px; border: 1px solid #30363d; background: #21262d; color: #e6edf3; cursor: pointer; }
</style>
<button id="theme">light theme</button>
<main>${readme}</main>
<script>
  document.querySelectorAll("source").forEach((s) => s.remove());
  let theme = "dark";
  document.getElementById("theme").onclick = (e) => {
    theme = theme === "dark" ? "light" : "dark";
    document.body.classList.toggle("light", theme === "light");
    e.target.textContent = (theme === "dark" ? "light" : "dark") + " theme";
    document.querySelectorAll("img").forEach((i) => (i.src = i.getAttribute("src").replace(/-(dark|light)\\.svg$/, "-" + theme + ".svg")));
  };
</script>`);

console.log(`${count} images -> dist/${data.stale.length ? `  (stale: ${data.stale.join(", ")})` : ""}`);
