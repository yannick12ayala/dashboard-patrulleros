import { getFile, putFile, verificarToken } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { token, numero, asignacion_destino, asignacion_origen } = req.body || {};
  const sesion = verificarToken(token);
  if (!sesion) return res.status(401).json({ error: 'Sesión inválida o expirada' });
  if (!numero || !asignacion_destino) return res.status(400).json({ error: 'Faltan datos' });

  try {
    const { content: overrides, sha } = await getFile('overrides.json');
    if (!overrides[numero]) overrides[numero] = { historial: [] };
    if (!overrides[numero].historial) overrides[numero].historial = [];

    const entrada = {
      tipo: 'prestamo',
      fecha: new Date().toISOString(),
      asignacion_origen: asignacion_origen || null,
      asignacion_destino,
      legajo: sesion.legajo
    };

    overrides[numero].asignacion_actual = asignacion_destino;
    overrides[numero].historial.unshift(entrada);

    await putFile('overrides.json', overrides, sha, `Préstamo de ${numero} a ${asignacion_destino} (legajo ${sesion.legajo})`);
    res.status(200).json({ ok: true, historial: overrides[numero].historial });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
