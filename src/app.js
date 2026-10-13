import { createStore } from "./store.js";
import {
  aggregateEntries,
  buildMonthGrid,
  formatDate,
  formatHours,
  formatHoursShort,
  formatMonth,
  groupByMonthAndWeek,
  hoursToMinutes,
  parseISODate,
  periodLabel,
  shiftMonth,
  sumMinutesInMonth,
  todayISO,
  totalsByProject,
} from "./format.js";

const store = createStore(window.localStorage);
const $ = (id) => document.getElementById(id);

const VIEW_OPTIONS = ["month", "calendar"];
const VIEW_LABELS = { month: "Month", calendar: "Calendar" };
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// Material Symbols paths (24px grid), used inline so icons never depend on a font loading.
const ICONS = {
  add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  arrow_back: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
  chevron_left: "M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z",
  chevron_right: "M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z",
  chevron_down: "M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z",
  edit: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  delete: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  download: "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z",
};

let pageError = "";
let editingId = null;
let calendarView = { year: 0, month: 0 }; // month shown in the entry form's date picker, 0-based
let view = "month"; // project page view: "month" (collapsible tree) or "calendar"
let hoursCalendarView = null; // month shown in the project's hours calendar, set when first opened
let conflictEntry = null; // existing entry for the chosen project and day, if the form would duplicate it
const openPeriods = new Set(); // expanded month and week keys, e.g. "2026-10" and "2026-10-12"

// Builds an element with plain-text content, so user-entered names are never parsed as HTML.
function el(tag, { text, className, attrs = {} } = {}, children = []) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  node.append(...children);
  return node;
}

// Icon from the ICONS table above. Only constant path strings reach innerHTML.
function icon(name) {
  const span = el("span", { className: "icon" });
  span.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${ICONS[name]}"/></svg>`;
  return span;
}

function currentProjectId() {
  const match = location.hash.match(/^#\/project\/(.+)$/);
  return match ? match[1] : null;
}

function renderHome(data) {
  const totals = totalsByProject(data.projects, data.entries);

  const form = el("form", { className: "add-project", attrs: { id: "project-form" } }, [
    el("div", { className: "outlined-field" }, [
      el("input", {
        attrs: { id: "project-name", name: "name", type: "text", maxlength: "60", required: "", placeholder: " " },
      }),
      el("label", { text: "New project", attrs: { for: "project-name" } }),
    ]),
    el("button", { className: "filled-button", text: "Add project", attrs: { type: "submit" } }),
  ]);

  const list = el(
    "ul",
    { className: "m3-list" },
    totals.map((t) =>
      el("li", {}, [
        el("a", { className: "list-item", attrs: { href: `#/project/${t.id}` } }, [
          el("span", { className: "body-large", text: t.name }),
          el("span", { className: "title-small", text: formatHours(t.minutes) }),
        ]),
      ]),
    ),
  );

  return [
    el("h1", { className: "headline-small", text: "Projects" }),
    form,
    ...(data.projects.length === 0
      ? [el("p", { className: "empty body-medium", text: "No projects yet. Add one above." })]
      : [list]),
    el("div", { className: "section-action" }, [
      el("button", {
        className: "outlined-button",
        attrs: { type: "button", id: "export" },
        text: "Export data (JSON)",
      }),
    ]),
  ];
}

function exportJson() {
  const blob = new Blob([store.exportData()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = el("a", { attrs: { href: url, download: `time-tracker-${todayISO()}.json` } });
  link.click();
  URL.revokeObjectURL(url);
}

// ---- Month view: months > weeks > days, each level collapsible ----

// Toggle rows show a chevron and aria-expanded, so the state is clear to screen readers.
function toggleRow(key, label, minutes, level) {
  const expanded = openPeriods.has(key);
  return el(
    "button",
    {
      className: `list-item toggle level-${level}`,
      attrs: { type: "button", "data-toggle": key, "aria-expanded": String(expanded) },
    },
    [
      el("span", { className: "toggle-label" }, [
        icon(expanded ? "chevron_down" : "chevron_right"),
        el("span", { className: level === 1 ? "title-medium" : "body-large", text: label }),
      ]),
      el("span", { className: "title-small", text: formatHours(minutes) }),
    ],
  );
}

function dayRow(entry) {
  return el("li", { className: "day-row" }, [
    el("div", { className: "day-row-text" }, [
      el("span", { className: "body-large", text: formatDate(entry.date) }),
      ...(entry.note ? [el("span", { className: "body-medium variant", text: entry.note })] : []),
    ]),
    el("span", { className: "title-small", text: formatHours(entry.minutes) }),
    el("button", {
      className: "icon-button",
      attrs: { type: "button", "data-edit-id": entry.id, "aria-label": `Edit entry for ${formatDate(entry.date)}` },
    }, [icon("edit")]),
    el("button", {
      className: "icon-button danger",
      attrs: { type: "button", "data-delete-id": entry.id, "aria-label": `Delete entry for ${formatDate(entry.date)}` },
    }, [icon("delete")]),
  ]);
}

function renderMonthTree(entries) {
  const tree = groupByMonthAndWeek(entries);
  if (tree.length === 0) {
    return [el("p", { className: "empty body-medium", text: "No hours logged yet." })];
  }

  return [
    el(
      "ul",
      { className: "m3-list tree" },
      tree.map((month) => {
        const monthOpen = openPeriods.has(month.key);
        return el("li", {}, [
          toggleRow(month.key, formatMonth(...monthParts(month.key)), month.minutes, 1),
          ...(monthOpen
            ? [
                el(
                  "ul",
                  { className: "tree-children" },
                  month.weeks.map((week) => {
                    const weekOpen = openPeriods.has(week.key);
                    return el("li", {}, [
                      toggleRow(week.key, periodLabel(week.key, "week"), week.minutes, 2),
                      ...(weekOpen
                        ? [el("ul", { className: "tree-children days" }, week.days.map(dayRow))]
                        : []),
                    ]);
                  }),
                ),
              ]
            : []),
        ]);
      }),
    ),
  ];
}

// "2026-10" -> [2026, 9] for formatMonth, which takes a 0-based month.
function monthParts(key) {
  const { year, month } = parseISODate(`${key}-01`);
  return [year, month];
}

// ---- Calendar view ----

// Shading level for a day in the hours calendar: light, medium, or heavy.
function hoursLevelClass(minutes) {
  if (minutes < 240) return "lvl-1";
  if (minutes < 480) return "lvl-2";
  return "lvl-3";
}

// Each cell keeps the same layout whether or not it has hours: the day number stays at
// the top, and the hours chip sits at the bottom in a fixed-height row.
function renderHoursCalendar(entries) {
  const { year, month } = hoursCalendarView;
  const byDay = new Map(aggregateEntries(entries, "day").map((b) => [b.key, b.minutes]));
  const today = todayISO();

  const cells = buildMonthGrid(year, month).flat().map((cell) => {
    if (!cell) return el("span", { className: "hours-cell blank" });
    const minutes = byDay.get(cell.iso) ?? 0;
    const classes = ["hours-cell"];
    if (minutes) classes.push(hoursLevelClass(minutes));
    if (cell.iso === today) classes.push("today");
    return el(
      "button",
      {
        className: classes.join(" "),
        attrs: {
          type: "button",
          "data-day": cell.iso,
          "aria-label": `${formatDate(cell.iso)}: ${minutes ? formatHours(minutes) : "no hours"}`,
        },
      },
      [
        el("span", { className: "cell-day", text: String(cell.day) }),
        el("span", {
          className: minutes ? "cell-hours has-hours" : "cell-hours",
          text: minutes ? formatHoursShort(minutes) : "",
        }),
      ],
    );
  });

  return [
    el("div", { className: "calendar-header" }, [
      el("button", {
        className: "icon-button",
        attrs: { type: "button", "aria-label": "Previous month", "data-hours-nav": "-1" },
      }, [icon("chevron_left")]),
      el("strong", { className: "title-medium", text: formatMonth(year, month) }),
      el("button", {
        className: "icon-button",
        attrs: { type: "button", "aria-label": "Next month", "data-hours-nav": "1" },
      }, [icon("chevron_right")]),
    ]),
    el("p", {
      className: "label-large variant center",
      text: `${formatHours(sumMinutesInMonth(entries, year, month))} this month`,
    }),
    el("div", { className: "calendar-weekdays", attrs: { "aria-hidden": "true" } }, WEEKDAYS.map((d) => el("span", { text: d }))),
    el("div", { className: "calendar-grid hours-grid" }, cells),
  ];
}

// ---- Project page ----

function renderProject(data, projectId) {
  const project = data.projects.find((p) => p.id === projectId);
  const back = el("a", { className: "text-button back-link", attrs: { href: "#/" } }, [
    icon("arrow_back"),
    el("span", { text: "Projects" }),
  ]);
  if (!project) return [back, el("p", { className: "body-medium", text: "Project not found." })];

  const entries = store.listEntries(projectId);
  const total = entries.reduce((sum, e) => sum + e.minutes, 0);

  const switcher = el(
    "div",
    { className: "segmented", attrs: { role: "group", "aria-label": "Show hours as" } },
    VIEW_OPTIONS.map((option) =>
      el("button", {
        className: option === view ? "active" : "",
        text: VIEW_LABELS[option],
        attrs: { type: "button", "data-view": option, "aria-pressed": String(option === view) },
      }),
    ),
  );

  const hoursSection = view === "calendar" ? renderHoursCalendar(entries) : renderMonthTree(entries);

  return [
    back,
    el("h1", { className: "headline-small", text: project.name }),
    el("div", { className: "summary-card" }, [
      el("span", { className: "label-medium variant", text: "Total logged" }),
      el("span", { className: "display-small", text: formatHours(total) }),
    ]),

    el("h2", { className: "title-medium", text: "Hours" }),
    switcher,
    ...hoursSection,
  ];
}

function render() {
  const data = store.getData();
  const projectId = currentProjectId();
  const content = projectId ? renderProject(data, projectId) : renderHome(data);
  if (pageError) content.unshift(el("p", { className: "error-text", text: pageError, attrs: { role: "alert" } }));
  $("view").replaceChildren(...content);
}

// ---- Date field and calendar in the entry form ----

// An empty iso leaves the date unset, showing a placeholder until one is picked.
function setDate(iso) {
  $("entry-date").value = iso;
  const button = $("entry-date-button");
  button.textContent = iso ? formatDate(iso) : "Select a date";
  button.classList.toggle("placeholder", !iso);
  refreshConflict();
}

function setCalendarOpen(open) {
  $("calendar").hidden = !open;
  $("entry-date-button").setAttribute("aria-expanded", String(open));
}

function renderCalendar() {
  const { year, month } = calendarView;
  const selected = $("entry-date").value;
  const today = todayISO();

  $("cal-title").textContent = formatMonth(year, month);

  const cells = buildMonthGrid(year, month).flat().map((cell) => {
    if (!cell) return el("span", { className: "day blank" });
    const classes = ["day"];
    if (cell.iso === selected) classes.push("selected");
    if (cell.iso === today) classes.push("today");
    return el("button", {
      className: classes.join(" "),
      text: String(cell.day),
      attrs: {
        type: "button",
        "data-date": cell.iso,
        "aria-label": formatDate(cell.iso),
        "aria-pressed": String(cell.iso === selected),
      },
    });
  });
  $("cal-grid").replaceChildren(...cells);
}

function openCalendarAt(iso) {
  const { year, month } = parseISODate(iso);
  calendarView = { year, month };
  renderCalendar();
  setCalendarOpen(true);
}

// If the chosen project and day already have an entry, say so, link to it, and block Save.
// The entry being edited is excluded, so it can keep its own day.
function refreshConflict() {
  const projectId = $("entry-project").value;
  const date = $("entry-date").value;
  conflictEntry = projectId && date ? store.findEntry(projectId, date, editingId) ?? null : null;

  $("entry-conflict").hidden = !conflictEntry;
  $("entry-save").disabled = Boolean(conflictEntry);
  if (conflictEntry) $("conflict-hours").textContent = formatHours(conflictEntry.minutes);
}

$("entry-project").addEventListener("change", refreshConflict);

$("entry-conflict-edit").addEventListener("click", () => {
  if (conflictEntry) openEntryDialog({ entry: conflictEntry });
});

$("entry-date-button").addEventListener("click", () => {
  if (!$("calendar").hidden) {
    setCalendarOpen(false);
    return;
  }
  openCalendarAt($("entry-date").value || todayISO());
});

$("cal-prev").addEventListener("click", () => {
  const { year, month } = calendarView;
  calendarView = shiftMonth(year, month, -1);
  renderCalendar();
});

$("cal-next").addEventListener("click", () => {
  const { year, month } = calendarView;
  calendarView = shiftMonth(year, month, 1);
  renderCalendar();
});

$("cal-grid").addEventListener("click", (event) => {
  const day = event.target.closest("[data-date]");
  if (!day) return;
  setDate(day.dataset.date);
  setCalendarOpen(false);
});

// ---- Entry dialog ----

function openEntryDialog({ entry = null, projectId = null, date = null } = {}) {
  const data = store.getData();
  if (data.projects.length === 0) {
    pageError = "Create a project first.";
    render();
    return;
  }

  editingId = entry?.id ?? null;
  $("entry-title").textContent = entry ? "Edit work entry" : "Add work entry";

  const select = $("entry-project");
  select.replaceChildren(...data.projects.map((p) => new Option(p.name, p.id)));
  select.value = entry?.projectId ?? projectId ?? data.projects[0].id;

  setDate(entry?.date ?? date ?? "");
  setCalendarOpen(false);
  $("entry-hours").value = entry ? entry.minutes / 60 : "";
  $("entry-note").value = entry?.note ?? "";
  $("entry-delete").hidden = !entry;
  $("entry-error").textContent = "";
  $("entry-dialog").showModal();
}

// Clicking a day opens its existing entry if there is one, otherwise a new entry for that date.
// If a day has several entries, the first one (most recently created) opens.
function openDay(projectId, iso) {
  const existing = store.listEntries(projectId).find((e) => e.date === iso);
  if (existing) openEntryDialog({ entry: existing });
  else openEntryDialog({ projectId, date: iso });
}

// In-app confirmation, styled like the rest of the app. Resolves true only on confirm.
function confirmAction({ title, message, confirmLabel }) {
  const dialog = $("confirm-dialog");
  $("confirm-title").textContent = title;
  $("confirm-message").textContent = message;
  $("confirm-ok").textContent = confirmLabel;

  return new Promise((resolve) => {
    const finish = () => {
      dialog.removeEventListener("close", finish);
      resolve(dialog.returnValue === "confirm");
    };
    dialog.addEventListener("close", finish);
    dialog.returnValue = "";
    dialog.showModal();
  });
}

async function deleteEntryById(id) {
  const entry = store.getData().entries.find((e) => e.id === id);
  if (!entry) return;
  const ok = await confirmAction({
    title: "Delete entry?",
    message: `The ${formatHours(entry.minutes)} entry for ${formatDate(entry.date)} will be removed.`,
    confirmLabel: "Delete",
  });
  if (!ok) return;
  store.deleteEntry(id);
  render();
}

$("confirm-ok").addEventListener("click", () => $("confirm-dialog").close("confirm"));
$("confirm-cancel").addEventListener("click", () => $("confirm-dialog").close(""));
$("confirm-dialog").addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  event.preventDefault();
  $("confirm-dialog").close("");
});

// Hours stepper: 15-minute steps, kept within the allowed 0.25 to 24 range.
function stepHours(delta) {
  const input = $("entry-hours");
  const current = Number(input.value) || 0;
  const next = Math.round((current + delta) * 4) / 4;
  input.value = Math.min(24, Math.max(0.25, next));
}

$("hours-minus").addEventListener("click", () => stepHours(-0.25));
$("hours-plus").addEventListener("click", () => stepHours(0.25));

// Clicks inside the view are delegated from the container, since its content is re-rendered.
$("view").addEventListener("click", (event) => {
  if (event.target.closest("#export")) {
    exportJson();
    return;
  }

  const toggle = event.target.closest("[data-toggle]");
  if (toggle) {
    const key = toggle.dataset.toggle;
    if (openPeriods.has(key)) openPeriods.delete(key);
    else openPeriods.add(key);
    render();
    return;
  }

  const editButton = event.target.closest("[data-edit-id]");
  if (editButton) {
    const entry = store.getData().entries.find((e) => e.id === editButton.dataset.editId);
    if (entry) openEntryDialog({ entry });
    return;
  }

  const deleteButton = event.target.closest("[data-delete-id]");
  if (deleteButton) {
    deleteEntryById(deleteButton.dataset.deleteId);
    return;
  }

  const hoursNav = event.target.closest("[data-hours-nav]");
  if (hoursNav && hoursCalendarView) {
    const { year, month } = hoursCalendarView;
    hoursCalendarView = shiftMonth(year, month, Number(hoursNav.dataset.hoursNav));
    render();
    return;
  }

  const day = event.target.closest("[data-day]");
  if (day) {
    openDay(currentProjectId(), day.dataset.day);
    return;
  }

  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    view = viewButton.dataset.view;
    if (view === "calendar" && !hoursCalendarView) {
      const today = parseISODate(todayISO());
      hoursCalendarView = { year: today.year, month: today.month };
    }
    render();
  }
});

$("view").addEventListener("submit", (event) => {
  if (event.target.id !== "project-form") return;
  event.preventDefault();
  const input = $("project-name");
  try {
    pageError = "";
    store.addProject(input.value);
  } catch (err) {
    pageError = err.message;
  }
  render();
});

$("fab").addEventListener("click", () => openEntryDialog({ projectId: currentProjectId() }));

$("entry-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (!$("entry-date").value) {
    $("entry-error").textContent = "Choose a date";
    return;
  }
  const fields = {
    projectId: $("entry-project").value,
    date: $("entry-date").value,
    minutes: hoursToMinutes(Number($("entry-hours").value)),
    note: $("entry-note").value,
  };
  try {
    if (editingId) store.updateEntry(editingId, fields);
    else store.addEntry(fields);
  } catch (err) {
    $("entry-error").textContent = err.message;
    return;
  }
  $("entry-dialog").close();
  render();
});

$("entry-delete").addEventListener("click", async () => {
  if (!editingId) return;
  const entry = store.getData().entries.find((e) => e.id === editingId);
  if (!entry) return;
  const ok = await confirmAction({
    title: "Delete entry?",
    message: `The ${formatHours(entry.minutes)} entry for ${formatDate(entry.date)} will be removed.`,
    confirmLabel: "Delete",
  });
  if (!ok) return;
  store.deleteEntry(editingId);
  $("entry-dialog").close();
  render();
});

$("entry-cancel").addEventListener("click", () => $("entry-dialog").close());

// Escape closes the innermost open layer first: the date calendar, then the dialog.
$("entry-dialog").addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  event.preventDefault();
  if (!$("calendar").hidden) setCalendarOpen(false);
  else $("entry-dialog").close();
});

$("entry-dialog").addEventListener("close", () => {
  editingId = null;
  setCalendarOpen(false);
});

window.addEventListener("hashchange", () => {
  pageError = "";
  render();
});

render();
