# Working notes for Claude

## What this is
A personal time-tracking web app. Static site, no backend, no build step. Data lives in the browser's localStorage.

## Stack and conventions
- Plain HTML, CSS, and ES modules in `src/`. Do not add a framework or bundler without an ADR in `02-strategy/decisions/`.
- No runtime dependencies. Dev tooling is Node's built-in test runner.
- Pure logic goes in `src/store.js` and `src/format.js`, with tests in `tests/`. `app.js` is DOM wiring only.
- `store.js` takes its storage as a parameter so tests can use a fake. Keep it that way.
- Build user-facing text with `textContent`, never `innerHTML`, so names are not parsed as HTML.

## Commands
- `npm test`: run unit tests. Run before reporting any change as done.
- `npm start`: serve `src/` locally on port 3000.

## Product docs
- Requirements are in `03-requirements/`. Update acceptance criteria when behaviour changes.
- Decisions go in `02-strategy/decisions/` as numbered ADRs. Do not silently reverse one; write a new ADR that supersedes it.
- Scope changes go in `02-strategy/mvp-scope.md` first.

## Things not to do without asking
- Do not add authentication, a backend, or a database. These are deliberately deferred.
- Do not create a git remote or push code. Publishing is a separate step.
