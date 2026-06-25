import crypto from 'crypto';
import { getFile } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { legajo, password } = req.body || {};
  if (!legajo || !password) return res.status(400).json({ error: 'Faltan datos' });
  try {
    const { content: usuarios } = await getFile('usuarios.json');
    const u = usuarios.find(x => x.legajo === String(legajo));
    if (!u || !u.activado) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const hash = crypto.scryptSync(password, u.salt, 64).toString('hex');
    const a = Buffer.from(hash, 'hex');
    const b = Buffer.from(u.hash, 'hex');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const exp = Date.now() + 8 * 60 * 60 * 1000;
    const payload = Buffer.from(JSON.stringify({ legajo: u.legajo, exp })).toString('base64url');
    const sig = crypto.createHmac('sha256', process.env.SESSION_SECRET).update(payload).digest('base64url');
    res.status(200).json({ token: `${payload}.${sig}`, legajo: u.legajo, exp });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
