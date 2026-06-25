import { getFile, putFile, verificarToken } from './_lib.js';

const MOTIVOS_VALIDOS = [
  'FALLA MECANICA',
  'SINIESTRO',
  'CAMARAS FUERA DE SERVICIO',
  'RADIO BASE FUERA DE SERVICIO',
  'BALIZA FUERA DE SERVICIO'
];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { token, numero, estado, motivo } = req.body || {};
  const sesion = verificarToken(token);
  if (!sesion) return res.status(401).json({ error: 'Sesión inválida o expirada' });
  if (!numero || !estado) return res.status(400).json({ error: 'Faltan datos' });
  if (!['OPERATIVO', 'FUERA DE SERVICIO'].includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  if (estado === 'FUERA DE SERVICIO' && !MOTIVOS_VALIDOS.includes(motivo)) {
    return res.status(400).json({ error: 'Motivo inválido' });
  }

  try {
    const { content: overrides, sha } = await getFile('overrides.json');
    if (!overrides[numero]) overrides[numero] = { historial: [] };
    if (!overrides[numero].historial) overrides[numero].historial = [];

    const entrada = {
      tipo: 'estado',
      fecha: new Date().toISOString(),
      estado,
      motivo: estado === 'FUERA DE SERVICIO' ? motivo : null,
      legajo: sesion.legajo
    };

    overrides[numero].estado_actual = estado;
    overrides[numero].motivo = entrada.motivo;
    overrides[numero].actualizado = entrada.fecha;
    overrides[numero].legajo = sesion.legajo;
    overrides[numero].historial.unshift(entrada);

    await putFile('overrides.json', overrides, sha, `Actualizar estado de ${numero} (legajo ${sesion.legajo})`);
    res.status(200).json({ ok: true, historial: overrides[numero].historial });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
