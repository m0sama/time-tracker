// Pure helpers for hours, dates, calendars, aggregation, and totals.

// Converts an hours value from the form (e.g. 2.25) to whole minutes (135).
// Rounding keeps float noise out; validateEntry in store.js rejects anything off-step.
export function hoursToMinutes(hours) {
  return Math.round(hours * 60);
}

// Shows hours without trailing zeros: 135 -> "2.25 h", 60 -> "1 h".
export function formatHours(minutes) {
  return `${formatHoursShort(minutes)} h`;
}

// Same number without the unit, for tight spaces such as calendar cells: 135 -> "2.25".
export function formatHoursShort(minutes) {
  return String(Number((minutes / 60).toFixed(2)));
}

export function toISODate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Local calendar date as YYYY-MM-DD. `month` is 0-based, as in JavaScript Date.
export function todayISO(date = new Date()) {
  return toISODate(date.getFullYear(), date.getMonth(), date.getDate());
}

export function parseISODate(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month: month - 1, day };
}

export function formatDate(iso) {
  const { year, month, day } = parseISODate(iso);
  return new Date(year, month, day).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatMonth(year, month) {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

// Moves a (year, month) pair forward or back by `delta` months, handling year rollover.
export function shiftMonth(year, month, delta) {
  const index = year * 12 + month + delta;
  return { year: Math.floor(index / 12), month: index % 12 };
}

// Returns weeks (Sunday first) for a month. Each week has 7 slots; slots outside the
// month are null so the grid lines up with weekday headings.
export function buildMonthGrid(year, month) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      iso: toISODate(year, month, i + 1),
    })),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// ---- Aggregation by day, week, or month ----

export const GRANULARITIES = ["day", "week", "month"];

// Key identifying the period an ISO date falls in. Days use the date itself, months use
// YYYY-MM, and weeks use the Monday that starts the week (ISO week convention).
// Works in UTC throughout so daylight-saving changes cannot shift the result.
export function periodKey(iso, granularity) {
  if (granularity === "day") return iso;
  if (granularity === "month") return iso.slice(0, 7);
  const { year, month, day } = parseISODate(iso);
  const mondayFirst = (new Date(Date.UTC(year, month, day)).getUTCDay() + 6) % 7;
  return new Date(Date.UTC(year, month, day - mondayFirst)).toISOString().slice(0, 10);
}

export function periodLabel(key, granularity) {
  if (granularity === "day") return formatDate(key);
  if (granularity === "month") {
    const { year, month } = parseISODate(`${key}-01`);
    return formatMonth(year, month);
  }
  return `Week of ${formatDate(key)}`;
}

// Sums entry minutes per period, newest period first.
export function aggregateEntries(entries, granularity) {
  const buckets = new Map();
  for (const entry of entries) {
    const key = periodKey(entry.date, granularity);
    buckets.set(key, (buckets.get(key) ?? 0) + entry.minutes);
  }
  return [...buckets.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, minutes]) => ({ key, label: periodLabel(key, granularity), minutes }));
}

// Nests entries as month -> week -> day for the collapsible hours tree. Months run newest
// first; weeks and days run earliest first, so an expanded month reads chronologically.
// A week that spans two months appears under each month, with only that month's days.
export function groupByMonthAndWeek(entries) {
  const months = new Map();
  for (const entry of entries) {
    const monthKey = periodKey(entry.date, "month");
    const weekKey = periodKey(entry.date, "week");
    if (!months.has(monthKey)) months.set(monthKey, { key: monthKey, minutes: 0, weeks: new Map() });
    const month = months.get(monthKey);
    month.minutes += entry.minutes;
    if (!month.weeks.has(weekKey)) month.weeks.set(weekKey, { key: weekKey, minutes: 0, days: [] });
    const week = month.weeks.get(weekKey);
    week.minutes += entry.minutes;
    week.days.push(entry);
  }

  const byKeyDesc = (a, b) => b.key.localeCompare(a.key);
  const byKeyAsc = (a, b) => a.key.localeCompare(b.key);
  return [...months.values()].sort(byKeyDesc).map((month) => ({
    key: month.key,
    minutes: month.minutes,
    weeks: [...month.weeks.values()].sort(byKeyAsc).map((week) => ({
      ...week,
      days: week.days.sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt),
    })),
  }));
}

// Total minutes for entries whose date falls in the given month.
export function sumMinutesInMonth(entries, year, month) {
  const prefix = toISODate(year, month, 1).slice(0, 7);
  return entries
    .filter((e) => e.date.startsWith(prefix))
    .reduce((sum, e) => sum + e.minutes, 0);
}

export function totalsByProject(projects, entries) {
  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    minutes: entries
      .filter((e) => e.projectId === project.id)
      .reduce((sum, e) => sum + e.minutes, 0),
  }));
}
