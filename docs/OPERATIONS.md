# Operations
## Continuous checks
The CI workflow runs the static test suite on pushes and pull requests. The weekly review workflow opens a documentation-only pull request for human review. It does not rewrite lesson content or merge changes automatically.

## Uptime smoke check
Set repository variable `SITE_URL` to the deployed site's HTTPS URL. The workflow skips the check when the variable is absent. It only checks that the endpoint responds successfully; it is not a full synthetic browser or performance test.

## Deployment
This repository contains a static `index.html`. A static host can serve it without a backend. Deployment is intentionally not configured until the target host and permissions are selected. No changes are made to Lisanora.

## Data and privacy
Progress is stored in the user's browser localStorage. Clearing browser data removes it. No account sync or server-side persistence is implemented.
