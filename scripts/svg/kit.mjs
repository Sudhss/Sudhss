/* Shared pieces for every SVG on the profile.
 *
 * Everything is drawn twice, once per GitHub theme, and the README picks the
 * right one with <picture> + prefers-color-scheme. The look is a circuit
 * board: copper traces, signal pulses, chips -- things built from scratch,
 * wired together.
 *
 * Animation is SMIL (<animate>, <animateMotion>, <set>), which GitHub renders
 * inside README images. No scripts, no external fonts: an <img> SVG can load
 * neither, so type falls back to each platform's own UI and mono faces.
 */

export const THEMES = {
  dark: {
    name: "dark",
    bg: "#0d1117",
    panel: "#111821",
    panel2: "#161f2a",
    border: "#26313d",
    text: "#e6edf3",
    text2: "#9aa7b4",
    text3: "#65717d",
    copper: "#d49a3a",
    copperDim: "#5a4524",
    signal: "#39d0c0",
    signalDim: "#1c4a47",
    warn: "#f0b429",
    bad: "#f47067",
    good: "#57d18a",
    grid: "#18212b",
    syn: { pre: "#c792ea", type: "#82aaff", fn: "#82e787", str: "#c3e88d" },
    car: "#2a3542",
    cell: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
  },
  light: {
    name: "light",
    bg: "#ffffff",
    panel: "#f6f8fa",
    panel2: "#eef2f6",
    border: "#d0d7de",
    text: "#1f2328",
    text2: "#57606a",
    text3: "#8c959f",
    copper: "#a8691a",
    copperDim: "#e6d2b0",
    signal: "#0e8f84",
    signalDim: "#bfe6e1",
    warn: "#b7791f",
    bad: "#cf222e",
    good: "#1a7f37",
    grid: "#eaeef2",
    syn: { pre: "#8250df", type: "#0550ae", fn: "#116329", str: "#0a3069" },
    car: "#c9d1d9",
    cell: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
  },
};

export const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
export const MONO = "ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace";

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const f = (n, d = 1) => Number(n.toFixed(d));

export function svg(w, h, title, body, t, { bg = true } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
${bg ? `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="12" fill="${t.panel}" stroke="${t.border}"/>` : ""}
${body}
</svg>
`;
}

/** Length of an orthogonal/polyline path given as points. */
export function polyLength(pts) {
  let n = 0;
  for (let i = 1; i < pts.length; i += 1) n += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return n;
}

export const pathOf = (pts) => pts.map((p, i) => `${i ? "L" : "M"}${f(p[0])} ${f(p[1])}`).join(" ");

/** A path that draws itself in, then stays. */
export function drawIn(d, len, { stroke, width = 2, begin = 0, dur = 1.2, cap = "round", extra = "" }) {
  return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="${cap}" stroke-linejoin="round" stroke-dasharray="${f(len)}" stroke-dashoffset="${f(len)}" ${extra}>
<animate attributeName="stroke-dashoffset" from="${f(len)}" to="0" begin="${begin}s" dur="${dur}s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.3 0 0.2 1"/></path>`;
}

/** Fade something in at a time. */
export const fadeIn = (begin, dur = 0.5) =>
  `<animate attributeName="opacity" from="0" to="1" begin="${begin}s" dur="${dur}s" fill="freeze"/>`;

export const text = (x, y, s, { size = 14, fill, font = SANS, weight = 400, anchor = "start", extra = "" }) =>
  `<text x="${f(x)}" y="${f(y)}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" ${extra}>${esc(s)}</text>`;

/** "candidate master" -> "Candidate Master" */
export const title = (s) => String(s).replace(/\b\w/g, (c) => c.toUpperCase());

export const ago = (iso, now = Date.now()) => {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 3600) {
    const m = Math.max(1, Math.round(s / 60));
    return `${m} Minute${m === 1 ? "" : "s"} Ago`;
  }
  if (s < 86400) {
    const h = Math.round(s / 3600);
    return `${h} Hour${h === 1 ? "" : "s"} Ago`;
  }
  const d = Math.round(s / 86400);
  return `${d} Day${d === 1 ? "" : "s"} Ago`;
};
