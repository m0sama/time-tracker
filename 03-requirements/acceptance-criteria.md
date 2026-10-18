# Acceptance criteria

## Projects
- Adding a project with a blank or whitespace-only name shows "Project name is required" and does not save.
- Names are trimmed before saving.
- The home page lists every project with its total hours. Tapping a project opens its page.

## Work entries
- The + button is visible on the home page and on every project page.
- Tapping + opens a form with project, date, hours, and note. The date starts blank, showing "Select a date", and Save asks for one if it is still blank. Tapping a day in the calendar view pre-fills that date.
- The date is chosen from a calendar grid. Previous and next month buttons move between months. Tapping a day selects it and closes the calendar.
- On a project page, + pre-selects that project. On the home page, it pre-selects the first project.
- If no project exists, + shows "Create a project first." and does not open the form.
- Hours must be a multiple of 0.25 between 0.25 and 24. Other values show "Hours must be between 0.25 and 24, in 0.25 steps".
- A date that does not exist (for example 30 February) shows "Choose a valid date".
- A project can have at most one entry per day. Two entries for the same project on the same date are never allowed. Different projects may share a day.
- When the chosen project and date already have an entry, the form shows "This project already has X h logged on this day" with an "Edit that entry" link. Save is disabled until the conflict is resolved.
- Changing the project or date in the form re-checks for a conflict straight away.
- The store also rejects a duplicate on add or edit, with "This project already has an entry for that day. Edit that entry instead."
- Saving adds or updates the entry and updates totals.
- Hours has − and + buttons that step by 15 minutes, within 0.25 to 24.
- Escape closes the form. If the date calendar is open, Escape closes only the calendar.
- Cancel closes the form without saving changes.
- Delete in the entry form opens an in-app confirmation, styled like the rest of the app, not a browser dialog. Escape or Cancel keeps the entry. Confirming removes it and updates totals.

## Project page: hours views
- The project page has two views, selected by a switch: **Month** and **Calendar**. Month is selected by default. There is no separate entries list.
- The total logged for the project is shown at the top of the page.

### Month view (collapsible tree)
- Months are listed newest first, collapsed by default. Each shows its label and total hours.
- Expanding a month shows its weeks (Monday-starting), earliest first, collapsed by default. Each shows "Week of …" and its total hours.
- Expanding a week shows its days, earliest first, indented under the week. Each day row shows the date, the note (if any), the hours, and two icon buttons: edit and delete.
- Each toggle row has `aria-expanded` set to match its state.
- The edit icon opens the entry in the entry form. The delete icon asks for confirmation, then removes the entry and updates every total.
- Day rows are not otherwise tappable. Editing happens through the icon only.
- A project with no entries shows "No hours logged yet."

### Calendar view
- Shows a month grid. Each day shows its number at the top, and the hours logged for this project that day at the bottom, for example `2.25`. Days with no hours show only the number.
- The day number and hours row keep the same position whether or not a day has hours.
- Days with hours are shaded in three levels: under 4 h, 4 to under 8 h, and 8 h or more.
- The header shows the previous and next month buttons and the project's total hours for the displayed month.
- Tapping a day with no entry opens the entry form with that date and this project pre-selected.
- Tapping a day that already has an entry opens that entry for editing. If the day has several entries, the most recently created one opens.
- The calendar opens on the current month the first time it is selected during a visit.

## Totals
- Home page and project page totals equal the sum of entry hours, shown as hours with up to two decimals (for example `2.25 h`).

## Export
- Export downloads a file named `time-tracker-YYYY-MM-DD.json` containing all projects and entries.

## Moving to the new address
- On the workers.dev address, the home page shows a banner with the new address. With data present, it has a **Move my data** button; without data, a link to the new address.
- **Move my data** opens the new address with all projects and entries, and they appear there unchanged.
- **Copy my data** copies a move link to the clipboard and confirms it. If the clipboard is unavailable, the link appears in a text box to copy by hand.
- While the new address has no projects, it shows a **Paste your data** box. Pasting the move link, the bare code, or exported JSON and tapping **Import** brings in all projects and entries unchanged. This works inside an iPhone home-screen icon.
- The new address imports only into empty storage. If it already has data, nothing is imported and a message says so.
- Invalid handed-over data is rejected with a message, and nothing is stored.
- After an import, the data is removed from the address bar.
- Data on the old address is never deleted.

## Persistence
- Data survives a page reload and browser restart.

## Layout and style
- Follows Material Design 3 (see `02-strategy/decisions/005-material-design-3.md`).
- Usable at 360px width with no horizontal scrolling. The entry dialog's hours row fits down to 320px.
- On a phone, taps register immediately, and tapping quickly (for example on − and +) never zooms the page. Pinch-to-zoom still works.
- When the entry dialog opens, focus starts on its title, so no dropdown or keyboard pops up. The first tap goes straight to the field tapped.
- The − and + buttons are at least 48 × 48 px. Text boxes use at least 16px text, so iPhone doesn't zoom when one is tapped.
- The + button does not cover the last list item.
- Text is readable in both light and dark system themes.

## Automated tests
- `npm test` passes. Covered: entry validation (15-minute steps, range, real dates), one entry per project per day, add, edit, delete, listing order, totals, calendar grid and month navigation, period grouping (day, week, month, and the month > week > day tree), and export.
