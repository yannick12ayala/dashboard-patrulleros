import { getFile, putFile, verificarToken } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { token, numero } = req.body || {};
  const sesion = verificarToken(token);
  if (!sesion) return res.status(401).json({ error: 'Sesión inválida o expirada' });
  if (!numero) return res.status(400).json({ error: 'Faltan datos' });

  try {
    const { content: overrides, sha } = await getFile('overrides.json');
    const actual = overrides[numero] && overrides[numero].empleado_actual;
    if (!actual) return res.status(409).json({ error: 'Este vehículo no tiene un empleado asignado actualmente' });

    const fechaFin = new Date();
    const fechaInicio = new Date(actual.fecha_inicio);
    const dias = Math.max(1, Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)));

    if (!overrides[numero].historial) overrides[numero].historial = [];
    overrides[numero].historial.unshift({
      tipo: 'empleado_desasignado',
      fecha: fechaFin.toISOString(),
      legajo: actual.legajo,
      nombre: actual.nombre,
      fecha_inicio: actual.fecha_inicio,
      dias,
      legajo_admin: sesion.legajo
    });
    overrides[numero].empleado_actual = null;

    await putFile('overrides.json', overrides, sha, `Desasignar empleado ${actual.legajo} de ${numero} (admin legajo ${sesion.legajo})`);
    res.status(200).json({ ok: true, historial: overrides[numero].historial, dias });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
