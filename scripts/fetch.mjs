/* Live data for the profile, from public endpoints only -- no tokens needed.
 *
 *   Codeforces   official API (user.info, user.rating)
 *   LeetCode     the public GraphQL endpoint the site itself uses
 *   CodeChef     no API exists; the public profile page is read
 *   GitHub       the public contributions calendar and events feed
 *
 * Each source is fetched independently. If one fails (a site is down,
 * Cloudflare says no), the last good value is kept from the previous run's
 * data.json instead of the profile showing an error or a zero.
 */

const UA = { "User-Agent": "Mozilla/5.0 (profile-generator; +https://github.com/Sudhss/Sudhss)" };

async function getJSON(url, init = {}) {
  const res = await fetch(url, { ...init, headers: { ...UA, ...(init.headers || {}) }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

async function getText(url) {
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.text();
}

export async function codeforces(handle) {
  const info = await getJSON(`https://codeforces.com/api/user.info?handles=${handle}`);
  const hist = await getJSON(`https://codeforces.com/api/user.rating?handle=${handle}`);
  const u = info.result[0];
  return {
    handle: u.handle,
    rating: u.rating,
    maxRating: u.maxRating,
    rank: u.rank,
    maxRank: u.maxRank,
    history: hist.result.map((r) => ({ t: r.ratingUpdateTimeSeconds, r: r.newRating, contest: r.contestName })),
  };
}

export async function leetcode(user) {
  const query = `query($u:String!){
    userContestRanking(username:$u){ rating attendedContestsCount globalRanking topPercentage badge{name} }
    matchedUser(username:$u){ submitStatsGlobal{ acSubmissionNum{ difficulty count } } }
  }`;
  const d = await getJSON("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Referer: "https://leetcode.com" },
    body: JSON.stringify({ query, variables: { u: user } }),
  });
  const r = d.data.userContestRanking;
  const solved = Object.fromEntries(d.data.matchedUser.submitStatsGlobal.acSubmissionNum.map((x) => [x.difficulty.toLowerCase(), x.count]));
  return {
    handle: user,
    rating: Math.round(r.rating),
    contests: r.attendedContestsCount,
    globalRank: r.globalRanking,
    topPercent: r.topPercentage,
    badge: r.badge?.name || null,
    solved,
  };
}

export async function codechef(user) {
  const html = await getText(`https://www.codechef.com/users/${user}`);
  const num = (re) => {
    const m = html.match(re);
    return m ? Number(m[1].replace(/,/g, "")) : null;
  };
  const starBlock = html.match(/class="rating-star">([\s\S]*?)<\/div>/);
  const stars = starBlock ? (starBlock[1].match(/&#9733;|★/g) || []).length : null;
  const out = {
    handle: user,
    rating: num(/rating-number">\s*(\d+)/),
    maxRating: num(/Highest Rating\s*(\d+)/),
    stars,
    contests: num(/Contests \((\d+)\)/),
    solved: num(/Total Problems Solved:\s*(\d+)/),
  };
  if (!out.rating || !out.stars) throw new Error("codechef: profile layout changed");
  return out;
}

export async function contributions(user) {
  const html = await getText(`https://github.com/users/${user}/contributions`);
  const days = [...html.matchAll(/data-date="([\d-]+)"[^>]*?id="([^"]+)"[^>]*?data-level="(\d)"/g)].map((m) => ({ date: m[1], id: m[2], level: Number(m[3]) }));
  const counts = new Map();
  for (const m of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]+)<\/tool-tip>/g)) {
    const n = m[2].match(/^(\d+)/);
    counts.set(m[1], n ? Number(n[1]) : 0);
  }
  const total = html.match(/([\d,]+)\s+contributions\s+in the last year/);
  if (!days.length) throw new Error("contributions: calendar layout changed");
  return {
    total: total ? Number(total[1].replace(/,/g, "")) : null,
    days: days.map((d) => ({ date: d.date, level: d.level, count: counts.get(d.id) ?? 0 })).sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export async function activity(user) {
  const events = await getJSON(`https://api.github.com/users/${user}/events/public?per_page=100`);
  const seen = new Set();
  const recent = [];
  for (const e of events) {
    if (e.type !== "PushEvent" && e.type !== "CreateEvent" && e.type !== "PullRequestEvent") continue;
    const repo = e.repo.name;
    if (seen.has(repo)) continue;
    seen.add(repo);
    recent.push({ repo, at: e.created_at, type: e.type });
    if (recent.length === 4) break;
  }
  return recent;
}

/** Fetch everything; fall back per source to the previous run's values. */
export async function fetchAll(cfg, previous = {}) {
  const tasks = {
    codeforces: () => codeforces(cfg.handles.codeforces),
    leetcode: () => leetcode(cfg.handles.leetcode),
    codechef: () => codechef(cfg.handles.codechef),
    contributions: () => contributions(cfg.github),
    activity: () => activity(cfg.github),
  };
  const data = { generatedAt: new Date().toISOString(), stale: [] };
  await Promise.all(
    Object.entries(tasks).map(async ([key, run]) => {
      try {
        data[key] = await run();
      } catch (error) {
        console.warn(`! ${key}: ${error.message} -- keeping the last good value`);
        data[key] = previous[key] ?? null;
        data.stale.push(key);
      }
    })
  );
  return data;
}
