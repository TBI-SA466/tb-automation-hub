import { httpJson } from '../lib/http.mjs';

function ghToken() {
  const t = process.env.GITHUB_TOKEN;
  if (!t) throw new Error('GITHUB_TOKEN is required');
  return t;
}

export async function githubCreateIssue({ owner, repo, title, body, labels = [] }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues`;
  return httpJson(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ghToken()}`,
      'content-type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ title, body, labels }),
  });
}


