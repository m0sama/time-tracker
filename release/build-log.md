# Build log: Time Tracker

How this app grew, one small release at a time: what triggered each change, what was decided and why, and how it was checked. The terse list of changes is in [changelog.md](changelog.md); the big decisions are in [02-strategy/decisions](../02-strategy/decisions/).

| Version | Date | What changed | Trigger |
|---|---|---|---|
| 0.0 | by Oct 13 | Live start/stop timer (never published) | First idea |
| 0.1.0 | Oct 13 | Manual hours entry, published | Real use didn't match a timer |
| 0.2.0 | Oct 18 | Moved to time.mohamedyoussef.dev, one-tap data move | New domain, without losing data |
| 0.2.1 | Oct 18 | Copy and paste move for iPhone home-screen icons | The first move didn't reach the new icon |
| 0.2.2 | Oct 18 | No accidental zoom; bigger − and + | "Taps feel unresponsive, so I tap twice and it zooms" |

---

## 0.0: The timer that didn't fit (before 2026-10-13)
**Trigger:** No reliable record of time spent on side projects ([problem statement](../01-discovery/problem-statement.md)).
**Built:** a start and stop timer, as a static web app with no backend ([ADR 001](../02-strategy/decisions/001-static-web-app.md), [ADR 002](../02-strategy/decisions/002-no-backend-for-mvp.md)).
**What happened:** in practice, time gets logged *after the fact*: "Saturday, 3 hours." The timer's running state, ticking clock, and reload problems added complexity without matching that habit.

## 0.1.0: Manual hours entry, first publish (2026-10-13)
**Decision:** replace the timer with manual entries: project, date, hours in 0.25 steps, and an optional note ([ADR 004](../02-strategy/decisions/004-manual-hours-entry.md)). Durations are stored as whole minutes to avoid rounding drift. Data moved to a new storage key so old timer data is ignored.
**Also decided:** Material Design 3 in plain CSS ([ADR 005](../02-strategy/decisions/005-material-design-3.md)). Hosting on Cloudflare Workers, deployed from GitHub on every push ([ADR 003](../02-strategy/decisions/003-hosting-cloudflare-pages.md)), compared against Pages, Netlify, GitHub Pages, and Vercel.
**Shipped:** to `time-tracker.mohamed-osama-795.workers.dev`, then used daily from a phone home-screen icon.

## 0.2.0: New address, one-tap data move (2026-10-18)
**Trigger:** "Can we shift the time-tracker to the new domain... without losing the history? I've been using it on my phone."
**The catch:** browser storage belongs to one address. A new address starts empty.
**Decision:** add `time.mohamedyoussef.dev` and *keep the old address running*. The old address shows a banner with **Move my data**, which opens the new address with the export inside the link's `#` part (never sent to any server). The new address imports only into empty storage, after validation, and then clears the link. Nothing on the old address is deleted. ([ADR 006](../02-strategy/decisions/006-custom-domain-and-data-move.md)) Import from JSON moved into scope for this purpose only, and the MVP scope was updated first.
**Checked:** 15 new tests (round trip with accented characters and symbols, refuses to overwrite, rejects bad data); both screens in a browser.

## 0.2.1: The iPhone home-screen surprise (2026-10-18)
**Trigger:** "I did the move, opened the new URL, but didn't find any of the moved data."
**Diagnosis:** on iPhone, each home-screen icon has its own private storage, separate from the browser. "Move my data" opened the new address *outside* the old icon, so the data landed in a browser view, not in the new icon.
**Decision:** use the one thing every app on the phone shares, the clipboard. **Copy my data** on the old address; a **Paste your data** box on the new address while it's empty. It accepts the move link, the bare code, or exported JSON. If the clipboard is blocked, the link is shown to copy by hand.
**Bug caught before shipping:** the hidden backup text box was showing because the text-box styling overrode `hidden`.
**Outcome:** the move worked on the phone, and all history was kept.

## 0.2.2: No accidental zoom, bigger buttons (2026-10-18)
**Trigger:** "When I click in the text box to enter time, or the + and − icons, they're sometimes not very responsive, so I end up touching the screen twice, and it zooms in."
**Diagnosis:** three possible causes were checked.
1. **Tap delay (the main cause).** Without opting out, iPhone browsers wait briefly after each tap to see if a double tap ("double-tap to zoom") is coming. Taps felt slow, and a second tap zoomed.
2. **Zoom on focus.** iPhone zooms into text boxes under 16 px. The hours box was already 16 px, but the move's paste box was 14 px.
3. **Small targets.** − and + were 40 px, under Material's 48 px minimum.

**Decision:** `touch-action: manipulation` for the whole app, which removes the tap delay and double-tap zoom. **Pinch-to-zoom was deliberately kept.** The common shortcut (`user-scalable=no` / `maximum-scale=1`) was rejected because it blocks zoom for people who need it. − and + became 48 px, and the paste box 16 px.
**Bug caught in testing:** with 48 px buttons, + stuck out past the dialog edge on a 320 px phone. The hours box now takes the remaining space and the gaps tightened slightly.
**Checked:** in a browser, every text field is 16 px or more, the buttons measure 48 × 48, and the + button fits inside the dialog at 320 px and 375 px. Tests still pass (44).

