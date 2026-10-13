# 004: Manual hours entry instead of a live timer

**Status:** Accepted

## Context
The first version tracked time with a start and stop timer. In practice, time is logged after the fact: a day or a session is recorded with a date and a number of hours. The timer added complexity (running state, clock ticking, reloads mid-session) without matching that workflow.

## Decision
Replace the timer with manual work entries. Each entry has a project, a date, a duration in whole minutes (entered as hours in 0.25 steps), and an optional note. Entries can be added, edited, and deleted. Storage moves to a new key, `time-tracker.v2`, so old timer data is not read.

## Consequences
- Simpler model: entries are plain records with no running state.
- Durations are stored as integer minutes, which avoids floating-point drift in totals.
- Old timer data from the first version is ignored. It was never published, so nothing real is lost.
- A live timer can come back later as a separate feature if it is ever needed.
