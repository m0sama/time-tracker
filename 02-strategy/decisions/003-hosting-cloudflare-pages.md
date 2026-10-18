# 003: Host on Cloudflare (Workers with static assets)

**Status:** Accepted

**Live URL:** https://time.mohamedyoussef.dev (since 2026-10-18, see [006](006-custom-domain-and-data-move.md)). Originally https://time-tracker.mohamed-osama-795.workers.dev, which still works.

## Context
The app needs a free public HTTPS URL, no domain required, reachable from a phone. The source code should be easy to redeploy.

## Options considered
- **Cloudflare Pages:** free, deploys from a Git repo, generous static bandwidth, free `*.pages.dev` URL, works with private repos.
- **Cloudflare Workers with static assets:** free, deploys from a Git repo, same static hosting, free `*.workers.dev` URL. This is the flow Cloudflare offered when the repo was connected.
- **Netlify:** free tier, similar workflow, free `*.netlify.app` URL. Its free-tier usage limits are tighter for this kind of site.
- **GitHub Pages:** free and simple, but free accounts can only publish from public repos.
- **Vercel:** free Hobby tier, but its terms restrict commercial use.

## Decision
Cloudflare Workers with static assets, from the GitHub repo `m0sama/time-tracker`.

- `wrangler.jsonc` serves the `src` folder as static files. No build step.
- Cloudflare runs `npx wrangler deploy` on each push to `main`.
- Preview builds are off, since the app has no preview step.
- Cloudflare Access is off, so the app can be opened from a phone without signing in.

## Consequences
- Requires a GitHub repo and a Cloudflare account, both free.
- A custom domain can be added later from the Workers settings without changing the code.
- The app serves no data. Entries stay in each browser's storage, so phone and laptop data are separate.
