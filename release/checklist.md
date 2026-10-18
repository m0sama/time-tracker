# Publish checklist

Run through this before every deploy.

- [ ] `npm test` passes locally.
- [ ] `npm start` works and the app loads at http://localhost:3000 with no console errors.
- [ ] Add project, add entry (+), edit entry, delete entry, and export all work by hand.
- [ ] Hours validation works: 0.1 is rejected, 1.25 is accepted, 25 is rejected.
- [ ] Layout checked at a phone width (about 360px) in browser dev tools, including the + button not covering the last entry.
- [ ] Acceptance criteria in `03-requirements/` still match the behaviour.
- [ ] `release/changelog.md` has an entry for this version.
- [ ] Commit and push to the main branch. Cloudflare redeploys `main` automatically, to https://time.mohamedyoussef.dev and the old workers.dev address.
- [ ] Check the live URL responds: `curl -I https://time.mohamedyoussef.dev`.
- [ ] Open the live URL on a phone and add one entry.
