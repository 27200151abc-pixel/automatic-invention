# Operations

## Current CI scope on `main`
The `.github/workflows/ci.yml` workflow runs `npm test` and `npm run review:weekly` on pushes and pull requests. These are static/source checks and a documentation refresh; they do not exercise the app in a browser.

Playwright browser coverage, progress-state validation, and the offline-ready PWA shell are proposed in [PR #1](https://github.com/27200151abc-pixel/automatic-invention/pull/1). Its latest verified CI run in this review is run #59, with both `static-checks` and `browser-tests` completed successfully. That branch is still separate from `main` and has diverged from it; synchronize it safely and rerun CI before considering merge. Do not treat PR checks as checks on `main`.

## Free static deployment
The repository is public and contains a static `index.html`; GitHub Pages is a suitable free static-hosting option.

- The deployment workflow runs on pushes to `main` and can also be started manually from the Actions tab.
- In repository **Settings → Pages**, confirm the build/deployment source is **GitHub Actions** if GitHub asks for it.
- Verify the actual run in **Actions → Deploy static site to GitHub Pages** before sharing a URL. A workflow file alone does not prove that deployment succeeded.
- The current `main` deployment artifact copies `index.html` and `README.md` only. It does not include the PWA manifest, service worker, icon, or progress module proposed in PR #1.
- After the first successful deployment, copy the published HTTPS URL and add it as the repository Actions variable `SITE_URL` under **Settings → Secrets and variables → Actions → Variables**. This enables the scheduled endpoint smoke check.
- The current `main` uptime workflow checks every six hours and skips its HTTP check when `SITE_URL` is absent. PR #1 proposes a 30-minute schedule; that change is not active on `main`.
- The uptime check only verifies that the endpoint returns a successful HTTP response; it is not a browser, accessibility, or performance test.

## Data and privacy
Progress is stored in the user's browser `localStorage`. Clearing browser data removes it. No account sync or server-side persistence is implemented.

## Manual verification still required
The available GitHub integration in this review could read repository files, compare branches, and inspect selected CI job results, but it could not read repository Pages settings or Actions variables. A maintainer must confirm Pages is enabled with the GitHub Actions source, inspect the latest deployment run, and add `SITE_URL` after the real published URL is known. Do not claim deployment or endpoint monitoring is active before those checks succeed.
