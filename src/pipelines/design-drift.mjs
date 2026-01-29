import path from 'node:path';
import { figmaGetFile } from '../connectors/figma.mjs';
import { writeReport } from '../report/markdown.mjs';

// Starter “design drift” pipeline:
// For now it only fetches the file metadata and records high-level stats.
// Next iterations typically:
// - read a known component node
// - enumerate variants/states
// - compare to Storybook story coverage
export async function runDesignDriftPipeline({ outDir }) {
  const fileKey = process.env.FIGMA_FILE_KEY;
  if (!fileKey) throw new Error('FIGMA_FILE_KEY is required');

  const file = await figmaGetFile(fileKey);
  const name = file?.name || '(unknown)';
  const documentChildren = file?.document?.children?.length ?? 0;

  writeReport({
    outFile: path.join(outDir, 'figma.design-drift.md'),
    title: 'Figma design drift (starter report)',
    sections: [
      { title: 'Inputs', body: `- **File key**: \`${fileKey}\`` },
      { title: 'Snapshot', body: `- **File name**: ${name}\n- **Top-level pages**: ${documentChildren}` },
      { title: 'Next steps', body: `- Map components → node ids\n- Enumerate variants/states\n- Diff vs Storybook index + implementation tokens` },
    ],
  });
}


