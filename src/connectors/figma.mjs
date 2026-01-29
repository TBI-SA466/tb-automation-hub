import { httpJson } from '../lib/http.mjs';

function token() {
  const t = process.env.FIGMA_TOKEN;
  if (!t) throw new Error('FIGMA_TOKEN is required');
  return t;
}

export async function figmaGetFile(fileKey) {
  const url = `https://api.figma.com/v1/files/${fileKey}`;
  return httpJson(url, { headers: { 'X-Figma-Token': token() } });
}


