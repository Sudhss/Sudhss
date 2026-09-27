/* The header: a circuit board.
 *
 * Left, the name is etched in copper traces, drawn in trace by trace, then a
 * wave of current keeps running through the letters. Beside it, one grade
 * across every platform (scripts/score.mjs), and a row of live numbers.
 * Right, one processor wired out to everything built from scratch, with
 * signal pulses running along each trace. */

import { svg, text, drawIn, fadeIn, pathOf, polyLength, title, SANS, MONO, f, esc } from "./kit.mjs";
import { devScore } from "../score.mjs";

const CHIPS = [
  { id: "chromium", label: "Browser Engine", sub: "Mini Chromium", x: 640, y: 64 },
  { id: "minisql", label: "SQL Database", sub: "Mini SQL RDB", x: 990, y: 64 },
  { id: "valence", label: "Code Editor", sub: "Valence", x: 1000, y: 206 },
  { id: "railflow", label: "Traffic Control", sub: "RailFlow", x: 990, y: 346 },
  { id: "axios", label: "SRE Agents", sub: "Axios-Sovereign", x: 640, y: 346 },
];
const CW = 150;
const CH = 44;

// The traces start under the processor (see X0/Y0 below).
const TRACES = {
  chromium: [[770, 195], [715, 195], [715, 64 + CH]],
  minisql: [[890, 170], [890, 140], [1065, 140], [1065, 64 + CH]],
  valence: [[930, 228], [1000, 228]],
  railflow: [[890, 270], [890, 310], [1065, 310], [1065, 346]],
  axios: [[770, 245], [715, 245], [715, 346]],
};
const STUBS = [
  [[810, 170], [810, 150], [760, 150]],
  [[850, 170], [850, 120], [940, 120]],
  [[930, 190], [965, 190], [965, 160]],
  [[930, 255], [960, 255], [960, 290]],
  [[830, 270], [830, 300], [780, 300]],
  [[770, 220], [690, 220], [690, 250]],
];

/* A trace font: each letter on a 4 x 6 grid, strokes at 0/45/90 degrees
 * where it can, like a board router would lay them. */
const GLYPHS = {
  S: [[[4, 1], [3, 0], [1, 0], [0, 1], [0, 2], [1, 3], [3, 3], [4, 4], [4, 5], [3, 6], [1, 6], [0, 5]]],
  U: [[[0, 0], [0, 5], [1, 6], [3, 6], [4, 5], [4, 0]]],
  D: [[[0, 0], [0, 6], [2.5, 6], [4, 4.5], [4, 1.5], [2.5, 0], [0, 0]]],
  H: [[[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3], [4, 3]]],
  A: [[[0, 6], [0, 1.5], [1.5, 0], [2.5, 0], [4, 1.5], [4, 6]], [[0, 3.5], [4, 3.5]]],
  N: [[[0, 6], [0, 0], [4, 6], [4, 0]]],
  K: [[[0, 0], [0, 6]], [[4, 0], [1, 3], [0, 3]], [[1, 3], [4, 6]]],
  L: [[[0, 0], [0, 6], [4, 6]]],
};

/** Does point p sit on some stroke of the glyph (other than as its own end)? */
function onStroke(p, strokes, self) {
  return strokes.some((s, si) =>
    s.some((a, i) => {
      if (i === 0) return false;
      const b = s[i - 1];
      if (si === self && ((i === 1 && p === s[0]) || (i === s.length - 1 && p === s[s.length - 1]))) return false;
      const cross = (p[0] - b[0]) * (a[1] - b[1]) - (p[1] - b[1]) * (a[0] - b[0]);
      const within = Math.min(a[0], b[0]) - 1e-6 <= p[0] && p[0] <= Math.max(a[0], b[0]) + 1e-6 && Math.min(a[1], b[1]) - 1e-6 <= p[1] && p[1] <= Math.max(a[1], b[1]) + 1e-6;
      return Math.abs(cross) < 1e-6 && within;
    })
  );
}

/** Etch a word; returns its SVG and the time its last stroke starts. */
function etch(word, x0, y0, u, t, begin, wave) {
  let b = "";
  let pads = "";
  let current = "";
  let at = begin;
  [...word].forEach((ch, gi) => {
    const strokes = GLYPHS[ch];
    const gx = x0 + gi * u * 5.6;
    strokes.forEach((s, si) => {
      const P = s.map(([x, y]) => [gx + x * u, y0 + y * u]);
      const d = pathOf(P);
      const len = polyLength(P);
      const closed = s[0][0] === s[s.length - 1][0] && s[0][1] === s[s.length - 1][1];
      b += drawIn(d, len, { stroke: t.copper, width: 3.4, begin: f(at, 2), dur: 0.45 });
      if (!closed) {
        for (const e of [s[0], s[s.length - 1]]) {
          if (onStroke(e, strokes, si)) continue;
          pads += `<circle cx="${f(gx + e[0] * u)}" cy="${f(y0 + e[1] * u)}" r="4.2" fill="${t.panel}" stroke="${t.copper}" stroke-width="2.4" opacity="0">${fadeIn(f(at + 0.35, 2), 0.2)}</circle>`;
        }
      }
      // Current: one bright dash running the length of the stroke, every few seconds.
      const dash = Math.min(26, len * 0.45);
      const wb = f(wave + gi * 0.11 + si * 0.05, 2);
      current += `<path d="${d}" fill="none" stroke="${t.signal}" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="${f(dash)} ${f(len + dash)}" stroke-dashoffset="${f(dash)}"><animate attributeName="stroke-dashoffset" values="${f(dash)};${f(-len)};${f(-len)}" keyTimes="0;0.3;1" dur="3.6s" begin="${wb}s" repeatCount="indefinite"/></path>`;
      at += 0.07;
    });
    at += 0.04;
  });
  return { svg: b + `<g filter="url(#glow)">${current}</g>${current}` + pads, end: at };
}

/** A number that rolls up from zero: one <text> per frame, shown in turn. */
function rollUp(x, y, value, fmt, opts, begin, dur = 1.4, frames = 24) {
  let out = "";
  for (let i = 1; i <= frames; i += 1) {
    const k = 1 - Math.pow(1 - i / frames, 3);
    const on = f(begin + (dur * (i - 1)) / frames, 3);
    const off = f(begin + (dur * i) / frames, 3);
    out += `<g visibility="hidden"><set attributeName="visibility" to="visible" begin="${on}s"/>${i < frames ? `<set attributeName="visibility" to="hidden" begin="${off}s"/>` : ""}${text(x, y, fmt(Math.round(value * k)), opts)}</g>`;
  }
  return out;
}

function chip(c, t, begin) {
  return `<g opacity="0">${fadeIn(begin, 0.4)}
<rect x="${c.x}" y="${c.y}" width="${CW}" height="${CH}" rx="6" fill="${t.panel2}" stroke="${t.copper}" stroke-width="1.2"/>
${[0, 1, 2, 3, 4].map((i) => `<rect x="${c.x + 18 + i * 26}" y="${c.y - 4}" width="8" height="4" fill="${t.copperDim}"/><rect x="${c.x + 18 + i * 26}" y="${c.y + CH}" width="8" height="4" fill="${t.copperDim}"/>`).join("")}
${text(c.x + 14, c.y + 20, c.label, { size: 13, fill: t.text, font: MONO, weight: 600 })}
${text(c.x + 14, c.y + 35, c.sub, { size: 10.5, fill: t.text3, font: MONO })}
<circle cx="${c.x + CW - 14}" cy="${c.y + 14}" r="3.5" fill="${t.signal}" opacity="0.25"><animate attributeName="opacity" values="0.25;1;0.25" dur="1.8s" begin="${f(begin + 1.3 + CHIPS.indexOf(c) * 0.36, 2)}s" repeatCount="indefinite"/></circle>
</g>`;
}

export function hero(cfg, data, t) {
  const W = 1200;
  const H = 440;
  const score = devScore(data);
  let b = `<defs>
<pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${t.grid}"/></pattern>
<filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.2"/></filter>
<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.name === "dark" ? "#ffe08a" : "#d99a1c"}"/><stop offset="1" stop-color="${t.name === "dark" ? "#d49a3a" : "#8a5200"}"/></linearGradient>
</defs>
<rect x="16" y="16" width="${W - 32}" height="${H - 32}" rx="10" fill="url(#dots)"/>`;

  // ---- left: the name, etched
  b += `<g opacity="0">${fadeIn(0.1, 0.5)}${text(60, 46, `// ${cfg.motto}`, { size: 14, fill: t.copper, font: MONO })}</g>`;
  const [first, last] = cfg.name.toUpperCase().split(" ");
  const u = 10.2;
  const l1 = etch(first, 60, 68, u, t, 0.2, 3.4);
  const l2 = etch(last, 60, 148, u, t, l1.end, 3.4 + first.length * 0.11);
  b += l1.svg + l2.svg;

  b += `<g opacity="0">${fadeIn(1.7, 0.6)}
${text(60, 256, cfg.tagline, { size: 18, fill: t.text2 })}
${text(60, 280, "I build the things other people import: an editor, a database, a browser engine, a railway.", { size: 13.5, fill: t.text3 })}
</g>`;

  // Live numbers: contributions and the three ratings, each rolling up from zero.
  const cf = data.codeforces;
  const lc = data.leetcode;
  const cc = data.codechef;
  const total = data.contributions?.total;
  const chips = [
    total != null && { dot: t.name === "dark" ? "#39d353" : "#1a7f37", value: total, label: (v) => `${v.toLocaleString("en-US")} Contributions`, sub: "Last 12 Months" },
    cf && { dot: "#1f8acb", value: cf.rating, label: (v) => `CF ${v}`, sub: title(cf.rank) },
    lc && { dot: "#ffa116", value: lc.rating, label: (v) => `LC ${v}`, sub: `${lc.badge || ""} · Top ${lc.topPercent}%` },
    cc && { dot: "#e0b050", value: cc.rating, label: (v) => `CC ${v}`, sub: `${cc.stars}★ · Peak ${cc.maxRating}` },
  ].filter(Boolean);
  let cx = 60;
  chips.forEach((c, i) => {
    const w = 26 + Math.max(c.label(c.value).length * 8.0, c.sub.length * 6.6);
    const begin = 1.9 + i * 0.18;
    b += `<g opacity="0">${fadeIn(begin)}
<rect x="${f(cx)}" y="302" width="${f(w)}" height="56" rx="8" fill="${t.panel2}" stroke="${t.border}"/>
<circle cx="${f(cx + 15)}" cy="321" r="4.5" fill="${c.dot}"/>
${text(cx + 15, 346, c.sub, { size: 11.5, fill: t.text2, font: MONO })}
</g>`;
    b += rollUp(cx + 26, 326, c.value, c.label, { size: 15, fill: t.text, weight: 800 }, begin, 1.3);
    cx += w + 8;
  });
  b += `<g opacity="0">${fadeIn(2.6)}${text(60, 398, `Live · Rebuilt every 6 hours by GitHub Actions · Last run ${data.generatedAt.slice(0, 10)}`, { size: 11.5, fill: t.text3, font: MONO })}</g>`;

  // ---- right: the board
  STUBS.forEach((pts, i) => {
    b += drawIn(pathOf(pts), polyLength(pts), { stroke: t.copperDim, width: 2, begin: 0.5 + i * 0.08, dur: 0.7 });
    const [ex, ey] = pts[pts.length - 1];
    b += `<circle cx="${ex}" cy="${ey}" r="4" fill="none" stroke="${t.copperDim}" stroke-width="2" opacity="0">${fadeIn(1.1 + i * 0.08, 0.3)}</circle>`;
  });
  CHIPS.forEach((c, i) => {
    const pts = TRACES[c.id];
    b += drawIn(pathOf(pts), polyLength(pts), { stroke: t.copper, width: 2.6, begin: 0.7 + i * 0.18, dur: 0.9 });
  });
  // The processor: 760..940 x 158..282. It carries the grade (scripts/score.mjs).
  const X0 = 760;
  const Y0 = 158;
  const PW = 180;
  const PH = 124;
  b += `<g opacity="0">${fadeIn(0.35, 0.5)}
<rect x="${X0 - 14}" y="${Y0 - 14}" width="${PW + 28}" height="${PH + 28}" rx="16" fill="${t.copper}" opacity="0" filter="url(#glow)"><animate attributeName="opacity" values="0;0.28;0" dur="3.6s" begin="3.4s" repeatCount="indefinite"/></rect>
<rect x="${X0}" y="${Y0}" width="${PW}" height="${PH}" rx="9" fill="${t.panel2}" stroke="${t.copper}" stroke-width="1.8"/>
<rect x="${X0 + 8}" y="${Y0 + 8}" width="${PW - 16}" height="${PH - 16}" rx="5" fill="none" stroke="${t.copperDim}" stroke-dasharray="3 4"/>
${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${X0 + 16 + i * 24}" y="${Y0 - 6}" width="8" height="6" fill="${t.copper}"/><rect x="${X0 + 16 + i * 24}" y="${Y0 + PH}" width="8" height="6" fill="${t.copper}"/>`).join("")}
${[0, 1, 2, 3].map((i) => `<rect x="${X0 - 6}" y="${Y0 + 22 + i * 26}" width="6" height="8" fill="${t.copper}"/><rect x="${X0 + PW}" y="${Y0 + 22 + i * 26}" width="6" height="8" fill="${t.copper}"/>`).join("")}
</g>`;
  if (score) {
    const size = score.grade.length > 1 ? 50 : 60;
    const cx = X0 + PW / 2;
    b += `<g opacity="0">${fadeIn(1.2, 0.4)}
${text(cx, Y0 + 28, "DEV GRADE", { size: 10, fill: t.text3, font: MONO, weight: 700, anchor: "middle", extra: 'letter-spacing="2"' })}
${text(cx, Y0 + PH - 16, `Top ${score.top < 1 ? f(score.top, 2) : f(score.top, 1)}% · ${score.parts.length} Sites`, { size: 11, fill: t.signal, font: MONO, anchor: "middle" })}
</g>
<g opacity="0"><animate attributeName="opacity" from="0" to="1" begin="2.9s" dur="0.15s" fill="freeze"/>
<g transform="translate(${cx} ${Y0 + PH / 2 + 4})"><g><animateTransform attributeName="transform" type="scale" values="2.6;0.9;1" keyTimes="0;0.6;1" begin="2.9s" dur="0.5s" fill="freeze"/>
<text x="0" y="${f(size * 0.35)}" font-family="${SANS}" font-size="${size}" font-weight="900" fill="url(#gold)" text-anchor="middle" filter="url(#glow)" opacity="0.8">${esc(score.grade)}</text>
<text x="0" y="${f(size * 0.35)}" font-family="${SANS}" font-size="${size}" font-weight="900" fill="url(#gold)" text-anchor="middle">${esc(score.grade)}</text>
</g></g></g>`;
  } else {
    b += `<g opacity="0">${fadeIn(0.6)}${text(X0 + PW / 2, Y0 + PH / 2 + 7, "Sudhss", { size: 20, fill: t.text, font: MONO, weight: 700, anchor: "middle" })}</g>`;
  }
  CHIPS.forEach((c, i) => {
    b += chip(c, t, 1.4 + i * 0.18);
  });
  CHIPS.forEach((c, i) => {
    const d = pathOf(TRACES[c.id]);
    const begin = f(2.4 + i * 0.36, 2);
    b += `<circle r="4" fill="${t.signal}" opacity="0"><animateMotion path="${d}" dur="1.8s" begin="${begin}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.2 1"/>
<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur="1.8s" begin="${begin}s" repeatCount="indefinite"/></circle>`;
  });

  const summary = [score && `dev grade ${score.grade} (top ${f(score.top, 1)}%)`, total != null && `${total} contributions`, cf && `Codeforces ${cf.rating}`, lc && `LeetCode ${lc.rating}`, cc && `CodeChef ${cc.rating}`].filter(Boolean).join(", ");
  return svg(W, H, `${cfg.name}: ${cfg.tagline}. ${summary}`, b, t, { bg: true });
}
