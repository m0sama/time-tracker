import { test } from "node:test";
import assert from "node:assert/strict";
import { createStore, INVALID_IMPORT_MESSAGE, NOT_EMPTY_MESSAGE } from "../src/store.js";
import { HANDOFF_PREFIX, NEW_ORIGIN, decodeHandoff, encodeHandoff, handoffUrl, isOldAddress } from "../src/move.js";

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
  };
}

function storeWithData() {
  let id = 1;
  const store = createStore(memoryStorage(), () => 1_000 + id, () => `id-${id++}`);
  const project = store.addProject("Café ☕ project");
  store.addEntry({ projectId: project.id, date: "2026-10-01", minutes: 90, note: "notes / with + symbols" });
  store.addEntry({ projectId: project.id, date: "2026-10-02", minutes: 15 });
  return store;
}

test("isOldAddress is true only for workers.dev", () => {
  assert.equal(isOldAddress("time-tracker.mohamed-osama-795.workers.dev"), true);
  assert.equal(isOldAddress("time.mohamedyoussef.dev"), false);
  assert.equal(isOldAddress("localhost"), false);
});

test("handoff encoding round-trips non-ASCII text and is URL-safe", () => {
  const json = storeWithData().exportData();
  const encoded = encodeHandoff(json);
  assert.match(encoded, /^[A-Za-z0-9_-]+$/);
  assert.equal(decodeHandoff(encoded), json);
  assert.ok(handoffUrl(json).startsWith(`${NEW_ORIGIN}/${HANDOFF_PREFIX}`));
});

test("moving data reproduces the same projects and entries in an empty browser", () => {
  const source = storeWithData();
  const url = handoffUrl(source.exportData());
  const target = createStore(memoryStorage());
  const counts = target.importData(decodeHandoff(url.split(HANDOFF_PREFIX)[1]));
  assert.deepEqual(counts, { projects: 1, entries: 2 });
  assert.deepEqual(target.getData(), source.getData());
});

test("import never overwrites a browser that already has data", () => {
  const target = storeWithData();
  const before = target.getData();
  assert.throws(() => target.importData(storeWithData().exportData()), { message: NOT_EMPTY_MESSAGE });
  assert.deepEqual(target.getData(), before);
});

test("import rejects malformed or inconsistent exports and stores nothing", () => {
  const good = JSON.parse(storeWithData().exportData());
  const bad = [
    "not json",
    "{}",
    JSON.stringify({ ...good, entries: [{ ...good.entries[0], projectId: "missing" }] }),
    JSON.stringify({ ...good, entries: [{ ...good.entries[0], minutes: 7 }] }),
    JSON.stringify({ ...good, entries: [good.entries[0], { ...good.entries[0], id: "other" }] }),
    JSON.stringify({ ...good, projects: [{ ...good.projects[0], name: " " }] }),
  ];
  for (const json of bad) {
    const target = createStore(memoryStorage());
    assert.throws(() => target.importData(json), { message: INVALID_IMPORT_MESSAGE }, json.slice(0, 40));
    assert.deepEqual(target.getData(), { projects: [], entries: [] });
  }
});
