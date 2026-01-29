import path from 'node:path';
import { writeReport } from '../report/markdown.mjs';

export async function runDemoPipeline({ outDir }) {
  // Offline demo: generates reports without calling external systems.
  // This is useful to validate the repo wiring (runner + CI artifacts) without creds.

  const runId = new Date().toISOString().replace(/[:.]/g, '-');

  writeReport({
    outFile: path.join(outDir, `demo.summary.${runId}.md`),
    title: 'Demo pipeline (offline)',
    sections: [
      {
        title: 'What this demonstrates',
        body: [
          '- **No credentials required** (offline fixtures)',
          '- Produces markdown under `reports/`',
          '- Mimics “pull → compute → report” structure used by real pipelines',
        ].join('\n'),
      },
      {
        title: 'Example: Jira-like throughput summary (fake data)',
        body: [
          '| metric | value |',
          '|---|---:|',
          '| Issues completed (last 14d) | 42 |',
          '| Bugs created (last 14d) | 9 |',
          '| Reopen rate | 7.1% |',
          '| Median cycle time | 3.2d |',
        ].join('\n'),
      },
      {
        title: 'Example: Design drift findings (fake data)',
        body: [
          '- ✅ **States covered**: 12/12',
          '- ❌ **Missing story**: `atoms-button--loading`',
          '- ❌ **Token drift**: `--input-border-brand` differs from Figma variable `input/border/brand`',
        ].join('\n'),
      },
      {
        title: 'Next steps',
        body: [
          '- Replace fake data with real API pulls (Jira/Figma/Confluence/GitHub)',
          '- Add evidence packs (screenshots, traces) for QA pipelines',
          '- Add “publish to Confluence” pipeline step',
        ].join('\n'),
      },
    ],
  });
}


