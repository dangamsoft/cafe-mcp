/**
 * Birthplace clock time → local mean solar time (1.0.4).
 * Wall clock in an IANA zone (daylight saving and historical offsets from Node's Intl data) → UTC → + longitude × 4 min.
 * The backend is then told option4=false: take the time as is, no Korea-meridian correction.
 * Same algorithm as SajuGraph (lib/sg/localtime.ts).
 */
const dtfCache = new Map();
function dtf(tz) {
  let f = dtfCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    dtfCache.set(tz, f);
  }
  return f;
}

export function isValidTimeZone(tz) {
  try { dtf(tz); return true; } catch { return false; }
}

/** Offset of `tz` at `utcMs`, minutes east of UTC. */
export function zoneOffsetMin(tz, utcMs) {
  const p = {};
  for (const x of dtf(tz).formatToParts(new Date(utcMs))) if (x.type !== "literal") p[x.type] = Number(x.value);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour === 24 ? 0 : p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(utcMs / 1000) * 1000) / 60000);
}

const pad = (n) => String(n).padStart(2, "0");
export function fmtCompact(ms) {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`;
}

/** b = 'YYYYMMDDHHmm' wall clock in tz; lng degrees east (+) / west (-). */
export function toLocalMeanTime(b, tz, lng) {
  const y = +b.slice(0, 4), mo = +b.slice(4, 6), d = +b.slice(6, 8), h = +b.slice(8, 10), mi = +b.slice(10, 12);
  const wall = Date.UTC(y, mo - 1, d, h, mi);
  const o1 = zoneOffsetMin(tz, wall - 12 * 3600_000);
  const o2 = zoneOffsetMin(tz, wall + 12 * 3600_000);
  const cands = [...new Set([o1, o2])].map((o) => ({ o, utc: wall - o * 60000 })).filter(({ o, utc }) => zoneOffsetMin(tz, utc) === o);
  let utcMs, offsetMin, gap = false, ambiguous = false;
  if (!cands.length) { gap = true; offsetMin = Math.max(o1, o2); utcMs = wall - Math.min(o1, o2) * 60000; }
  else { if (cands.length > 1) ambiguous = true; const pick = cands.sort((a, b2) => b2.o - a.o)[0]; offsetMin = pick.o; utcMs = pick.utc; }
  const std = Math.min(zoneOffsetMin(tz, Date.UTC(y, 0, 15)), zoneOffsetMin(tz, Date.UTC(y, 6, 15)));
  const lmtMs = utcMs + Math.round(lng * 4 * 60000);
  return { utcMs, offsetMin, dst: offsetMin > std, gap, ambiguous, lmt: fmtCompact(lmtMs), lmtShiftMin: Math.round((lmtMs - wall) / 60000) };
}

export function fmtOffset(min) {
  const s = min < 0 ? "-" : "+"; const a = Math.abs(min);
  return `UTC${s}${Math.floor(a / 60)}${a % 60 ? ":" + pad(a % 60) : ""}`;
}
