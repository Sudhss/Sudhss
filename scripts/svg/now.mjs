/* "Right now": the last few repos pushed to, from the public events feed,
 * printed like a bus trace on a logic analyser -- one lane per repo, a pulse
 * where the push landed on a 14-day timeline. */

import { svg, text, fadeIn, MONO, f, ago } from "./kit.mjs";

const DAYS = 14;

export function now(activity, generatedAt, t) {
  const W = 1200;
  const rows = [...(activity || [])].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4);
  const lane = 34;
  const top = 64;
  const H = top + Math.max(1, rows.length) * lane + 40;
  const x0 = 380;
  const x1 = W - 40;
  const at = new Date(generatedAt).getTime();
  const xOf = (iso) => {
    const d = (at - new Date(iso).getTime()) / 86400000;
    return x1 - (Math.min(DAYS, Math.max(0, d)) / DAYS) * (x1 - x0);
  };

  let b = text(24, 36, "Right Now", { size: 16, fill: t.text, weight: 700 });
  b += text(118, 36, "Latest pushes, from the public events feed", { size: 12.5, fill: t.text3, font: MONO });
  // Time axis.
  for (let d = 0; d <= DAYS; d += 1) {
    const x = x1 - (d / DAYS) * (x1 - x0);
    b += `<line x1="${f(x)}" y1="${top - 12}" x2="${f(x)}" y2="${H - 30}" stroke="${t.grid}" stroke-width="${d % 7 ? 1 : 1.5}"/>`;
  }
  b += text(x1, H - 12, "Now", { size: 11, fill: t.text3, font: MONO, anchor: "end" });
  b += text(x1 - (7 / DAYS) * (x1 - x0), H - 12, "A Week Ago", { size: 11, fill: t.text3, font: MONO, anchor: "middle" });
  b += text(x0, H - 12, `${DAYS} Days Ago`, { size: 11, fill: t.text3, font: MONO });

  if (!rows.length) {
    b += text(24, top + 16, "Quiet week -- nothing public pushed", { size: 13, fill: t.text2, font: MONO });
  }
  rows.forEach((r, i) => {
    const y = top + i * lane + 10;
    const name = r.repo.split("/")[1];
    const x = xOf(r.at);
    const begin = 0.3 + i * 0.25;
    b += `<g opacity="0">${fadeIn(begin, 0.4)}
<circle cx="32" cy="${y - 4}" r="4" fill="${i === 0 ? t.signal : t.copper}">${i === 0 ? `<animate attributeName="opacity" values="1;0.3;1" dur="1.4s" repeatCount="indefinite"/>` : ""}</circle>
${text(46, y, name, { size: 14, fill: t.text, font: MONO, weight: 600 })}
${text(x0 - 20, y, ago(r.at, at), { size: 12, fill: t.text3, font: MONO, anchor: "end" })}
</g>`;
    // The lane: flat, then a pulse at the push, then flat to now.
    const lo = y + 2;
    const hi = y - 12;
    const d = `M${x0} ${lo} L${f(x - 5)} ${lo} L${f(x - 3)} ${hi} L${f(x + 3)} ${hi} L${f(x + 5)} ${lo} L${x1} ${lo}`;
    const len = x1 - x0 + 28;
    b += `<path d="${d}" fill="none" stroke="${i === 0 ? t.signal : t.copper}" stroke-width="1.8" stroke-linejoin="round" stroke-dasharray="${f(len)}" stroke-dashoffset="${f(len)}"><animate attributeName="stroke-dashoffset" from="${f(len)}" to="0" begin="${f(begin + 0.2, 2)}s" dur="1.1s" fill="freeze"/></path>`;
  });

  // A sweeping cursor, like a scope's trigger line.
  b += `<line x1="${x0}" y1="${top - 12}" x2="${x0}" y2="${H - 30}" stroke="${t.signal}" stroke-width="1" opacity="0.5"><animate attributeName="x1" values="${x0};${x1}" dur="6s" repeatCount="indefinite"/><animate attributeName="x2" values="${x0};${x1}" dur="6s" repeatCount="indefinite"/></line>`;
  const label = rows.map((r) => `${r.repo.split("/")[1]} ${ago(r.at, at)}`).join(", ");
  return svg(W, H, `Latest pushes: ${label || "none"}`, b, t);
}
