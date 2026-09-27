/* The scoreboard: three live panels.
 *
 *   Codeforces  the real rating history, drawn over the rank bands it moved
 *               through (the chart every CF profile has, redrawn here)
 *   LeetCode    contest rating, badge, percentile, and a ring of solved
 *               problems split easy / medium / hard
 *   CodeChef    stars lighting up one by one, rating and peak
 */

import { svg, text, drawIn, fadeIn, title, SANS, MONO, f } from "./kit.mjs";

// Codeforces rank bands and their colours, lightened for the dark theme.
const CF_BANDS = [
  { from: 0, to: 1200, name: "Newbie", dark: "#5c6370", light: "#b8bec7" },
  { from: 1200, to: 1400, name: "Pupil", dark: "#3f9e58", light: "#a6dfb3" },
  { from: 1400, to: 1600, name: "Specialist", dark: "#2fa7a0", light: "#a3e0da" },
  { from: 1600, to: 1900, name: "Expert", dark: "#4a6ee0", light: "#b6c6fb" },
  { from: 1900, to: 2100, name: "Candidate Master", dark: "#a55fd8", light: "#e0c4f6" },
  { from: 2100, to: 2400, name: "Master", dark: "#e39a3c", light: "#f7d8ae" },
];
const CF_RANK_TEXT = { dark: "#7d9bff", light: "#1a3fe0" };

function panel(x, y, w, h, t, title, handle, accent, begin) {
  return `<g opacity="0">${fadeIn(begin, 0.5)}
<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${t.panel2}" stroke="${t.border}"/>
<rect x="${x}" y="${y + 18}" width="3" height="22" rx="1.5" fill="${accent}"/>
${text(x + 20, y + 35, title, { size: 15, fill: t.text, weight: 700 })}
${text(x + w - 18, y + 35, handle, { size: 12.5, fill: t.text3, font: MONO, anchor: "end" })}
</g>`;
}

function codeforcesPanel(cf, t, x, y, w, h) {
  let b = panel(x, y, w, h, t, "Codeforces", cf.handle, "#1f8acb", 0.1);
  const rankColor = CF_RANK_TEXT[t.name];
  b += `<g opacity="0">${fadeIn(0.4)}
${text(x + 20, y + 86, String(cf.rating), { size: 40, fill: t.text, weight: 800, extra: 'letter-spacing="-1"' })}
${text(x + 20, y + 110, title(cf.rank), { size: 14, fill: rankColor, weight: 700 })}
${text(x + w - 18, y + 78, `Peak ${cf.maxRating}`, { size: 12.5, fill: t.text2, font: MONO, anchor: "end" })}
${text(x + w - 18, y + 96, `${cf.history.length} Rated Contests`, { size: 12.5, fill: t.text2, font: MONO, anchor: "end" })}
</g>`;
  // Chart.
  const cx = x + 20;
  const cy = y + 130;
  const cw = w - 40;
  const ch = h - 160;
  const rs = cf.history.map((p) => p.r);
  const lo = Math.max(0, Math.floor((Math.min(...rs, 1200) - 100) / 100) * 100);
  const hi = Math.ceil((Math.max(...rs) + 150) / 100) * 100;
  const yOf = (r) => cy + ch - ((r - lo) / (hi - lo)) * ch;
  CF_BANDS.forEach((band) => {
    const a = Math.max(lo, band.from);
    const z = Math.min(hi, band.to);
    if (z <= a) return;
    b += `<rect x="${cx}" y="${f(yOf(z))}" width="${cw}" height="${f(yOf(a) - yOf(z))}" fill="${band[t.name]}" opacity="${t.name === "dark" ? 0.18 : 0.45}"/>`;
    b += text(cx + cw - 6, yOf(z) + 13, band.name, { size: 10, fill: t.text3, font: MONO, anchor: "end" });
  });
  const n = cf.history.length;
  const pts = cf.history.map((p, i) => [cx + 8 + (n === 1 ? cw / 2 : (i / (n - 1)) * (cw - 16)), yOf(p.r)]);
  let len = 0;
  for (let i = 1; i < pts.length; i += 1) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${f(p[0])} ${f(p[1])}`).join(" ");
  b += drawIn(d, len, { stroke: t.text, width: 2.4, begin: 0.7, dur: 1.6 });
  pts.forEach((p, i) => {
    const last = i === pts.length - 1;
    b += `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${last ? 5 : 3.2}" fill="${last ? rankColor : t.panel2}" stroke="${t.text}" stroke-width="1.8" opacity="0">${fadeIn(0.7 + (1.6 * (i + 1)) / n, 0.2)}</circle>`;
  });
  return b;
}

function arc(cx, cy, r, from, to) {
  const a0 = (from - 0.25) * Math.PI * 2;
  const a1 = (to - 0.25) * Math.PI * 2;
  const large = to - from > 0.5 ? 1 : 0;
  return `M${f(cx + r * Math.cos(a0))} ${f(cy + r * Math.sin(a0))} A${r} ${r} 0 ${large} 1 ${f(cx + r * Math.cos(a1))} ${f(cy + r * Math.sin(a1))}`;
}

function leetcodePanel(lc, t, x, y, w, h) {
  let b = panel(x, y, w, h, t, "LeetCode", lc.handle, "#ffa116", 0.25);
  b += `<g opacity="0">${fadeIn(0.55)}
${text(x + 20, y + 86, String(lc.rating), { size: 40, fill: t.text, weight: 800, extra: 'letter-spacing="-1"' })}
${text(x + 20, y + 110, `${lc.badge || ""} · Top ${lc.topPercent}%`, { size: 14, fill: "#ffa116", weight: 700 })}
${text(x + 20, y + 140, `${lc.contests} Contests · Global #${lc.globalRank.toLocaleString("en-US")}`, { size: 12.5, fill: t.text2, font: MONO })}
</g>`;
  // Solved ring.
  const total = lc.solved.all;
  const parts = [
    ["Easy", lc.solved.easy, t.name === "dark" ? "#00b8a3" : "#00897b"],
    ["Medium", lc.solved.medium, "#ffb800"],
    ["Hard", lc.solved.hard, t.name === "dark" ? "#ff375f" : "#e0284b"],
  ];
  const rcx = x + w / 2;
  const rcy = y + h - 92;
  const R = 58;
  b += `<circle cx="${rcx}" cy="${rcy}" r="${R}" fill="none" stroke="${t.grid}" stroke-width="12"/>`;
  let at = 0;
  const gap = 0.012;
  parts.forEach(([name, n, color], i) => {
    const span = n / total;
    const d = arc(rcx, rcy, R, at + gap / 2, at + span - gap / 2);
    const len = 2 * Math.PI * R * (span - gap);
    b += drawIn(d, len, { stroke: color, width: 12, begin: 0.9 + i * 0.45, dur: 0.7, cap: "butt" });
    at += span;
  });
  b += `<g opacity="0">${fadeIn(1.2)}
${text(rcx, rcy + 4, String(total), { size: 26, fill: t.text, weight: 800, anchor: "middle" })}
${text(rcx, rcy + 22, "Solved", { size: 11.5, fill: t.text3, font: MONO, anchor: "middle" })}
</g>`;
  parts.forEach(([name, n, color], i) => {
    const lx = x + 20 + i * ((w - 40) / 3);
    b += `<g opacity="0">${fadeIn(1.3 + i * 0.2)}<circle cx="${f(lx + 5)}" cy="${y + h - 16}" r="4" fill="${color}"/>${text(lx + 14, y + h - 12, `${name} ${n}`, { size: 12, fill: t.text2, font: MONO })}</g>`;
  });
  return b;
}

function star(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 10; i += 1) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(`${f(cx + rr * Math.cos(a))},${f(cy + rr * Math.sin(a))}`);
  }
  return pts.join(" ");
}

function codechefPanel(cc, t, x, y, w, h) {
  let b = panel(x, y, w, h, t, "CodeChef", cc.handle, "#e0b050", 0.4);
  b += `<g opacity="0">${fadeIn(0.7)}
${text(x + 20, y + 86, String(cc.rating), { size: 40, fill: t.text, weight: 800, extra: 'letter-spacing="-1"' })}
${text(x + 20, y + 110, `${cc.stars} Star`, { size: 14, fill: t.name === "dark" ? "#f2c14e" : "#a86b00", weight: 700 })}
${text(x + w - 18, y + 78, `Peak ${cc.maxRating}`, { size: 12.5, fill: t.text2, font: MONO, anchor: "end" })}
${text(x + w - 18, y + 96, `${cc.contests} Contests`, { size: 12.5, fill: t.text2, font: MONO, anchor: "end" })}
</g>`;
  const gold = t.name === "dark" ? "#f2c14e" : "#d49b1c";
  // CodeChef's scale runs to seven stars; all seven slots are drawn.
  for (let i = 0; i < 7; i += 1) {
    const on = i < cc.stars;
    const cxs = x + w / 2 + (i - 3) * 46;
    b += `<polygon points="${star(cxs, y + 178, 17)}" fill="${t.name === "dark" ? t.grid : t.border}"/>`;
    if (on) {
      b += `<polygon points="${star(cxs, y + 178, 17)}" fill="${gold}" opacity="0"><animate attributeName="opacity" from="0" to="1" begin="${f(1.0 + i * 0.22, 2)}s" dur="0.3s" fill="freeze"/>
<animateTransform attributeName="transform" type="scale" values="0.6;1.12;1" additive="sum" begin="${f(1.0 + i * 0.22, 2)}s" dur="0.45s" fill="freeze"/></polygon>`;
    }
  }
  b += `<g opacity="0">${fadeIn(2.3)}
${text(x + w / 2, y + 232, `${cc.solved} Problems Solved`, { size: 12.5, fill: t.text2, font: MONO, anchor: "middle" })}
</g>`;
  return b;
}

export function scoreboard(data, t) {
  const W = 1200;
  const H = 340;
  const w = 372;
  const h = 300;
  let b = "";
  if (data.codeforces) b += codeforcesPanel(data.codeforces, t, 20, 20, w, h);
  if (data.leetcode) b += leetcodePanel(data.leetcode, t, 20 + w + 22, 20, w, h);
  if (data.codechef) b += codechefPanel(data.codechef, t, 20 + 2 * (w + 22), 20, w, h);
  const title = [
    data.codeforces && `Codeforces ${data.codeforces.rating} ${data.codeforces.rank}`,
    data.leetcode && `LeetCode ${data.leetcode.rating} ${data.leetcode.badge}, top ${data.leetcode.topPercent}%, ${data.leetcode.solved.all} solved`,
    data.codechef && `CodeChef ${data.codechef.rating}, ${data.codechef.stars} star`,
  ].filter(Boolean).join(" · ");
  return svg(W, H, title, b, t, { bg: false });
}

export { SANS };
