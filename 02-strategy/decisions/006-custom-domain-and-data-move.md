# 006: Move to time.mohamedyoussef.dev, with a one-tap data move

**Status:** Accepted (2026-10-18). Updates the live URL in [003](003-hosting-cloudflare-pages.md).

## Context
The portfolio domain mohamedyoussef.dev is now owned, and apps live on its subdomains. The app has been in daily use on a phone at the `workers.dev` address. Browser storage belongs to one address, so a new address starts empty.

## Options considered
- **Switch addresses and re-enter data by hand:** loses history or wastes time.
- **Export the JSON file and import it on the new address:** works, but juggling files on a phone is clumsy, and there was no import.
- **One-tap handoff:** the old address sends its export to the new one inside the link.

## Decision
- Serve the app at **https://time.mohamedyoussef.dev**, and keep the `workers.dev` address running.
- On the `workers.dev` address only, the home page shows a "new address" banner with a **Move my data** button. It opens `https://time.mohamedyoussef.dev/#import=<data>`, with the export encoded as base64url in the URL fragment. Browsers never send the fragment to a server.
- The new address imports the data only if its storage is empty, validates it first (`parseExport` in `store.js`), and then removes it from the URL.
- **Home-screen icons (added 2026-10-18 after the first move failed on an iPhone):** on iOS, each home-screen web app has its own storage, separate from the browser. A link opened from the old icon lands in a browser, not in the new icon. So the old address also offers **Copy my data**, which copies the move link to the clipboard, and the new address shows a **Paste your data** box while it is empty. It accepts the move link, the bare code, or an exported JSON file's text (`pastedToJson` in `move.js`). If the clipboard is blocked, the link is shown in a text box to copy by hand.
- Nothing on the old address is deleted. It stays as a backup.

## Consequences
- Import from JSON is now in scope, but only as part of this move, not as a general file import.
- The data briefly appears in the browser's address bar and history on the new address. It is removed from the URL right after import.
- The `workers.dev` address can be retired once no device still uses it. Turning it off would also remove the banner and the old data's backup, so wait until the move is confirmed.
