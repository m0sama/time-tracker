# 002: Browser localStorage, no backend, no auth for the MVP

**Status:** Accepted

## Context
The first version only needs to prove the loop. Adding accounts and a database would add setup, hosting cost, and security work before any value is delivered.

## Decision
Persist all data in `window.localStorage` under one key. No accounts, no login, no server. Provide a JSON export as the manual backup.

## Consequences
- Each device and browser keeps its own data. Entries do not sync between devices.
- Clearing site data in the browser erases entries. Export regularly.
- Adding login and sync later means a new ADR. The `store.js` interface is the seam for that change.
