import path from 'node:path';
import { jiraGetBoardSprints, jiraGetSprintIssues } from '../connectors/jira.mjs';
import { writeReport } from '../report/markdown.mjs';

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

export async function runJiraBoardSprintPipeline({ outDir }) {
  const boardId = Number(requireEnv('JIRA_BOARD_ID'));
  const projectKey = process.env.JIRA_PROJECT_KEY || '';
  const spField = process.env.JIRA_STORY_POINTS_FIELD || 'customfield_10016';

  const sprints = await jiraGetBoardSprints(boardId, { state: 'active' });
  const active = (sprints.values || [])[0];
  if (!active) {
    writeReport({
      outFile: path.join(outDir, 'jira.board-sprint.md'),
      title: 'Jira board sprint metrics',
      sections: [
        { title: 'Inputs', body: `- **Board**: ${boardId}\n- **Project**: ${projectKey || '(unset)'}` },
        { title: 'Result', body: '- ⚠️ **No active sprint found** for this board.' },
      ],
    });
    return;
  }

  const issuesRes = await jiraGetSprintIssues(active.id, {
    fields: ['issuetype', 'status', spField, 'labels'],
    maxResults: 200,
  });

  const issues = issuesRes.issues || [];
  const byStatus = new Map();
  const byType = new Map();
  let totalSp = 0;

  for (const i of issues) {
    const st = i.fields?.status?.name || 'Unknown';
    const ty = i.fields?.issuetype?.name || 'Unknown';
    byStatus.set(st, (byStatus.get(st) || 0) + 1);
    byType.set(ty, (byType.get(ty) || 0) + 1);

    const sp = Number(i.fields?.[spField]);
    if (Number.isFinite(sp)) totalSp += sp;
  }

  const statusTable = [
    '| status | count |',
    '|---|---:|',
    ...[...byStatus.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`),
  ].join('\n');

  const typeTable = [
    '| issue type | count |',
    '|---|---:|',
    ...[...byType.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`),
  ].join('\n');

  writeReport({
    outFile: path.join(outDir, 'jira.board-sprint.md'),
    title: 'Jira board sprint metrics',
    sections: [
      {
        title: 'Inputs',
        body: [
          `- **Board ID**: ${boardId}`,
          projectKey ? `- **Project key**: ${projectKey}` : undefined,
          `- **Story points field**: \`${spField}\``,
        ].filter(Boolean).join('\n'),
      },
      {
        title: 'Active sprint',
        body: [
          `- **Name**: ${active.name}`,
          `- **ID**: ${active.id}`,
          `- **State**: ${active.state}`,
        ].join('\n'),
      },
      { title: 'Totals', body: `- **Issues in sprint**: ${issues.length}\n- **Total story points (sum)**: ${totalSp}` },
      { title: 'By status', body: statusTable },
      { title: 'By type', body: typeTable },
    ],
  });
}


