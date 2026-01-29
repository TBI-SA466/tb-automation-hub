import fs from 'node:fs';
import path from 'node:path';
import { writeReport } from '../report/markdown.mjs';

export async function runDemoPipeline({ outDir }) {
  // Offline demo: generates reports without calling external systems.
  // This is useful to validate the repo wiring (runner + CI artifacts) without creds.

  const runId = new Date().toISOString().replace(/[:.]/g, '-');

  // Generate a tiny SVG “screenshot” artifact and embed it in the markdown report.
  const chartName = `demo.velocity-chart.${runId}.svg`;
  const chartPath = path.join(outDir, chartName);
  fs.writeFileSync(
    chartPath,
    buildVelocitySvg({ done: 41, scope: 58, doneSp: 86, scopeSp: 120 }),
    'utf8'
  );

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
        title: 'Screenshot-style artifact (SVG)',
        body: `![Demo velocity chart](${chartName})`,
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

function buildVelocitySvg({ done, scope, doneSp, scopeSp }) {
  const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);
  const w = 900;
  const h = 260;
  const barW = 560;
  const issuesPct = pct(done, scope);
  const spPct = pct(doneSp, scopeSp);
  const issuesFill = Math.round((barW * issuesPct) / 100);
  const spFill = Math.round((barW * spPct) / 100);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <style>
      .bg{fill:#0b1020}
      .card{fill:#121a33;stroke:#2a3a6a;stroke-width:2;rx:16;ry:16}
      .h{fill:#e8eeff;font:700 18px system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
      .t{fill:#c6d2ff;font:600 14px ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace}
      .barBg{fill:#1a2550}
      .bar{fill:#6f8bff}
    </style>
  </defs>
  <rect class="bg" x="0" y="0" width="${w}" height="${h}"/>
  <rect class="card" x="20" y="18" width="${w - 40}" height="${h - 36}" rx="16" ry="16"/>
  <text class="h" x="44" y="58">Demo: Sprint progress</text>

  <text class="t" x="44" y="92">Issues done: ${done}/${scope} (${issuesPct}%)</text>
  <rect class="barBg" x="44" y="108" width="${barW}" height="18" rx="9" ry="9"/>
  <rect class="bar" x="44" y="108" width="${issuesFill}" height="18" rx="9" ry="9"/>

  <text class="t" x="44" y="160">Story points done: ${doneSp}/${scopeSp} (${spPct}%)</text>
  <rect class="barBg" x="44" y="176" width="${barW}" height="18" rx="9" ry="9"/>
  <rect class="bar" x="44" y="176" width="${spFill}" height="18" rx="9" ry="9"/>
</svg>`;
}


