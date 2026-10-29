# Operations

## Continuous checks
The CI workflow runs `npm test` and refreshes the weekly review document on pushes and pull requests. The weekly review workflow opens a documentation-only pull request for human review. It does not rewrite lesson content or merge changes automatically.

## Free static deployment
The repository contains a static `index.html` and the workflow `.github/workflows/deploy-pages.yml` packages it for GitHub Pages. Because this repository is public, GitHub Pages is a suitable free static-hosting option.

- The deployment workflow runs on pushes to `main` and can also be started manually from the Actions tab.
- In repository **Settings → Pages**, confirm the build/deployment source is **GitHub Actions** if GitHub asks for it.
- Verify the actual run in **Actions → Deploy static site to GitHub Pages** before sharing a URL. A workflow file alone does not prove that deployment succeeded.
- After the first successful deployment, copy the published HTTPS URL and add it as the repository Actions variable `SITE_URL` under **Settings → Secrets and variables → Actions → Variables**. This enables the scheduled endpoint smoke check.
- The uptime workflow skips its HTTP check when `SITE_URL` is absent. When configured, it checks for a successful HTTP response; it is not a browser, accessibility, or performance test.

## Data and privacy
Progress is stored in the user's browser `localStorage`. Clearing browser data removes it. No account sync or server-side persistence is implemented.

## Known validation gaps
The available GitHub connector can read repository files and commit status contexts, but this review did not obtain a confirmed Actions run result or inspect Pages/Actions variable settings. Do not treat deployment or browser testing as verified until the corresponding run results are visible.
