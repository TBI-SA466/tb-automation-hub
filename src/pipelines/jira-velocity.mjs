import path from 'node:path';
import { jiraSearchJql } from '../connectors/jira.mjs';
import { writeReport } from '../report/markdown.mjs';

// Minimal “velocity-like” pipeline idea:
// - Pull last N done issues for a project (or a JQL filter)
// - Aggregate counts by issue type/status
// - Publish a markdown report (Confluence upload is a separate pipeline step)
export async function runJiraVelocityPipeline({ outDir }) {
  const jql = process.env.JIRA_JQL || 'order by updated DESC';
  const maxResults = Number(process.env.JIRA_MAX_RESULTS || 50);
  const res = await jiraSearchJql(jql, { maxResults, fields: ['key', 'summary', 'status', 'issuetype'] });

  const issues = res.issues || [];
  const byType = new Map();
  for (const i of issues) {
    const t = i.fields?.issuetype?.name || 'Unknown';
    byType.set(t, (byType.get(t) || 0) + 1);
  }

  const rows = [...byType.entries()].sort((a, b) => b[1] - a[1]);
  const table = [
    '| issue type | count |',
    '|---|---:|',
    ...rows.map(([t, c]) => `| ${t} | ${c} |`),
  ].join('\n');

  const sample = issues.slice(0, 10).map((i) => `- **${i.key}**: ${i.fields?.summary || ''}`).join('\n');

  writeReport({
    outFile: path.join(outDir, 'jira.velocity.md'),
    title: 'Jira velocity (starter report)',
    sections: [
      { title: 'Inputs', body: `- **JQL**: \`${jql}\`\n- **Max results**: ${maxResults}` },
      { title: 'Issue type breakdown', body: table },
      { title: 'Sample issues', body: sample || '- (none)' },
    ],
  });
}


