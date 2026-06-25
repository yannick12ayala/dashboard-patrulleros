import crypto from 'crypto';
import { getFile, putFile } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { legajo, password } = req.body || {};
  if (!legajo || !password || password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }
  try {
    const { content: usuarios, sha } = await getFile('usuarios.json');
    const u = usuarios.find(x => x.legajo === String(legajo));
    if (!u) return res.status(404).json({ error: 'Legajo no encontrado' });
    if (u.activado) return res.status(409).json({ error: 'Esta cuenta ya tiene contraseña configurada' });

    const salt = crypto.randomBytes(16).toString('hex');
    u.salt = salt;
    u.hash = crypto.scryptSync(password, salt, 64).toString('hex');
    u.activado = true;

    await putFile('usuarios.json', usuarios, sha, `Activar usuario ${legajo}`);
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
