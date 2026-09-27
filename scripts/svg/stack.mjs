/* The stack as the layers of a board: systems at the bottom, ops on top,
 * one via running through all of them with a signal travelling up it. */

import { svg, text, fadeIn, MONO, f } from "./kit.mjs";

export function stack(cfg, t) {
  const W = 1200;
  const layers = [...cfg.stack].reverse(); // ops on top, systems at the bottom
  const rowH = 52;
  const top = 58;
  const H = top + layers.length * rowH + 22;
  const labelW = 150;
  const x0 = 24;
  const viaX = x0 + labelW - 18;

  let b = text(24, 36, "The Stack", { size: 16, fill: t.text, weight: 700 });
  b += text(W - 24, 36, "Bottom layer first -- that's where most of the work is", { size: 12.5, fill: t.text3, font: MONO, anchor: "end" });

  layers.forEach((L, i) => {
    const y = top + i * rowH;
    const begin = 0.2 + (layers.length - 1 - i) * 0.2; // build from the bottom up
    b += `<g opacity="0">${fadeIn(begin, 0.45)}
<rect x="${x0}" y="${y}" width="${W - 48}" height="${rowH - 10}" rx="7" fill="${t.panel2}" stroke="${t.border}"/>
${text(x0 + 16, y + 26, `L${layers.length - i}`, { size: 11, fill: t.copper, font: MONO, weight: 700 })}
${text(x0 + 44, y + 26, L.layer, { size: 14, fill: t.text, font: MONO, weight: 600 })}`;
    let cx = x0 + labelW + 16;
    L.items.forEach((item, j) => {
      const w = item.length * 8.1 + 26;
      b += `<g opacity="0">${fadeIn(begin + 0.15 + j * 0.06, 0.3)}<rect x="${f(cx)}" y="${y + 8}" width="${f(w)}" height="26" rx="5" fill="${t.panel}" stroke="${t.copperDim}"/>
<rect x="${f(cx + 7)}" y="${y + 18}" width="4" height="6" rx="1" fill="${t.copper}"/>
${text(cx + 17, y + 26, item, { size: 13, fill: t.text2, font: MONO })}</g>`;
      cx += w + 10;
    });
    b += `</g>`;
  });
  // The via.
  const yTop = top + 12;
  const yBot = top + (layers.length - 1) * rowH + 30;
  b += `<line x1="${viaX}" y1="${yTop}" x2="${viaX}" y2="${yBot}" stroke="${t.copper}" stroke-width="2"/>`;
  layers.forEach((_, i) => {
    b += `<circle cx="${viaX}" cy="${top + i * rowH + 21}" r="4.5" fill="${t.panel2}" stroke="${t.copper}" stroke-width="2"/>`;
  });
  b += `<circle cx="${viaX}" r="4" fill="${t.signal}"><animate attributeName="cy" values="${yBot};${yTop}" dur="2.4s" begin="1.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="2.4s" begin="1.4s" repeatCount="indefinite"/></circle>`;

  return svg(W, H, `Stack: ${cfg.stack.map((l) => `${l.layer}: ${l.items.join(", ")}`).join("; ")}`, b, t);
}
