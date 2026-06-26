import { getFile, putFile, verificarToken } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { token, numero, legajo, nombre } = req.body || {};
  const sesion = verificarToken(token);
  if (!sesion) return res.status(401).json({ error: 'Sesión inválida o expirada' });
  if (!numero || !legajo || !nombre) return res.status(400).json({ error: 'Faltan datos' });

  try {
    const { content: overrides, sha } = await getFile('overrides.json');
    if (!overrides[numero]) overrides[numero] = { historial: [] };
    if (!overrides[numero].historial) overrides[numero].historial = [];

    if (overrides[numero].empleado_actual) {
      return res.status(409).json({ error: 'El vehículo ya tiene un empleado asignado. Hay que desasignarlo primero.' });
    }

    const fecha = new Date().toISOString();
    overrides[numero].empleado_actual = { legajo, nombre, fecha_inicio: fecha };
    overrides[numero].historial.unshift({
      tipo: 'empleado_asignado',
      fecha,
      legajo,
      nombre,
      legajo_admin: sesion.legajo
    });

    await putFile('overrides.json', overrides, sha, `Asignar empleado ${legajo} a ${numero} (admin legajo ${sesion.legajo})`);
    res.status(200).json({ ok: true, historial: overrides[numero].historial, empleado_actual: overrides[numero].empleado_actual });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
