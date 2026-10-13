# 003: Host on Cloudflare Pages (proposed)

**Status:** Proposed, awaiting confirmation

## Context
The app needs a free public HTTPS URL, no domain required, reachable from a phone. The source code should be easy to redeploy.

## Options considered
- **Cloudflare Pages:** free, connects to a Git repo and redeploys on push, generous static bandwidth, free `*.pages.dev` URL, works with private repos.
- **Netlify:** free tier, similar workflow, free `*.netlify.app` URL. Its free-tier usage limits are tighter for this kind of site.
- **GitHub Pages:** free and simple, but free accounts can only publish from public repos.
- **Vercel:** free Hobby tier, but its terms restrict commercial use.

## Proposed decision
Cloudflare Pages, with a GitHub repo as the source.

## Consequences
- Requires a GitHub repo and a Cloudflare account, both free.
- A custom domain can be added later without changing the setup.
