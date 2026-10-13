# Time Tracker

A lightweight, browser-based app for logging time spent on personal projects. It is the first end-to-end test of the loop: idea, product docs, build, test, publish.

## Status

MVP live. See [02-strategy/mvp-scope.md](02-strategy/mvp-scope.md) for what is in and out.

Live app: https://time-tracker.mohamed-osama-795.workers.dev

Entries are stored in each browser on each device, so phone and laptop data are separate. Use the JSON export to move data between them.

## Run locally

Requires Node.js (for the test runner and a local static server).

```bash
npm start        # serves src/ on http://localhost:3000
npm test         # runs the unit tests
```

ES modules need to be served over HTTP, so opening `index.html` directly from disk will not work.

## Project layout

| Folder | Purpose |
|---|---|
| `01-discovery/` | Problem, users, competitors |
| `02-strategy/` | Vision, MVP scope, success metrics, decisions |
| `03-requirements/` | User stories and acceptance criteria |
| `04-design/` | User flows, wireframes, UX copy |
| `src/` | Application code (static HTML, CSS, JavaScript) |
| `tests/` | Automated tests |
| `release/` | Publish checklist, changelog, launch copy |
