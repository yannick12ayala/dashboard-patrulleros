import { getFile } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { legajo } = req.body || {};
  if (!legajo) return res.status(400).json({ error: 'Falta legajo' });
  try {
    const { content: usuarios } = await getFile('usuarios.json');
    const u = usuarios.find(x => x.legajo === String(legajo));
    if (!u) return res.status(200).json({ valido: false });
    res.status(200).json({ valido: true, activado: !!u.activado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
