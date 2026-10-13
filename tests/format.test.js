import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aggregateEntries,
  buildMonthGrid,
  formatHours,
  formatHoursShort,
  groupByMonthAndWeek,
  hoursToMinutes,
  parseISODate,
  periodKey,
  shiftMonth,
  sumMinutesInMonth,
  todayISO,
  totalsByProject,
} from "../src/format.js";

test("hoursToMinutes converts quarter-hour steps exactly", () => {
  assert.equal(hoursToMinutes(0.25), 15);
  assert.equal(hoursToMinutes(2.25), 135);
  assert.equal(hoursToMinutes(24), 1440);
});

test("formatHours drops trailing zeros", () => {
  assert.equal(formatHours(0), "0 h");
  assert.equal(formatHours(60), "1 h");
  assert.equal(formatHours(135), "2.25 h");
  assert.equal(formatHours(90), "1.5 h");
});

test("formatHoursShort omits the unit for calendar cells", () => {
  assert.equal(formatHoursShort(135), "2.25");
  assert.equal(formatHoursShort(60), "1");
});

test("todayISO uses the local calendar date with zero padding", () => {
  assert.equal(todayISO(new Date(2026, 0, 5, 23, 30)), "2026-01-05");
  assert.equal(todayISO(new Date(2026, 11, 31)), "2026-12-31");
});

test("parseISODate returns 0-based months", () => {
  assert.deepEqual(parseISODate("2026-03-09"), { year: 2026, month: 2, day: 9 });
});

test("shiftMonth moves forward and back across year boundaries", () => {
  assert.deepEqual(shiftMonth(2026, 0, -1), { year: 2025, month: 11 });
  assert.deepEqual(shiftMonth(2026, 11, 1), { year: 2027, month: 0 });
  assert.deepEqual(shiftMonth(2026, 4, 3), { year: 2026, month: 7 });
});

test("buildMonthGrid pads weeks to 7 slots and starts on the right weekday", () => {
  // January 2026 starts on a Thursday (index 4) and has 31 days.
  const weeks = buildMonthGrid(2026, 0);
  assert.ok(weeks.every((week) => week.length === 7));
  const cells = weeks.flat();
  assert.equal(cells.slice(0, 4).every((c) => c === null), true);
  assert.deepEqual(cells[4], { day: 1, iso: "2026-01-01" });
  assert.equal(cells.filter((c) => c !== null).length, 31);
  assert.deepEqual(cells.filter((c) => c !== null).at(-1), { day: 31, iso: "2026-01-31" });
});

test("buildMonthGrid handles a month that starts on Sunday with 28 days", () => {
  // February 2026 starts on a Sunday and has 28 days: exactly four full weeks.
  const weeks = buildMonthGrid(2026, 1);
  assert.equal(weeks.length, 4);
  assert.deepEqual(weeks[0][0], { day: 1, iso: "2026-02-01" });
});

test("periodKey for days returns the date itself", () => {
  assert.equal(periodKey("2026-10-13", "day"), "2026-10-13");
});

test("periodKey for months returns YYYY-MM", () => {
  assert.equal(periodKey("2026-03-09", "month"), "2026-03");
});

test("periodKey for weeks returns the Monday that starts the week", () => {
  assert.equal(periodKey("2026-10-12", "week"), "2026-10-12"); // Monday itself
  assert.equal(periodKey("2026-10-13", "week"), "2026-10-12"); // Tuesday
  assert.equal(periodKey("2026-10-18", "week"), "2026-10-12"); // Sunday ends the week
  assert.equal(periodKey("2027-01-01", "week"), "2026-12-28"); // crosses a year boundary
});

test("aggregateEntries sums minutes per period, newest first", () => {
  const entries = [
    { date: "2026-10-12", minutes: 60 },
    { date: "2026-10-13", minutes: 30 },
    { date: "2026-10-19", minutes: 15 },
  ];

  const byDay = aggregateEntries(entries, "day");
  assert.deepEqual(
    byDay.map((b) => [b.key, b.minutes]),
    [
      ["2026-10-19", 15],
      ["2026-10-13", 30],
      ["2026-10-12", 60],
    ],
  );

  const byWeek = aggregateEntries(entries, "week");
  assert.deepEqual(
    byWeek.map((b) => [b.key, b.minutes]),
    [
      ["2026-10-19", 15],
      ["2026-10-12", 90],
    ],
  );

  const byMonth = aggregateEntries(entries, "month");
  assert.deepEqual(byMonth.map((b) => [b.key, b.minutes]), [["2026-10", 105]]);
});

test("groupByMonthAndWeek nests months, weeks, and days newest first with sums", () => {
  const entries = [
    { date: "2026-10-12", minutes: 60, createdAt: 1 },
    { date: "2026-10-14", minutes: 30, createdAt: 2 },
    { date: "2026-10-19", minutes: 15, createdAt: 3 },
    { date: "2026-09-30", minutes: 120, createdAt: 4 },
  ];
  const tree = groupByMonthAndWeek(entries);

  assert.deepEqual(tree.map((m) => [m.key, m.minutes]), [
    ["2026-10", 105],
    ["2026-09", 120],
  ]);
  assert.deepEqual(tree[0].weeks.map((w) => [w.key, w.minutes]), [
    ["2026-10-12", 90],
    ["2026-10-19", 15],
  ]);
  assert.deepEqual(tree[0].weeks[0].days.map((d) => d.date), ["2026-10-12", "2026-10-14"]);
  assert.equal(tree[1].weeks[0].days[0].date, "2026-09-30");
});

test("groupByMonthAndWeek returns an empty tree for no entries", () => {
  assert.deepEqual(groupByMonthAndWeek([]), []);
});

test("sumMinutesInMonth counts only entries in that month", () => {
  const entries = [
    { date: "2026-03-01", minutes: 60 },
    { date: "2026-03-31", minutes: 30 },
    { date: "2026-04-01", minutes: 999 },
    { date: "2025-03-15", minutes: 999 },
  ];
  assert.equal(sumMinutesInMonth(entries, 2026, 2), 90);
  assert.equal(sumMinutesInMonth(entries, 2026, 0), 0);
});

test("totalsByProject sums entry minutes per project", () => {
  const projects = [
    { id: "a", name: "Alpha" },
    { id: "b", name: "Beta" },
  ];
  const entries = [
    { projectId: "a", minutes: 60 },
    { projectId: "a", minutes: 15 },
    { projectId: "b", minutes: 30 },
  ];
  assert.deepEqual(totalsByProject(projects, entries), [
    { id: "a", name: "Alpha", minutes: 75 },
    { id: "b", name: "Beta", minutes: 30 },
  ]);
});
