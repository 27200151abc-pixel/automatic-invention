'use strict';
const fs = require('node:fs');
const date = new Date().toISOString().slice(0, 10);
const report = `# Weekly prototype review — ${date}

## Automated checks
- Static test command: \`npm test\`
- Source: standalone Arabic RTL HTML prototype.
- Learning content: eight illustrative A1 items.
- Persistence: browser localStorage; no server sync.

## Human review queue
1. Verify every answer and explanation with an English teacher.
2. Test keyboard navigation and screen-reader feedback.
3. Check small-screen layout and contrast.
4. Decide whether to expand the A1 curriculum before adding higher-level content.
5. Record browser-test results and any accessibility findings.

## Guardrails
This report does not certify CEFR alignment, WCAG conformance, performance, or browser compatibility. Do not auto-edit or auto-merge learning content.
`;
fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync('docs/weekly-review-latest.md', report);
console.log('Wrote docs/weekly-review-latest.md');
