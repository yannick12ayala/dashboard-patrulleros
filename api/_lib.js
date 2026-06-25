import crypto from 'crypto';

const REPO = 'yannick12ayala/dashboard-patrulleros';

export async function getFile(path) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'dashboard-patrulleros' }
  });
  if (!r.ok) throw new Error(`No se pudo leer ${path}: ${r.status}`);
  const data = await r.json();
  const content = Buffer.from(data.content, 'base64').toString('utf8');
  return { content: JSON.parse(content), sha: data.sha };
}

export async function putFile(path, obj, sha, message) {
  const body = Buffer.from(JSON.stringify(obj, null, 2)).toString('base64');
  const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'dashboard-patrulleros',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message, content: body, sha })
  });
  if (!r.ok) throw new Error(`Error al escribir ${path}: ${r.status}`);
  return r.json();
}

export function verificarToken(token) {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', process.env.SESSION_SECRET).update(payload).digest('base64url');
  if (sig !== expected) return null;
  let data;
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!data.exp || Date.now() > data.exp) return null;
  return data;
}
