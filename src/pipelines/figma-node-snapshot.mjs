import path from 'node:path';
import { figmaGetNodes } from '../connectors/figma.mjs';
import { writeReport } from '../report/markdown.mjs';

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

export async function runFigmaNodeSnapshotPipeline({ outDir }) {
  const fileKey = requireEnv('FIGMA_FILE_KEY');
  const nodeId = requireEnv('FIGMA_NODE_ID'); // "62:31062"

  const res = await figmaGetNodes({ fileKey, nodeIds: [nodeId] });
  const node = res?.nodes?.[nodeId]?.document;
  if (!node) {
    writeReport({
      outFile: path.join(outDir, 'figma.node-snapshot.md'),
      title: 'Figma node snapshot',
      sections: [
        { title: 'Inputs', body: `- **File key**: \`${fileKey}\`\n- **Node ID**: \`${nodeId}\`` },
        { title: 'Result', body: '- ❌ **Node not found** (check node id / permissions).' },
      ],
    });
    return;
  }

  const type = node.type || 'UNKNOWN';
  const name = node.name || '(unnamed)';
  const box = node.absoluteBoundingBox || {};

  writeReport({
    outFile: path.join(outDir, 'figma.node-snapshot.md'),
    title: 'Figma node snapshot',
    sections: [
      { title: 'Inputs', body: `- **File key**: \`${fileKey}\`\n- **Node ID**: \`${nodeId}\`` },
      {
        title: 'Node',
        body: [
          `- **Name**: ${name}`,
          `- **Type**: ${type}`,
          box.width ? `- **Size**: ${Math.round(box.width)} × ${Math.round(box.height)}` : `- **Size**: (unknown)`,
        ].join('\n'),
      },
      {
        title: 'Next steps',
        body: [
          '- Add component-set variant extraction (Figma variants → state list)',
          '- Diff vs Storybook story coverage',
          '- Diff vs design tokens (Figma variables → CSS vars)',
        ].join('\n'),
      },
    ],
  });
}


