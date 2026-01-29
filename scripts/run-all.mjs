import fs from 'node:fs';
import path from 'node:path';
import { runJiraVelocityPipeline } from '../src/pipelines/jira-velocity.mjs';
import { runDesignDriftPipeline } from '../src/pipelines/design-drift.mjs';
import { runDemoPipeline } from '../src/pipelines/demo.mjs';
import { runJiraBoardSprintPipeline } from '../src/pipelines/jira-board-sprint.mjs';
import { runFigmaNodeSnapshotPipeline } from '../src/pipelines/figma-node-snapshot.mjs';
import { runTraceabilityGraphPipeline } from '../src/pipelines/traceability-graph.mjs';

function parseArgs(argv) {
  const out = {};
  for (const a of argv) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outDir = path.resolve(process.cwd(), 'reports');
  fs.mkdirSync(outDir, { recursive: true });

  const pipelines = [
    { name: 'jira-velocity', run: () => runJiraVelocityPipeline({ outDir }) },
    { name: 'design-drift', run: () => runDesignDriftPipeline({ outDir }) },
    { name: 'demo', run: () => runDemoPipeline({ outDir }) },
    { name: 'jira-board-sprint', run: () => runJiraBoardSprintPipeline({ outDir }) },
    { name: 'figma-node-snapshot', run: () => runFigmaNodeSnapshotPipeline({ outDir }) },
    { name: 'traceability-graph', run: () => runTraceabilityGraphPipeline({ outDir }) },
  ];

  const only = args.pipeline;
  const selected = only ? pipelines.filter((p) => p.name === only) : pipelines;
  if (only && !selected.length) throw new Error(`Unknown pipeline: ${only}`);

  const failures = [];
  for (const p of selected) {
    try {
      // eslint-disable-next-line no-console
      console.log(`Running: ${p.name}`);
      await p.run();
      // eslint-disable-next-line no-console
      console.log(`OK: ${p.name}`);
    } catch (e) {
      failures.push({ pipeline: p.name, error: e });
      // eslint-disable-next-line no-console
      console.error(`FAILED: ${p.name}`);
      // eslint-disable-next-line no-console
      console.error(e?.message || e);
    }
  }

  if (failures.length) process.exit(1);
}

main();


