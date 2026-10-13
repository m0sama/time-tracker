// Data access for projects and manual work entries, persisted as one JSON blob.
// Takes a storage object (window.localStorage in the app, a Map-backed fake in tests).

export const STORAGE_KEY = "time-tracker.v2";

export const STEP_MINUTES = 15;
const MAX_MINUTES = 24 * 60;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const DUPLICATE_DAY_MESSAGE =
  "This project already has an entry for that day. Edit that entry instead.";

const EMPTY = { projects: [], entries: [] };

export function isRealDate(value) {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function validateEntry({ date, minutes }) {
  if (!isRealDate(date)) throw new Error("Choose a valid date");
  const validMinutes =
    Number.isInteger(minutes) &&
    minutes > 0 &&
    minutes <= MAX_MINUTES &&
    minutes % STEP_MINUTES === 0;
  if (!validMinutes) throw new Error("Hours must be between 0.25 and 24, in 0.25 steps");
}

export function createStore(storage, now = () => Date.now(), makeId = () => crypto.randomUUID()) {
  function getData() {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(EMPTY);
    const data = JSON.parse(raw);
    return { projects: data.projects ?? [], entries: data.entries ?? [] };
  }

  function save(data) {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function assertProject(data, projectId) {
    if (!data.projects.some((p) => p.id === projectId)) throw new Error("Choose a project");
  }

  // One entry per project per day. `ignoreId` lets an entry keep its own day when edited.
  function findEntry(projectId, date, ignoreId = null) {
    return getData().entries.find(
      (e) => e.projectId === projectId && e.date === date && e.id !== ignoreId,
    );
  }

  function addProject(name) {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Project name is required");
    const data = getData();
    const project = { id: makeId(), name: trimmed, createdAt: now() };
    data.projects.push(project);
    save(data);
    return project;
  }

  function addEntry({ projectId, date, minutes, note = "" }) {
    const data = getData();
    assertProject(data, projectId);
    validateEntry({ date, minutes });
    if (data.entries.some((e) => e.projectId === projectId && e.date === date)) {
      throw new Error(DUPLICATE_DAY_MESSAGE);
    }
    const entry = { id: makeId(), projectId, date, minutes, note: note.trim(), createdAt: now() };
    data.entries.push(entry);
    save(data);
    return entry;
  }

  // Only the fields listed here can change; id and createdAt are fixed.
  function updateEntry(id, changes) {
    const data = getData();
    const existing = data.entries.find((e) => e.id === id);
    if (!existing) throw new Error("Entry not found");
    const next = {
      ...existing,
      projectId: changes.projectId ?? existing.projectId,
      date: changes.date ?? existing.date,
      minutes: changes.minutes ?? existing.minutes,
      note: (changes.note ?? existing.note).trim(),
    };
    assertProject(data, next.projectId);
    validateEntry(next);
    const clash = data.entries.some(
      (e) => e.id !== id && e.projectId === next.projectId && e.date === next.date,
    );
    if (clash) throw new Error(DUPLICATE_DAY_MESSAGE);
    data.entries = data.entries.map((e) => (e.id === id ? next : e));
    save(data);
    return next;
  }

  function deleteEntry(id) {
    const data = getData();
    data.entries = data.entries.filter((e) => e.id !== id);
    save(data);
  }

  // Newest date first; ties broken by when the entry was created.
  function listEntries(projectId) {
    return getData()
      .entries.filter((e) => e.projectId === projectId)
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  }

  function exportData() {
    return JSON.stringify(getData(), null, 2);
  }

  return {
    getData,
    findEntry,
    addProject,
    addEntry,
    updateEntry,
    deleteEntry,
    listEntries,
    exportData,
  };
}
