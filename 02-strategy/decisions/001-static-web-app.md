# 001: Static web app with vanilla JavaScript

**Status:** Accepted

## Context
The app is a single-user timer for a personal MVP. It should be fast to build, easy to host for free, and easy to change.

## Decision
Build a static site: plain HTML, CSS, and ES modules, with no framework and no build step. Use Node's built-in test runner for unit tests. There are no runtime dependencies.

## Consequences
- Deployment is uploading a folder. No build server needed.
- Less structure than a framework provides. Keep modules small and pure where possible.
- If the app grows past a few screens, revisit this with a new ADR.
