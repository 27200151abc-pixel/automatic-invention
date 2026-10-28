# VerbaSprout — prototype
Standalone Arabic RTL English-learning prototype. No Lisanora integration, external scripts, paid APIs, or remote assets.

## Run locally
Run a local HTTP server from the repository root (service workers do not work from a `file://` URL):

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173`. Progress is stored locally under `verbasprout-progress`. After the first successful online load, the service worker caches the app shell so the lesson can reopen offline on supported browsers.

## Current scope
- Eight short A1 multiple-choice exercises with immediate explanatory feedback.
- Local progress persistence, reset, responsive layout, and keyboard-visible focus.
- A1–C2 roadmap display only. A2–C2 are not yet implemented curricula.
- No audio, accounts, analytics, or server-side storage.

## Quality checks
Run `npm test` for the static source checks. Browser automation is configured separately in CI; local browser tests have not been verified in this environment.

## Continuous improvement
GitHub Actions runs static checks on pushes and pull requests and a weekly documentation review. The weekly workflow opens a documentation-only pull request; it does not auto-change educational content. The uptime workflow requires the repository variable `SITE_URL`.

## Evidence and limitations
This is a prototype, not a validated CEFR placement test or a full WCAG audit. Review all new learning content before release. See `docs/QUALITY-GATES.md` and `docs/OPERATIONS.md`.
