import path from 'node:path';
import { jiraSearchJql } from '../connectors/jira.mjs';
import { githubGetPull } from '../connectors/github.mjs';
import { confluenceGetPage } from '../connectors/confluence.mjs';
import { writeReport } from '../report/markdown.mjs';
import { extractUrls, parseGithubPullUrl, parseConfluencePageUrl } from '../lib/link-extract.mjs';
import { parseFigmaUrl } from '../lib/ids.mjs';

function env(name) {
  return process.env[name];
}

function safe(s) {
  return String(s || '').replace(/\|/g, '\\|');
}

function mermaidId(prefix, raw) {
  return `${prefix}_${String(raw).replace(/[^a-zA-Z0-9_]/g, '_')}`;
}

function jiraIssueUrl(key) {
  const base = (env('JIRA_BASE_URL') || '').replace(/\/+$/, '');
  return base ? `${base}/browse/${key}` : key;
}

export async function runTraceabilityGraphPipeline({ outDir }) {
  const jql = env('TRACE_JQL') || env('JIRA_JQL') || 'order by updated DESC';
  const maxResults = Number(env('TRACE_MAX_RESULTS') || 50);

  const res = await jiraSearchJql(jql, {
    maxResults,
    fields: ['summary', 'description', 'status'],
  });

  const issues = res.issues || [];
  const rows = [];
  const orphans = {
    noDesign: [],
    noPR: [],
    noConfluence: [],
  };

  const edges = [];
  const nodes = [];

  const canEnrichPR = Boolean(env('GITHUB_TOKEN'));
  const canEnrichConfluence = Boolean(env('CONFLUENCE_API_TOKEN') && env('CONFLUENCE_EMAIL') && env('CONFLUENCE_BASE_URL'));

  for (const issue of issues) {
    const key = issue.key;
    const summary = issue.fields?.summary || '';
    const status = issue.fields?.status?.name || '';
    const desc = issue.fields?.description || '';

    const urls = extractUrls(summary + '\n' + desc);
    const figmaLinks = [];
    const prLinks = [];
    const confluenceLinks = [];

    for (const u of urls) {
      const f = parseFigmaUrl(u);
      if (f?.fileKey && f?.nodeId) figmaLinks.push({ url: u, ...f });

      const pr = parseGithubPullUrl(u);
      if (pr) prLinks.push({ url: u, ...pr });

      const c = parseConfluencePageUrl(u);
      if (c?.pageId) confluenceLinks.push({ url: u, ...c });
    }

    if (!figmaLinks.length) orphans.noDesign.push(key);
    if (!prLinks.length) orphans.noPR.push(key);
    if (!confluenceLinks.length) orphans.noConfluence.push(key);

    // Optional enrichment
    const prMeta = [];
    if (canEnrichPR) {
      for (const pr of prLinks.slice(0, 5)) {
        try {
          const data = await githubGetPull(pr);
          prMeta.push({
            url: pr.url,
            title: data.title,
            state: data.state,
            merged: Boolean(data.merged_at),
          });
        } catch {
          prMeta.push({ url: pr.url });
        }
      }
    }

    const confMeta = [];
    if (canEnrichConfluence) {
      for (const c of confluenceLinks.slice(0, 5)) {
        try {
          const p = await confluenceGetPage(c.pageId);
          confMeta.push({ url: c.url, title: p?.title || '', pageId: c.pageId });
        } catch {
          confMeta.push({ url: c.url, pageId: c.pageId });
        }
      }
    }

    rows.push({
      key,
      summary,
      status,
      figma: figmaLinks.map((x) => x.url),
      prs: (prMeta.length ? prMeta : prLinks).map((x) => x.url),
      confluence: (confMeta.length ? confMeta : confluenceLinks).map((x) => x.url),
    });

    // Mermaid graph nodes/edges
    const issueNode = mermaidId('jira', key);
    nodes.push(`${issueNode}["${safe(key)}: ${safe(summary)}"]`);

    for (const f of figmaLinks) {
      const fNode = mermaidId('figma', `${f.fileKey}_${f.nodeId}`);
      nodes.push(`${fNode}["Figma ${safe(f.nodeId)}"]`);
      edges.push(`${fNode} -->|"design"| ${issueNode}`);
    }
    for (const pr of prLinks) {
      const pNode = mermaidId('pr', `${pr.owner}_${pr.repo}_${pr.number}`);
      nodes.push(`${pNode}["PR #${pr.number} (${safe(pr.owner)}/${safe(pr.repo)})"]`);
      edges.push(`${issueNode} -->|"implements"| ${pNode}`);
    }
    for (const c of confluenceLinks) {
      const cNode = mermaidId('conf', c.pageId);
      nodes.push(`${cNode}["Confluence ${c.pageId}"]`);
      edges.push(`${issueNode} -->|"docs"| ${cNode}`);
    }
  }

  const uniq = (arr) => [...new Set(arr)];
  const graph = [
    '```mermaid',
    'flowchart LR',
    '  %% Nodes',
    ...uniq(nodes).map((n) => `  ${n}`),
    '  %% Edges',
    ...edges.map((e) => `  ${e}`),
    '```',
  ].join('\n');

  const table = [
    '| Jira | Status | Figma link(s) | PR link(s) | Confluence link(s) |',
    '|---|---|---|---|---|',
    ...rows.map((r) => {
      const jira = `[${r.key}](${jiraIssueUrl(r.key)})`;
      const fig = r.figma.length ? r.figma.map((u) => `[link](${u})`).join(' ') : '—';
      const prs = r.prs.length ? r.prs.map((u) => `[link](${u})`).join(' ') : '—';
      const conf = r.confluence.length ? r.confluence.map((u) => `[link](${u})`).join(' ') : '—';
      return `| ${jira} | ${safe(r.status)} | ${fig} | ${prs} | ${conf} |`;
    }),
  ].join('\n');

  const orphanSection = [
    `- **Tickets without Figma links**: ${orphans.noDesign.length ? orphans.noDesign.join(', ') : 'None'}`,
    `- **Tickets without PR links**: ${orphans.noPR.length ? orphans.noPR.join(', ') : 'None'}`,
    `- **Tickets without Confluence links**: ${orphans.noConfluence.length ? orphans.noConfluence.join(', ') : 'None'}`,
    '',
    '_Note: “Designs without tickets” requires a defined set of target Figma nodes or a naming convention (e.g., Jira keys in node names). We can add that next._',
  ].join('\n');

  const runLink =
    env('GITHUB_SERVER_URL') && env('GITHUB_REPOSITORY') && env('GITHUB_RUN_ID')
      ? `${env('GITHUB_SERVER_URL')}/${env('GITHUB_REPOSITORY')}/actions/runs/${env('GITHUB_RUN_ID')}`
      : '';

  writeReport({
    outFile: path.join(outDir, 'traceability.graph.md'),
    title: 'Design-to-delivery traceability graph',
    sections: [
      {
        title: 'Inputs',
        body: [
          `- **JQL**: \`${jql}\``,
          `- **Max results**: ${maxResults}`,
          runLink ? `- **CI run**: ${runLink}` : undefined,
          `- **PR enrichment**: ${canEnrichPR ? 'enabled' : 'disabled (set GITHUB_TOKEN)'}`,
          `- **Confluence enrichment**: ${canEnrichConfluence ? 'enabled' : 'disabled (set CONFLUENCE_* creds)'}`,
        ].filter(Boolean).join('\n'),
      },
      { title: 'Orphans (gaps)', body: orphanSection },
      { title: 'Matrix', body: table },
      { title: 'Graph', body: graph },
    ],
  });
}


