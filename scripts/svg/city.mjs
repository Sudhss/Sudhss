/* The last year of contributions as a city.
 *
 * One building per day, as tall as that day's contributions, laid out on the
 * same weeks x weekdays grid as GitHub's calendar but seen from above and to
 * the side. On load the city rises week by week; at night (dark theme) its
 * windows come on, and a train runs along the front, lighting each block's
 * roofs as it passes.
 */

import { svg, text, MONO, f } from "./kit.mjs";

const WV = [19, 2.2]; // one week along the street
const DV = [-13, 9.5]; // one weekday towards the viewer
const SHADOW = [0.42, -0.05]; // ground shadow per pixel of height (light from the upper left)
const GAP = 0.13; // space between buildings, in cells
const CYCLE = 12; // seconds per train run
const RISE = 2.6; // seconds for the city to rise, left to right

const PAL = {
  dark: {
    sky: ["#070b16", "#0d1428"],
    south: ["#2e3f5e", "#141c2c"],
    edge: null,
    east: ["#1d2840", "#0e1422"],
    ground: "#0e1422",
    top: ["#1a2332", "#0e4429", "#006d32", "#26a641", "#39d353"],
    window: "#ffd27a",
    rail: "#3d4b63",
    orb: "#e8e3c8",
    night: true,
  },
  light: {
    sky: ["#dcebfa", "#f7fbff"],
    south: ["#f7f9fb", "#cdd6e0"],
    east: ["#d6dee7", "#a7b3c0"],
    edge: "#9aa7b4",
    ground: "#e9eef3",
    top: ["#d6dde5", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
    window: "#9fb6cc",
    rail: "#9aa7b4",
    orb: "#ffcf4d",
    night: false,
  },
};

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pts = (list) => list.map(([x, y]) => `${f(x)},${f(y)}`).join(" ");

export function city(contrib, t) {
  const P = PAL[t.name];
  const days = contrib.days;
  const offset = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
  const weeks = Math.ceil((days.length + offset) / 7);
  const W = 1200;
  const H = 500;
  const O = [165, 250]; // the back-left corner of the grid
  const at = (w, d) => [O[0] + w * WV[0] + d * DV[0], O[1] + w * WV[1] + d * DV[1]];
  const max = Math.max(...days.map((d) => d.count), 1);
  const heightOf = (n) => (n === 0 ? 1.5 : 8 + 140 * Math.sqrt(n / max));
  const rand = rng(1041);

  let b = `<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.sky[0]}"/><stop offset="1" stop-color="${P.sky[1]}"/></linearGradient>
<linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.south[0]}"/><stop offset="1" stop-color="${P.south[1]}"/></linearGradient>
<linearGradient id="ge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.east[0]}"/><stop offset="1" stop-color="${P.east[1]}"/></linearGradient>
<radialGradient id="lamp" cx="0" cy="0.5" r="1" fx="0" fy="0.5"><stop offset="0" stop-color="#fff3c4" stop-opacity="0.75"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></radialGradient>
<radialGradient id="haze"><stop offset="0" stop-color="#3b2f6b" stop-opacity="0.55"/><stop offset="0.6" stop-color="#1e2350" stop-opacity="0.25"/><stop offset="1" stop-color="#0d1428" stop-opacity="0"/></radialGradient>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
<clipPath id="frame"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="12"/></clipPath>
</defs>
<g clip-path="url(#frame)">
<rect width="${W}" height="${H}" fill="url(#sky)"/>`;

  // Sky: stars and a moon at night, the sun by day.
  if (P.night) {
    for (let i = 0; i < 70; i += 1) {
      const x = rand() * W;
      const y = 50 + rand() * 230;
      const r = rand() < 0.15 ? 1.4 : 0.8;
      const tw = rand() < 0.35;
      b += `<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="#dfe7ff" opacity="${f(0.3 + rand() * 0.5, 2)}">${tw ? `<animate attributeName="opacity" values="0.2;0.9;0.2" dur="${f(2 + rand() * 3, 1)}s" begin="${f(rand() * 3, 1)}s" repeatCount="indefinite"/>` : ""}</circle>`;
    }
  }
  b += `<circle cx="640" cy="92" r="${P.night ? 30 : 34}" fill="${P.orb}" filter="url(#glow)" opacity="0.7"/><circle cx="640" cy="92" r="${P.night ? 22 : 26}" fill="${P.orb}"/>`;
  if (P.night) b += `<circle cx="631" cy="86" r="4" fill="#cfc9ad"/><circle cx="648" cy="100" r="2.6" fill="#cfc9ad"/>`;

  // City glow on the horizon.
  if (P.night) b += `<ellipse cx="${f(at(weeks / 2, 3.5)[0])}" cy="${f(at(weeks / 2, 3.5)[1] - 40)}" rx="620" ry="150" fill="url(#haze)"/>`;

  // Ground slab under the whole grid.
  b += `<polygon points="${pts([at(-0.6, -0.4), at(weeks + 0.6, -0.4), at(weeks + 0.6, 8.6), at(-0.6, 8.6)])}" fill="${P.ground}" opacity="0.85"/>`;

  // Track along the front of the city.
  const railA = [at(-9, 8.1), at(weeks + 9, 8.1)];
  const railB = [at(-9, 8.5), at(weeks + 9, 8.5)];
  for (let w = -9; w < weeks + 9; w += 0.5) {
    b += `<polygon points="${pts([at(w, 7.95), at(w + 0.16, 7.95), at(w + 0.16, 8.65), at(w, 8.65)])}" fill="${P.rail}" opacity="0.6"/>`;
  }
  b += `<line x1="${f(railA[0][0])}" y1="${f(railA[0][1])}" x2="${f(railA[1][0])}" y2="${f(railA[1][1])}" stroke="${P.rail}" stroke-width="1.6"/>`;
  b += `<line x1="${f(railB[0][0])}" y1="${f(railB[0][1])}" x2="${f(railB[1][0])}" y2="${f(railB[1][1])}" stroke="${P.rail}" stroke-width="1.6"/>`;

  // The train: nose position through the cycle, used to time the roof lights.
  const trainFrom = -9;
  const trainTo = weeks + 3;
  const NOSE = 6.2; // weeks from the train's origin to its nose
  const trainBegin = RISE + 0.6;

  // Buildings, back to front.
  const cells = days.map((d, i) => {
    const slot = i + offset;
    return { ...d, w: Math.floor(slot / 7), d: slot % 7 };
  });
  cells.sort((a, c) => a.w * WV[1] + a.d * DV[1] - (c.w * WV[1] + c.d * DV[1]));
  let best = cells[0];
  for (const c of cells) if (c.count > best.count) best = c;

  // Ground shadows first, so every building stands on top of them.
  const hull = (list) => {
    const q = [...list].sort((a, z) => a[0] - z[0] || a[1] - z[1]);
    const cross = (o, a, z) => (a[0] - o[0]) * (z[1] - o[1]) - (a[1] - o[1]) * (z[0] - o[0]);
    const lo = [];
    const hi = [];
    for (const p of q) {
      while (lo.length > 1 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop();
      lo.push(p);
    }
    for (const p of q.reverse()) {
      while (hi.length > 1 && cross(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop();
      hi.push(p);
    }
    return lo.slice(0, -1).concat(hi.slice(0, -1));
  };
  for (const c of cells) {
    if (c.count === 0) continue;
    const h = heightOf(c.count);
    const foot = [at(c.w + GAP, c.d + GAP), at(c.w + 1 - GAP, c.d + GAP), at(c.w + 1 - GAP, c.d + 1 - GAP), at(c.w + GAP, c.d + 1 - GAP)];
    const cast = foot.map(([x, y]) => [x + SHADOW[0] * h, y + SHADOW[1] * h]);
    const begin = f(0.15 + (c.w / weeks) * RISE + 0.3, 2);
    b += `<polygon points="${pts(hull(foot.concat(cast)))}" fill="#000" opacity="0"><animate attributeName="opacity" from="0" to="${P.night ? 0.35 : 0.12}" begin="${begin}s" dur="0.6s" fill="freeze"/></polygon>`;
  }
  const towers = new Set([...cells].sort((a, z) => z.count - a.count).slice(0, 7).map((c) => c.date));

  for (const c of cells) {
    const h = heightOf(c.count);
    const p0 = at(c.w + GAP, c.d + GAP);
    const p1 = at(c.w + 1 - GAP, c.d + GAP);
    const p2 = at(c.w + 1 - GAP, c.d + 1 - GAP);
    const p3 = at(c.w + GAP, c.d + 1 - GAP);
    const o = p2; // local origin: front corner at street level
    const L = (p, dy = 0) => [p[0] - o[0], p[1] - o[1] - dy];
    const top = pts([L(p0, h), L(p1, h), L(p2, h), L(p3, h)]);
    const south = pts([L(p3), L(p2), L(p2, h), L(p3, h)]);
    const east = pts([L(p1), L(p2), L(p2, h), L(p1, h)]);
    const begin = f(0.15 + (c.w / weeks) * RISE + c.d * 0.015, 2);

    let g = `<g transform="translate(${f(o[0])} ${f(o[1])})"><g transform="scale(1 0.001)"><animateTransform attributeName="transform" type="scale" values="1 0.001;1 1.06;1 1" keyTimes="0;0.75;1" begin="${begin}s" dur="0.7s" fill="freeze"/>`;
    const edge = P.edge ? ` stroke="${P.edge}" stroke-width="0.5"` : "";
    g += `<polygon points="${south}" fill="url(#gs)"${edge}/><polygon points="${east}" fill="url(#ge)"${edge}/><polygon points="${top}" fill="${P.top[c.level]}"${edge}/>`;

    if (h > 18) {
      // Windows: dashed vertical lines, two columns on the long face, one on the short.
      const cols = [
        [L(p3), L(p2), 0.3],
        [L(p3), L(p2), 0.7],
        [L(p1), L(p2), 0.5],
      ];
      let win = "";
      for (const [a, z, k] of cols) {
        const x = a[0] + (z[0] - a[0]) * k;
        const y = a[1] + (z[1] - a[1]) * k;
        win += `<line x1="${f(x)}" y1="${f(y - 4)}" x2="${f(x)}" y2="${f(y - h + 5)}" stroke="${P.window}" stroke-width="2.4" stroke-dasharray="2.4 3.6"/>`;
      }
      if (P.night) {
        const on = f(RISE + 0.5 + rand() * 2.2, 2);
        const flicker = rand() < 0.12;
        g += `<g opacity="0"><animate attributeName="opacity" from="0" to="${f(0.55 + rand() * 0.4, 2)}" begin="${on}s" dur="0.25s" fill="freeze"/>${flicker ? `<animate attributeName="opacity" values="0.9;0.15;0.9;0.9" keyTimes="0;0.05;0.1;1" dur="${f(4 + rand() * 5, 1)}s" begin="${f(RISE + 3 + rand() * 4, 1)}s" repeatCount="indefinite"/>` : ""}${win}</g>`;
      } else {
        g += `<g opacity="0.55">${win}</g>`;
      }
    }

    if (c.count > 0) {
      // Roof light as the train goes by.
      const k = (c.w + 0.5 - trainFrom - NOSE) / (trainTo - trainFrom);
      if (k > 0.001 && k < 0.95) {
        const k2 = f(k, 3);
        const k3 = f(Math.min(0.99, k + 0.06), 3);
        g += `<polygon points="${top}" fill="${P.night ? "#b8ffcf" : "#ffffff"}" opacity="0"><animate attributeName="opacity" values="0;0;0.85;0;0" keyTimes="0;${k2};${f(k + 0.004, 3)};${k3};1" dur="${CYCLE}s" begin="${f(trainBegin, 2)}s" repeatCount="indefinite"/></polygon>`;
      }
    }
    if (towers.has(c.date)) {
      // The tallest get a mast with an aviation light.
      const tc = [L(p0, h), L(p1, h), L(p2, h), L(p3, h)].reduce((m, q) => [m[0] + q[0] / 4, m[1] + q[1] / 4], [0, 0]);
      const blink = f(rand() * 1.5, 2);
      g += `<line x1="${f(tc[0])}" y1="${f(tc[1])}" x2="${f(tc[0])}" y2="${f(tc[1] - 16)}" stroke="${P.night ? "#6b7890" : "#8c959f"}" stroke-width="1.2"/>`;
      g += `<circle cx="${f(tc[0])}" cy="${f(tc[1] - 17)}" r="5" fill="#ff4d4d" filter="url(#glow)" opacity="0"><animate attributeName="opacity" values="0;0.9;0;0" keyTimes="0;0.12;0.3;1" dur="1.6s" begin="${f(RISE + 1 + Number(blink), 2)}s" repeatCount="indefinite"/></circle>`;
      g += `<circle cx="${f(tc[0])}" cy="${f(tc[1] - 17)}" r="1.8" fill="#ff5a5a"><animate attributeName="opacity" values="0.35;1;0.35;0.35" keyTimes="0;0.12;0.3;1" dur="1.6s" begin="${f(RISE + 1 + Number(blink), 2)}s" repeatCount="indefinite"/></circle>`;
    }
    b += g + `</g></g>`;
  }

  // Callout on the busiest day.
  {
    const h = heightOf(best.count);
    const [x, y] = at(best.w + 0.5, best.d + 0.5);
    const ty = y - h - 40;
    const label = `${new Date(`${best.date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })} · ${best.count} Contributions`;
    b += `<g opacity="0"><animate attributeName="opacity" from="0" to="1" begin="${f(RISE + 0.9, 2)}s" dur="0.5s" fill="freeze"/>
<line x1="${f(x)}" y1="${f(y - h - 4)}" x2="${f(x)}" y2="${f(ty + 6)}" stroke="${t.signal}" stroke-width="1.2" stroke-dasharray="2 3"/>
<circle cx="${f(x)}" cy="${f(y - h - 4)}" r="2.5" fill="${t.signal}"/>
<rect x="${f(x - 92)}" y="${f(ty - 16)}" width="184" height="24" rx="12" fill="${t.panel}" stroke="${t.signal}" opacity="0.95"/>
${text(x, ty + 1, label, { size: 12, fill: t.text, font: MONO, weight: 700, anchor: "middle" })}</g>`;
  }

  // The train: three cars and a loco, drawn in local week/day units.
  const box = (w0, lw, d0, ld, h, fills) => {
    const q = (w, d) => [w * WV[0] + d * DV[0], w * WV[1] + d * DV[1]];
    const a = q(w0, d0 + ld);
    const z = q(w0 + lw, d0 + ld);
    const e = q(w0 + lw, d0);
    const n = q(w0, d0);
    const up = (p) => [p[0], p[1] - h];
    return `<polygon points="${pts([a, z, up(z), up(a)])}" fill="${fills[0]}"/><polygon points="${pts([e, z, up(z), up(e)])}" fill="${fills[1]}"/><polygon points="${pts([up(n), up(e), up(z), up(a)])}" fill="${fills[2]}"/>`;
  };
  const car = P.night ? ["#3a475e", "#2a3446", "#56647c"] : ["#c9d1d9", "#aeb8c4", "#e6ebf0"];
  const loco = [t.signal, t.name === "dark" ? "#23877d" : "#0b6e66", t.name === "dark" ? "#7ff0e2" : "#5cc9bf"];
  let train = "";
  for (let i = 0; i < 3; i += 1) {
    const w0 = i * 1.55;
    train += box(w0, 1.4, 8.05, 0.5, 9, car);
    // Lit windows along the side.
    for (let j = 0; j < 3; j += 1) {
      const q0 = [(w0 + 0.22 + j * 0.4) * WV[0] + 8.55 * DV[0], (w0 + 0.22 + j * 0.4) * WV[1] + 8.55 * DV[1] - 6];
      train += `<rect x="${f(q0[0])}" y="${f(q0[1])}" width="5" height="3" fill="${P.night ? "#ffe9a8" : "#7d8b99"}"/>`;
    }
  }
  train += box(4.7, 1.5, 8.05, 0.5, 10, loco);
  const nose = [NOSE * WV[0] + 8.3 * DV[0], NOSE * WV[1] + 8.3 * DV[1] - 4];
  if (P.night) {
    train += `<ellipse cx="${f(nose[0] + 40)}" cy="${f(nose[1])}" rx="42" ry="7" fill="url(#lamp)" opacity="0.8" transform="rotate(${f((Math.atan2(WV[1], WV[0]) * 180) / Math.PI, 1)} ${f(nose[0])} ${f(nose[1])})"/>`;
  }
  train += `<circle cx="${f(nose[0])}" cy="${f(nose[1])}" r="2.4" fill="#fff6d0"/>`;
  const s = at(trainFrom, 0);
  const e = at(trainTo, 0);
  const o0 = at(0, 0);
  b += `<g transform="translate(${f(o0[0])} ${f(o0[1])})" opacity="0"><set attributeName="opacity" to="1" begin="${f(trainBegin, 2)}s"/><g transform="translate(${f(s[0] - o0[0])} ${f(s[1] - o0[1])})"><animateTransform attributeName="transform" type="translate" values="${f(s[0] - o0[0])} ${f(s[1] - o0[1])};${f(e[0] - o0[0])} ${f(e[1] - o0[1])}" keyTimes="0;1" dur="${CYCLE}s" begin="${f(trainBegin, 2)}s" repeatCount="indefinite"/>${train}</g></g>`;

  // Month labels in front of the track.
  let lastX = -99;
  let lastMonth = -1;
  for (let w = 0; w < weeks; w += 1) {
    const idx = Math.max(0, w * 7 - offset);
    if (!days[idx]) continue;
    const m = new Date(`${days[idx].date}T00:00:00Z`).getUTCMonth();
    const [x, y] = at(w, 9.4);
    if (m !== lastMonth && x - lastX > 44 && w < weeks - 1) {
      b += text(x, y + 12, new Date(Date.UTC(2020, m, 1)).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }), { size: 11, fill: t.text3, font: MONO });
      lastX = x;
      lastMonth = m;
    } else if (m !== lastMonth) lastMonth = m;
  }

  // Header.
  let streak = 0;
  let longest = 0;
  for (const d of days) {
    streak = d.count > 0 ? streak + 1 : 0;
    longest = Math.max(longest, streak);
  }
  let current = 0;
  for (let i = days.length - 1; i >= 0 && days[i].count > 0; i -= 1) current += 1;
  const total = contrib.total ?? days.reduce((n, d) => n + d.count, 0);
  b += text(28, 40, `${total.toLocaleString("en-US")} Contributions, One Building a Day`, { size: 17, fill: t.text, weight: 700 });
  b += text(28, 62, `Longest Streak ${longest} Days · Current ${current} · Tallest ${best.count}`, { size: 12.5, fill: t.text2, font: MONO });
  b += text(W - 28, 40, "One Building per Day · Height = Contributions", { size: 11.5, fill: t.text3, font: MONO, anchor: "end" });
  b += `</g><rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="12" fill="none" stroke="${t.border}"/>`;

  return svg(W, H, `${total} GitHub contributions in the last year, drawn as a city; longest streak ${longest} days`, b, t, { bg: false });
}
