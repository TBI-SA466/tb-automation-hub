export function extractUrls(text) {
  if (!text) return [];
  const urls = new Set();
  const re = /\bhttps?:\/\/[^\s<>"')]+/gi;
  let m;
  while ((m = re.exec(text))) {
    // Trim common trailing punctuation
    const u = m[0].replace(/[.,;:)\]]+$/g, '');
    urls.add(u);
  }
  return [...urls];
}

export function extractJiraKeys(text) {
  if (!text) return [];
  const keys = new Set();
  const re = /\b[A-Z][A-Z0-9]+-\d+\b/g;
  let m;
  while ((m = re.exec(text))) keys.add(m[0]);
  return [...keys];
}

export function parseGithubPullUrl(url) {
  // https://github.com/<owner>/<repo>/pull/<number>
  try {
    const u = new URL(url);
    if (u.host !== 'github.com') return null;
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length >= 4 && parts[2] === 'pull') {
      return { owner: parts[0], repo: parts[1], number: Number(parts[3]) };
    }
    return null;
  } catch {
    return null;
  }
}

export function parseConfluencePageUrl(url) {
  // Common formats:
  // - https://<site>.atlassian.net/wiki/spaces/<SPACE>/pages/<pageId>/...
  // - https://<site>.atlassian.net/wiki/pages/<pageId>/...
  try {
    const u = new URL(url);
    if (!u.pathname.includes('/wiki/')) return null;
    const parts = u.pathname.split('/').filter(Boolean);
    const pagesIdx = parts.indexOf('pages');
    if (pagesIdx >= 0) {
      const pageId = Number(parts[pagesIdx + 1]);
      if (Number.isFinite(pageId)) return { pageId };
    }
    return null;
  } catch {
    return null;
  }
}


