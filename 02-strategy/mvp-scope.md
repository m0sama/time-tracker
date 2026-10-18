# MVP scope

## In scope (v1)
- Create projects by name.
- Open a project to see its work entries and total hours.
- Add a work entry manually: project, date, hours, optional note.
- Hours are entered in 0.25 (15-minute) steps, from 0.25 to 24.
- Edit and delete work entries.
- A large + button adds an entry. On a project page it pre-selects that project.
- Total hours per project on the home page.
- Export all data as a JSON file.
- Responsive layout that works on phones.
- Data persists in the browser between visits.
- Served at time.mohamedyoussef.dev, with a one-tap move of existing data from the old workers.dev address ([006](decisions/006-custom-domain-and-data-move.md)).

## Out of scope (deliberately deferred)
- Live timer or start and stop tracking. The app records hours you enter, not clock time.
- Authentication, accounts, social login.
- Sync across devices or a backend database.
- Renaming or deleting projects. Not needed yet.
- Reports, charts, date-range filters, CSV export.
- General import from a JSON file. (A one-time move from the old address is in scope; see [006](decisions/006-custom-domain-and-data-move.md).)
- Offline install (PWA). Revisit after hosting is live.

## Known limitation
Data lives in each browser on each device. Entries logged on a phone do not appear on a laptop. The workaround for now is to log from one device, or export and compare manually. Fixing this needs a backend, which is a later decision (see [002](decisions/002-no-backend-for-mvp.md)).

## Changes from the first version
The first version tracked live time with a start and stop timer. It was replaced by manual entry, which matches how the time is actually logged. The decision is in [004](decisions/004-manual-hours-entry.md).
