export function parseJiraBoardUrl(url) {
  // Example:
  // https://tailored-prod.atlassian.net/jira/software/c/projects/RFW/boards/284
  const u = new URL(url);
  const parts = u.pathname.split('/').filter(Boolean);
  const boardsIdx = parts.indexOf('boards');
  const projectsIdx = parts.indexOf('projects');
  const boardId = boardsIdx >= 0 ? Number(parts[boardsIdx + 1]) : undefined;
  const projectKey = projectsIdx >= 0 ? parts[projectsIdx + 1] : undefined;
  return {
    baseUrl: `${u.protocol}//${u.host}`,
    projectKey,
    boardId: Number.isFinite(boardId) ? boardId : undefined,
  };
}

export function parseFigmaDesignUrl(url) {
  // Example:
  // https://www.figma.com/design/<fileKey>/<name>?node-id=62-31062&m=dev
  const u = new URL(url);
  const parts = u.pathname.split('/').filter(Boolean);
  const fileKey = parts[0] === 'design' ? parts[1] : undefined;
  const nodeIdParam = u.searchParams.get('node-id'); // "62-31062"
  const nodeId = nodeIdParam ? nodeIdParam.replace('-', ':') : undefined; // "62:31062"
  return { fileKey, nodeId };
}

export function parseFigmaUrl(url) {
  try {
    const u = new URL(url);
    if (u.host !== 'www.figma.com' && u.host !== 'figma.com') return null;
    if (!u.pathname.startsWith('/design/')) return null;
    return parseFigmaDesignUrl(url);
  } catch {
    return null;
  }
}


