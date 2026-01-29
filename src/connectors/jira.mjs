import { httpJson } from '../lib/http.mjs';

function base() {
  const b = process.env.JIRA_BASE_URL;
  if (!b) throw new Error('JIRA_BASE_URL is required');
  return b.replace(/\/+$/, '');
}

function authHeader() {
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;
  if (!email || !token) throw new Error('JIRA_EMAIL and JIRA_API_TOKEN are required');
  const basic = Buffer.from(`${email}:${token}`, 'utf8').toString('base64');
  return { Authorization: `Basic ${basic}` };
}

export async function jiraSearchJql(jql, { fields = ['key', 'summary', 'status'], maxResults = 50 } = {}) {
  const url = new URL(`${base()}/rest/api/3/search`);
  url.searchParams.set('jql', jql);
  url.searchParams.set('maxResults', String(maxResults));
  url.searchParams.set('fields', fields.join(','));
  return httpJson(url.toString(), { headers: authHeader() });
}

function agileBase() {
  // Jira Software Agile API lives under /rest/agile/1.0
  return `${base()}/rest/agile/1.0`;
}

export async function jiraGetBoardSprints(boardId, { state } = {}) {
  const url = new URL(`${agileBase()}/board/${boardId}/sprint`);
  if (state) url.searchParams.set('state', state); // active, closed, future
  url.searchParams.set('maxResults', '50');
  return httpJson(url.toString(), { headers: authHeader() });
}

export async function jiraGetSprintIssues(sprintId, { fields = [], maxResults = 100 } = {}) {
  const url = new URL(`${agileBase()}/sprint/${sprintId}/issue`);
  url.searchParams.set('maxResults', String(maxResults));
  if (fields.length) url.searchParams.set('fields', fields.join(','));
  return httpJson(url.toString(), { headers: authHeader() });
}


