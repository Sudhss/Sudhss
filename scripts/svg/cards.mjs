/* One card per project, each with a small looping animation of the thing the
 * project actually does -- not a logo, the mechanism. */

import { svg, text, SANS, MONO, f, esc } from "./kit.mjs";

const W = 580;
const H = 258;
const CYCLE = 7;

/** Visible only during [a, b] of each cycle (fractions), with short fades. */
const during = (a, b, cycle = CYCLE) => {
  const e = 0.03;
  const k = [0, Math.max(0, a - e), a, b, Math.min(1, b + e), 1].map((v) => f(v, 3));
  return `<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="${k.join(";")}" dur="${cycle}s" repeatCount="indefinite"/>`;
};

function wrap(s, max = 66) {
  const out = [];
  let line = "";
  for (const w of s.split(" ")) {
    if ((line + " " + w).trim().length > max) {
      out.push(line.trim());
      line = w;
    } else line += " " + w;
  }
  if (line.trim()) out.push(line.trim());
  return out;
}

function frame(p, t, art) {
  let b = text(24, 40, p.title, { size: 21, fill: t.text, weight: 800 });
  b += text(W - 24, 40, p.lang, { size: 12, fill: t.text3, font: MONO, anchor: "end" });
  wrap(p.line).forEach((l, i) => {
    b += text(24, 66 + i * 20, l, { size: 14, fill: t.text2 });
  });
  b += `<rect x="16" y="112" width="${W - 32}" height="${H - 128}" rx="8" fill="${t.panel2}" stroke="${t.border}"/>`;
  b += art;
  return svg(W, H, `${p.title}: ${p.line}`, b, t);
}

/* ---------------------------------------------------------------- Valence */
function valence(t) {
  const rows = [
    [["#include ", t.syn.pre], ["<bits/stdc++.h>", t.syn.pre]],
    [["int ", t.syn.type], ["main", t.syn.fn], ["() {", t.text2]],
    [["    cout ", t.syn.type], ["<< ", t.text2], ['"hello, world"', t.syn.str], [";", t.text2]],
    [["}", t.text2]],
  ];
  const x0 = 60;
  const y0 = 142;
  let a = "";
  rows.forEach((row, r) => {
    a += text(38, y0 + r * 24, String(r + 1), { size: 12, fill: t.text3, font: MONO, anchor: "end" });
  });
  // Each line types in turn, the caret riding the end of the text.
  const CH = 8.2;
  const lens = rows.map((row) => row.reduce((n, [s]) => n + s.length, 0));
  const total = lens.reduce((n, l) => n + l, 0);
  const span = 0.55 - 0.01 * (rows.length - 1);
  let at = 0.05;
  const cx = [x0];
  const cy = [y0 - 14];
  const kt = [0];
  rows.forEach((row, r) => {
    const s0 = at;
    const s1 = at + (span * lens[r]) / total;
    at = s1 + 0.01;
    const w = lens[r] * CH + 4;
    const y = y0 + r * 24;
    let spans = "";
    for (const [str, c] of row) spans += `<tspan fill="${c}">${esc(str).replace(/ /g, "&#160;")}</tspan>`;
    a += `<clipPath id="vt${r}-${t.name}"><rect x="${x0}" y="${y - 16}" height="22" width="0"><animate attributeName="width" values="0;0;${f(w)};${f(w)};0" keyTimes="0;${f(s0, 3)};${f(s1, 3)};0.95;1" dur="${CYCLE}s" repeatCount="indefinite"/></rect></clipPath>`;
    a += `<text x="${x0}" y="${y}" font-family="${MONO}" font-size="14" clip-path="url(#vt${r}-${t.name})">${spans}</text>`;
    cx.push(x0, x0 + lens[r] * CH);
    cy.push(y - 14, y - 14);
    kt.push(s0, s1);
  });
  cx.push(cx[cx.length - 1], x0);
  cy.push(cy[cy.length - 1], y0 - 14);
  kt.push(0.95, 1);
  const ktS = kt.map((k) => f(k, 3)).join(";");
  a += `<rect x="${x0}" y="${y0 - 14}" width="2.4" height="19" fill="${t.signal}"><animate attributeName="x" values="${cx.map((v) => f(v)).join(";")}" keyTimes="${ktS}" dur="${CYCLE}s" repeatCount="indefinite"/><animate attributeName="y" values="${cy.join(";")}" keyTimes="${ktS}" dur="${CYCLE}s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0.2;1" dur="0.9s" repeatCount="indefinite"/></rect>`;
  a += `<rect x="${W - 196}" y="${H - 44}" width="168" height="24" rx="5" fill="${t.panel}" stroke="${t.border}"/>`;
  a += `<g opacity="0">${during(0.62, 0.94)}${text(W - 112, H - 27, "g++ -O2 → AC  4 / 4", { size: 12, fill: t.good, font: MONO, weight: 700, anchor: "middle" })}</g>`;
  return a;
}

/* ---------------------------------------------------------------- RailFlow */
function railflow(t) {
  const N = { A: [60, 180], B: [170, 150], C: [300, 150], D: [430, 160], E: [540, 180], F: [240, 222], G: [380, 222] };
  const edges = [["A", "B"], ["B", "C"], ["C", "D"], ["D", "E"], ["B", "F"], ["F", "G"], ["G", "D"]];
  let a = "";
  edges.forEach(([u, v]) => {
    a += `<line x1="${N[u][0]}" y1="${N[u][1]}" x2="${N[v][0]}" y2="${N[v][1]}" stroke="${t.text3}" stroke-width="3" stroke-linecap="round"/>`;
  });
  // The closure: C-D goes red, dashed.
  a += `<line x1="${N.C[0]}" y1="${N.C[1]}" x2="${N.D[0]}" y2="${N.D[1]}" stroke="${t.bad}" stroke-width="4" stroke-dasharray="7 6" opacity="0">${during(0.34, 0.97)}</line>`;
  a += `<g opacity="0">${during(0.36, 0.97)}${text(365, 140, "Closed", { size: 11, fill: t.bad, font: MONO, anchor: "middle" })}</g>`;
  Object.entries(N).forEach(([k, [x, y]]) => {
    a += `<circle cx="${x}" cy="${y}" r="7" fill="${t.panel}" stroke="${t.text2}" stroke-width="2"/>`;
  });
  const main = `M${N.A} L${N.B} L${N.C} L${N.D} L${N.E}`.replace(/,/g, " ");
  const detour = `M${N.A} L${N.B} L${N.F} L${N.G} L${N.D} L${N.E}`.replace(/,/g, " ");
  // Train 1 runs the main line before the closure; train 2 is rerouted.
  a += `<circle r="6.5" fill="${t.signal}"><animateMotion path="${main}" dur="${CYCLE}s" keyPoints="0;1;1" keyTimes="0;0.3;1" calcMode="linear" repeatCount="indefinite"/><animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.3;0.31;1" dur="${CYCLE}s" repeatCount="indefinite"/></circle>`;
  a += `<circle r="6.5" fill="${t.copper}" opacity="0"><animateMotion path="${detour}" dur="${CYCLE}s" keyPoints="0;0;1;1" keyTimes="0;0.42;0.92;1" calcMode="linear" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.42;0.43;0.92;1" dur="${CYCLE}s" repeatCount="indefinite"/></circle>`;
  a += `<path d="${detour}" fill="none" stroke="${t.copper}" stroke-width="2" stroke-dasharray="3 5" opacity="0">${during(0.4, 0.95)}</path>`;
  a += `<g opacity="0">${during(0.44, 0.95)}${text(W - 30, 142, "Rerouted via Dijkstra", { size: 11.5, fill: t.copper, font: MONO, anchor: "end" })}</g>`;
  return a;
}

/* ---------------------------------------------------------------- Mini SQL */
function minisql(t) {
  const node = (x, y, keys, color = t.text2) => {
    const w = 30 * keys.length + 12;
    let s = `<rect x="${x - w / 2}" y="${y}" width="${w}" height="28" rx="5" fill="${t.panel}" stroke="${color}" stroke-width="1.6"/>`;
    keys.forEach((k, i) => {
      const kx = x - w / 2 + 6 + i * 30;
      if (i) s += `<line x1="${kx}" y1="${y + 4}" x2="${kx}" y2="${y + 24}" stroke="${t.border}"/>`;
      s += text(kx + 15, y + 19, String(k), { size: 13, fill: t.text, font: MONO, weight: 700, anchor: "middle" });
    });
    return s;
  };
  const edge = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${t.text3}" stroke-width="1.6"/>`;
  let a = text(34, 138, "INSERT INTO users VALUES (17, 'ada');", { size: 12.5, fill: t.copper, font: MONO });
  // Before: root [20], leaves [5 12] [20 31]
  a += `<g>${during(0, 0.46)}${node(290, 150, [20])}${edge(275, 178, 200, 204)}${edge(305, 178, 390, 204)}${node(200, 204, [5, 12])}${node(390, 204, [20, 31])}</g>`;
  // The key falls into the left leaf.
  a += `<g opacity="0">${during(0.12, 0.4)}<g>${node(480, 150, [17], t.signal)}<animateTransform attributeName="transform" type="translate" values="0 0;0 0;-216 54;-216 54" keyTimes="0;0.12;0.36;1" dur="${CYCLE}s" repeatCount="indefinite"/></g></g>`;
  // Overflow, then split: root [17 20], leaves [5 12] [17] [20 31]
  a += `<g opacity="0">${during(0.4, 0.5)}${node(290, 150, [20])}${edge(275, 178, 200, 204)}${edge(305, 178, 390, 204)}${node(200, 204, [5, 12, 17], t.bad)}${node(390, 204, [20, 31])}</g>`;
  a += `<g opacity="0">${during(0.52, 0.97)}${node(290, 150, [17, 20], t.signal)}${edge(268, 178, 160, 204)}${edge(290, 178, 285, 204)}${edge(312, 178, 420, 204)}${node(160, 204, [5, 12])}${node(285, 204, [17])}${node(420, 204, [20, 31])}${text(W - 30, 138, "Leaf Split · 17 Pushed Up", { size: 11.5, fill: t.signal, font: MONO, anchor: "end" })}</g>`;
  return a;
}

/* ---------------------------------------------------------------- Mini Chromium */
function chromium(t) {
  let a = "";
  const toks = ["<div>", "<p>", "hello", "</p>", "</div>"];
  toks.forEach((tk, i) => {
    a += `<g opacity="0">${during(0.02 + i * 0.05, 0.36)}<rect x="${34 + i * 66}" y="128" width="60" height="22" rx="4" fill="${t.panel}" stroke="${t.border}"/>${text(64 + i * 66, 143, tk, { size: 11.5, fill: i === 2 ? t.text : t.syn.pre, font: MONO, anchor: "middle" })}</g>`;
  });
  a += `<g opacity="0">${during(0.02, 0.36)}${text(W - 30, 143, "Tokenize", { size: 11.5, fill: t.text3, font: MONO, anchor: "end" })}</g>`;
  // DOM tree
  const tree = `<g opacity="0">${during(0.36, 0.66)}
<circle cx="120" cy="172" r="16" fill="${t.panel}" stroke="${t.copper}" stroke-width="1.6"/>${text(120, 176, "div", { size: 11, fill: t.text, font: MONO, anchor: "middle" })}
<line x1="120" y1="188" x2="120" y2="200" stroke="${t.text3}"/>
<circle cx="120" cy="214" r="14" fill="${t.panel}" stroke="${t.copper}" stroke-width="1.6"/>${text(120, 218, "p", { size: 11, fill: t.text, font: MONO, anchor: "middle" })}
<line x1="134" y1="214" x2="170" y2="214" stroke="${t.text3}"/>${text(210, 218, '"hello"', { size: 11, fill: t.syn.str, font: MONO, anchor: "middle" })}
${text(W - 30, 176, "DOM", { size: 11.5, fill: t.text3, font: MONO, anchor: "end" })}</g>`;
  a += tree;
  // Layout and paint
  a += `<g opacity="0">${during(0.66, 0.97)}
<rect x="60" y="130" width="460" height="100" rx="3" fill="none" stroke="${t.copper}" stroke-width="1.6" stroke-dasharray="4 3"/>
${text(66, 144, "div  460×100", { size: 10.5, fill: t.copper, font: MONO })}
<rect x="80" y="156" width="420" height="52" rx="3" fill="${t.signalDim}" stroke="${t.signal}" stroke-width="1.4"><animate attributeName="fill-opacity" values="0;0;1;1" keyTimes="0;0.75;0.85;1" dur="${CYCLE}s" repeatCount="indefinite"/></rect>
${text(96, 188, "hello", { size: 18, fill: t.text, weight: 700 })}
${text(W - 30, 222, "Layout → Paint", { size: 11.5, fill: t.text3, font: MONO, anchor: "end" })}</g>`;
  return a;
}

/* ---------------------------------------------------------------- Axios-Sovereign */
function axios(t) {
  const P = { alert: [70, 180], a: [230, 140], b: [230, 222], c: [370, 180], fix: [510, 180] };
  let a = "";
  const lines = [["alert", "a"], ["alert", "b"], ["a", "b"], ["a", "c"], ["b", "c"], ["c", "fix"]];
  lines.forEach(([u, v]) => {
    a += `<line x1="${P[u][0]}" y1="${P[u][1]}" x2="${P[v][0]}" y2="${P[v][1]}" stroke="${t.border}" stroke-width="1.5"/>`;
  });
  a += `<circle cx="${P.alert[0]}" cy="${P.alert[1]}" r="20" fill="${t.panel}" stroke="${t.bad}" stroke-width="2"><animate attributeName="r" values="20;24;20" dur="1s" repeatCount="indefinite"/></circle>${text(P.alert[0], P.alert[1] + 5, "!", { size: 18, fill: t.bad, weight: 800, anchor: "middle" })}`;
  a += text(P.alert[0], P.alert[1] + 40, "p99 > 2s", { size: 10.5, fill: t.bad, font: MONO, anchor: "middle" });
  const agent = ([x, y], label) => `<rect x="${x - 44}" y="${y - 16}" width="88" height="32" rx="16" fill="${t.panel}" stroke="${t.copper}" stroke-width="1.6"/>${text(x, y + 5, label, { size: 12, fill: t.text, font: MONO, anchor: "middle" })}`;
  a += agent(P.a, "Planner") + agent(P.b, "Critic") + agent(P.c, "Executor");

  // Messages: alert -> planner/critic, the debate, then the executor.
  const msg = (u, v, start, len, color) =>
    `<circle r="4.5" fill="${color}" opacity="0"><animateMotion path="M${P[u][0]} ${P[u][1]} L${P[v][0]} ${P[v][1]}" keyPoints="0;0;1;1" keyTimes="0;${start};${f(start + len, 3)};1" dur="${CYCLE}s" calcMode="linear" repeatCount="indefinite"/><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;${start};${f(start + 0.01, 3)};${f(start + len, 3)};${f(Math.min(0.99, start + len + 0.01), 3)};1" dur="${CYCLE}s" repeatCount="indefinite"/></circle>`;
  a += msg("alert", "a", 0.05, 0.1, t.bad) + msg("alert", "b", 0.05, 0.1, t.bad);
  a += msg("a", "b", 0.2, 0.08, t.signal) + msg("b", "a", 0.3, 0.08, t.copper) + msg("a", "b", 0.4, 0.08, t.signal);
  a += msg("a", "c", 0.52, 0.1, t.good) + msg("b", "c", 0.52, 0.1, t.good) + msg("c", "fix", 0.66, 0.1, t.good);
  a += `<g opacity="0">${during(0.2, 0.5)}${text(300, 132, "Debate", { size: 10.5, fill: t.text3, font: MONO, anchor: "middle" })}</g>`;
  a += `<g opacity="0">${during(0.76, 0.97)}<circle cx="${P.fix[0]}" cy="${P.fix[1]}" r="20" fill="${t.panel}" stroke="${t.good}" stroke-width="2"/>${text(P.fix[0], P.fix[1] + 6, "✓", { size: 18, fill: t.good, weight: 800, anchor: "middle" })}${text(P.fix[0], P.fix[1] + 40, "Rollback · Audited", { size: 10.5, fill: t.good, font: MONO, anchor: "middle" })}</g>`;
  return a;
}

/* ---------------------------------------------------------------- EducredChain */
function educred(t) {
  let a = "";
  const hashes = ["0x00a1", "0x7f3a", "0xc9e2", "0x41bd"];
  hashes.forEach((h, i) => {
    const x = 36 + i * 126;
    const start = 0.05 + i * 0.14;
    a += `<g opacity="0">${during(start, 0.97)}
<rect x="${x}" y="140" width="104" height="70" rx="6" fill="${t.panel}" stroke="${i === 3 ? t.signal : t.border}" stroke-width="1.6"/>
${text(x + 10, 160, `Block ${1024 + i}`, { size: 11, fill: t.text2, font: MONO })}
${text(x + 10, 180, i === 3 ? "Credential" : "Tx Batch", { size: 12, fill: t.text, font: MONO, weight: 700 })}
${text(x + 10, 199, h, { size: 11, fill: t.copper, font: MONO })}
</g>`;
    if (i) {
      a += `<g opacity="0">${during(start - 0.02, 0.97)}<line x1="${x - 28}" y1="175" x2="${x}" y2="175" stroke="${t.copper}" stroke-width="2"/><circle cx="${x - 28}" cy="175" r="3" fill="${t.copper}"/></g>`;
    }
  });
  a += `<g opacity="0">${during(0.66, 0.97)}<circle cx="${W - 42}" cy="175" r="13" fill="${t.panel}" stroke="${t.good}" stroke-width="2"/>${text(W - 42, 180, "✓", { size: 14, fill: t.good, weight: 800, anchor: "middle" })}${text(W - 30, 232, "Hash Matches · Verified", { size: 11.5, fill: t.good, font: MONO, anchor: "end" })}</g>`;
  return a;
}

const ART = { valence, railflow, minisql, chromium, axios, educred };

export function card(p, t) {
  return frame(p, t, ART[p.id](t));
}
export { SANS };
