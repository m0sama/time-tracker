# Changelog

## 0.2.3 (2026-10-18)
- Opening the entry dialog no longer pops open the Project list on iPhone, so the first tap goes straight to the hours box. Focus starts on the dialog title.

## 0.2.2 (2026-10-18)
- Taps respond immediately, and quick double taps (for example on − and +) no longer zoom the page. Pinch-to-zoom still works.
- − and + are 48 px touch targets; the hours row fits down to 320 px wide.
- The paste box uses 16 px text, so iPhone doesn't zoom when it's tapped.

## 0.2.1 (2026-10-18)
- Fix for iPhone home-screen icons, which keep their own storage: **Copy my data** on the old address, and a **Paste your data** box on the new address while it's empty.

## 0.2.0 (2026-10-18)
- New address: https://time.mohamedyoussef.dev. The workers.dev address keeps working.
- "Move my data" on the old address carries all projects and entries to the new one in one tap. Import is validated and only fills empty storage.

## 0.1.0 (unreleased)
- First MVP: projects, manual work entries (date and hours in 0.25 steps, optional note), add, edit, and delete, per-project totals, and JSON export.
- Replaced the earlier live timer with manual entry. See `02-strategy/decisions/004-manual-hours-entry.md`.
