import { test } from "node:test";
import assert from "node:assert/strict";
import { createStore, STORAGE_KEY } from "../src/store.js";

// Map-backed stand-in for window.localStorage.
function setup() {
  const map = new Map();
  const storage = {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
  };
  let clock = 1_000;
  let nextId = 1;
  const store = createStore(storage, () => clock++, () => `id-${nextId++}`);
  return { store, storage };
}

function withProject() {
  const ctx = setup();
  const project = ctx.store.addProject("Website");
  return { ...ctx, project };
}

const entry = (projectId, overrides = {}) => ({
  projectId,
  date: "2026-03-10",
  minutes: 90,
  note: "",
  ...overrides,
});

test("starts empty when nothing is stored", () => {
  const { store } = setup();
  assert.deepEqual(store.getData(), { projects: [], entries: [] });
});

test("uses a versioned storage key so old timer data is ignored", () => {
  assert.equal(STORAGE_KEY, "time-tracker.v2");
});

test("addProject trims the name and persists it", () => {
  const { store, storage } = setup();
  const project = store.addProject("  Website  ");
  assert.equal(project.name, "Website");
  assert.ok(storage.getItem(STORAGE_KEY).includes("Website"));
});

test("addProject rejects a blank name", () => {
  const { store } = setup();
  assert.throws(() => store.addProject("   "), /Project name is required/);
});

test("addEntry stores a valid entry against an existing project", () => {
  const { store, project } = withProject();
  const created = store.addEntry(entry(project.id, { note: "  homepage  " }));
  assert.equal(created.minutes, 90);
  assert.equal(created.note, "homepage");
  assert.equal(store.getData().entries.length, 1);
});

test("addEntry requires an existing project", () => {
  const { store } = setup();
  assert.throws(() => store.addEntry(entry("missing")), /Choose a project/);
});

test("addEntry rejects minutes that are not 15-minute steps", () => {
  const { store, project } = withProject();
  assert.throws(() => store.addEntry(entry(project.id, { minutes: 20 })), /15-minute|0\.25/);
  assert.throws(() => store.addEntry(entry(project.id, { minutes: 6 })), /0\.25/);
});

test("addEntry rejects zero, negative, and over-24-hour durations", () => {
  const { store, project } = withProject();
  assert.throws(() => store.addEntry(entry(project.id, { minutes: 0 })));
  assert.throws(() => store.addEntry(entry(project.id, { minutes: -15 })));
  assert.throws(() => store.addEntry(entry(project.id, { minutes: 1455 })));
});

test("addEntry rejects dates that do not exist", () => {
  const { store, project } = withProject();
  assert.throws(() => store.addEntry(entry(project.id, { date: "2026-02-30" })), /valid date/);
  assert.throws(() => store.addEntry(entry(project.id, { date: "10/03/2026" })), /valid date/);
});

test("updateEntry changes only the given fields", () => {
  const { store, project } = withProject();
  const created = store.addEntry(entry(project.id, { note: "old" }));
  const updated = store.updateEntry(created.id, { minutes: 150, note: "new" });
  assert.equal(updated.minutes, 150);
  assert.equal(updated.note, "new");
  assert.equal(updated.date, "2026-03-10");
  assert.equal(updated.createdAt, created.createdAt);
});

test("updateEntry validates the merged result", () => {
  const { store, project } = withProject();
  const created = store.addEntry(entry(project.id));
  assert.throws(() => store.updateEntry(created.id, { minutes: 7 }), /0\.25/);
  assert.throws(() => store.updateEntry(created.id, { date: "2026-13-01" }), /valid date/);
  assert.throws(() => store.updateEntry("nope", { minutes: 15 }), /not found/);
});

test("updateEntry can move an entry to another project", () => {
  const { store, project } = withProject();
  const other = store.addProject("Other");
  const created = store.addEntry(entry(project.id));
  store.updateEntry(created.id, { projectId: other.id });
  assert.equal(store.listEntries(other.id).length, 1);
  assert.equal(store.listEntries(project.id).length, 0);
});

test("addEntry rejects a second entry for the same project and day", () => {
  const { store, project } = withProject();
  store.addEntry(entry(project.id));
  assert.throws(() => store.addEntry(entry(project.id, { minutes: 30 })), /already has an entry/);
  assert.equal(store.getData().entries.length, 1);
});

test("addEntry allows the same day for a different project", () => {
  const { store, project } = withProject();
  const other = store.addProject("Other");
  store.addEntry(entry(project.id));
  store.addEntry(entry(other.id));
  assert.equal(store.getData().entries.length, 2);
});

test("updateEntry rejects moving an entry onto a day that already has one", () => {
  const { store, project } = withProject();
  store.addEntry(entry(project.id, { date: "2026-03-10" }));
  const second = store.addEntry(entry(project.id, { date: "2026-03-11" }));
  assert.throws(() => store.updateEntry(second.id, { date: "2026-03-10" }), /already has an entry/);
  assert.equal(store.getData().entries.find((e) => e.id === second.id).date, "2026-03-11");
});

test("updateEntry allows saving an entry on its own day", () => {
  const { store, project } = withProject();
  const created = store.addEntry(entry(project.id));
  const updated = store.updateEntry(created.id, { date: "2026-03-10", minutes: 120 });
  assert.equal(updated.minutes, 120);
});

test("updateEntry can move an entry to a project-day that is free", () => {
  const { store, project } = withProject();
  const other = store.addProject("Other");
  store.addEntry(entry(other.id));
  const created = store.addEntry(entry(project.id));
  const moved = store.updateEntry(created.id, { projectId: other.id, date: "2026-03-11" });
  assert.equal(moved.date, "2026-03-11");
});

test("findEntry returns the entry for a project and day, or undefined", () => {
  const { store, project } = withProject();
  const created = store.addEntry(entry(project.id));
  assert.equal(store.findEntry(project.id, "2026-03-10").id, created.id);
  assert.equal(store.findEntry(project.id, "2026-03-11"), undefined);
  assert.equal(store.findEntry(project.id, "2026-03-10", created.id), undefined);
});

test("deleteEntry removes only the given entry", () => {
  const { store, project } = withProject();
  const first = store.addEntry(entry(project.id));
  const second = store.addEntry(entry(project.id, { date: "2026-03-11", minutes: 30 }));
  store.deleteEntry(first.id);
  const remaining = store.getData().entries;
  assert.deepEqual(remaining.map((e) => e.id), [second.id]);
});

test("listEntries returns one project's entries, newest date first", () => {
  const { store, project } = withProject();
  const other = store.addProject("Other");
  store.addEntry(entry(project.id, { date: "2026-03-01" }));
  store.addEntry(entry(project.id, { date: "2026-03-09" }));
  store.addEntry(entry(other.id, { date: "2026-03-20" }));
  const dates = store.listEntries(project.id).map((e) => e.date);
  assert.deepEqual(dates, ["2026-03-09", "2026-03-01"]);
});

test("exportData returns the stored data as readable JSON", () => {
  const { store, project } = withProject();
  store.addEntry(entry(project.id));
  const parsed = JSON.parse(store.exportData());
  assert.equal(parsed.projects[0].name, "Website");
  assert.equal(parsed.entries[0].minutes, 90);
});
