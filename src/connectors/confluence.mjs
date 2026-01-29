import { httpJson } from '../lib/http.mjs';

function base() {
  const b = process.env.CONFLUENCE_BASE_URL;
  if (!b) throw new Error('CONFLUENCE_BASE_URL is required');
  return b.replace(/\/+$/, '');
}

function authHeader() {
  const email = process.env.CONFLUENCE_EMAIL;
  const token = process.env.CONFLUENCE_API_TOKEN;
  if (!email || !token) throw new Error('CONFLUENCE_EMAIL and CONFLUENCE_API_TOKEN are required');
  const basic = Buffer.from(`${email}:${token}`, 'utf8').toString('base64');
  return { Authorization: `Basic ${basic}` };
}

export async function confluenceGetPage(pageId) {
  const url = `${base()}/api/v2/pages/${pageId}`;
  return httpJson(url, { headers: authHeader() });
}

// Minimal placeholder for “publish markdown” workflows:
// Most teams convert markdown to Confluence storage format or use a converter service.
export async function confluenceAppendComment({ pageId, bodyText }) {
  const url = `${base()}/api/v2/pages/${pageId}/comments`;
  return httpJson(url, {
    method: 'POST',
    headers: { ...authHeader(), 'content-type': 'application/json' },
    body: JSON.stringify({
      body: {
        representation: 'plain',
        value: bodyText,
      },
    }),
  });
}


