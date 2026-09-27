/* One grade across every platform.
 *
 * Each platform is turned into "top X%" of its users: LeetCode reports that
 * directly; Codeforces, CodeChef and GitHub use rough distribution points
 * (log-interpolated between them). The overall figure is the geometric mean,
 * so one great platform can't carry a weak one, and the grade is read off it:
 *
 *   S+  top 1%    S  top 5%    A+  top 10%    A  top 20%
 *   B+  top 35%   B  top 50%   C   the rest
 */

// [value, top %] -- rough, public-knowledge distribution points.
const CF = [[800, 90], [1200, 50], [1400, 30], [1600, 13], [1900, 5], [2100, 2], [2400, 0.6], [3000, 0.05]];
const CC_STARS = { 1: 70, 2: 40, 3: 20, 4: 8, 5: 3, 6: 0.8, 7: 0.1 };
const GH = [[0, 100], [100, 50], [300, 25], [600, 12], [1000, 6], [2000, 2], [5000, 0.5]];

function lerpLog(table, v) {
  if (v <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i += 1) {
    const [x0, y0] = table[i - 1];
    const [x1, y1] = table[i];
    if (v <= x1) {
      const k = (v - x0) / (x1 - x0);
      return Math.exp(Math.log(y0) + k * (Math.log(y1) - Math.log(y0)));
    }
  }
  return table[table.length - 1][1];
}

const GRADES = [[1, "S+"], [5, "S"], [10, "A+"], [20, "A"], [35, "B+"], [50, "B"], [Infinity, "C"]];

export function devScore(data) {
  const parts = [];
  if (data.codeforces) parts.push(["Codeforces", lerpLog(CF, data.codeforces.rating)]);
  if (data.leetcode) parts.push(["LeetCode", data.leetcode.topPercent]);
  if (data.codechef) parts.push(["CodeChef", CC_STARS[data.codechef.stars] ?? 100]);
  if (data.contributions) parts.push(["GitHub", lerpLog(GH, data.contributions.total ?? 0)]);
  if (!parts.length) return null;
  const top = Math.exp(parts.reduce((n, [, p]) => n + Math.log(p), 0) / parts.length);
  const grade = GRADES.find(([limit]) => top <= limit)[1];
  return { top, score: Math.round(100 - top), grade, parts };
}
