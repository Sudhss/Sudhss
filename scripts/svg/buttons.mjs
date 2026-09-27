/* Link buttons, one SVG each so every one can be its own <a>. */

import { svg, text, MONO } from "./kit.mjs";

const ICONS = {
  portfolio: (c) => `<circle cx="22" cy="22" r="8" fill="none" stroke="${c}" stroke-width="1.8"/><ellipse cx="22" cy="22" rx="3.5" ry="8" fill="none" stroke="${c}" stroke-width="1.5"/><line x1="14" y1="22" x2="30" y2="22" stroke="${c}" stroke-width="1.5"/>`,
  linkedin: (c) => `<rect x="14" y="14" width="16" height="16" rx="3" fill="${c}"/><text x="22" y="26.5" font-family="Arial,sans-serif" font-size="11" font-weight="700" fill="#fff" text-anchor="middle">in</text>`,
  email: (c) => `<rect x="13" y="16" width="18" height="13" rx="2" fill="none" stroke="${c}" stroke-width="1.8"/><path d="M13.5 17 L22 23.5 L30.5 17" fill="none" stroke="${c}" stroke-width="1.8" stroke-linejoin="round"/>`,
  codeforces: () => `<rect x="13" y="20" width="5" height="10" rx="1" fill="#f7c948"/><rect x="19.5" y="14" width="5" height="16" rx="1" fill="#1f8acb"/><rect x="26" y="18" width="5" height="12" rx="1" fill="#e5352b"/>`,
  leetcode: () => `<path d="M26 15 L18 23 L26 31" fill="none" stroke="#ffa116" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><line x1="21" y1="23" x2="31" y2="23" stroke="#9aa7b4" stroke-width="2.4" stroke-linecap="round"/>`,
  codechef: () => `<path d="M15 23 a4 4 0 0 1 3 -7 a5 5 0 0 1 8 0 a4 4 0 0 1 3 7 z" fill="#e0b050"/><rect x="16.5" y="23" width="11" height="6" rx="1" fill="#e0b050"/>`,
};

const LABELS = {
  portfolio: "Portfolio",
  linkedin: "LinkedIn",
  email: "Email",
  codeforces: "Codeforces",
  leetcode: "LeetCode",
  codechef: "CodeChef",
};

export function button(kind, t) {
  const label = LABELS[kind];
  const W = 38 + label.length * 8.6 + 18;
  const H = 44;
  const accent = kind === "linkedin" ? "#0a66c2" : t.copper;
  const body = `${ICONS[kind](accent)}${text(38, 27, label, { size: 14, fill: t.text, font: MONO, weight: 600 })}`;
  return svg(Math.round(W), H, label, body, t);
}

export const BUTTONS = Object.keys(LABELS);
