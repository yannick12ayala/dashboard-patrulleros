let lastData = null;
// redeploy-trigger-final
// fix-confirm-2
let lastFetch = 0;
const CACHE_TIME = 15000;

function estadoSistemaGps(valor) {
  const v = String(valor || '').toUpperCase().trim();
  if (v.includes('REPORTANDO')) return 'ok';
  if (v === 'SIN GPS' || v === '') return 'no_asignado';
  return 'falla';
}

function calcularFallas(p) {
  const strixEstado = estadoSistemaGps(p.strix);
  const soflexEstado = estadoSistemaGps(p.soflex);
  p.strix_problema = strixEstado === 'falla';
  p.soflex_problema = soflexEstado === 'falla';

  let gpsEstado;
  if (strixEstado === 'falla' || soflexEstado === 'falla') gpsEstado = 'falla';
  else if (strixEstado === 'no_asignado' && soflexEstado === 'no_asignado') gpsEstado = 'no_asignado';
  else gpsEstado = 'ok';

  const tieneRadio = String(p.radio_base || '').trim() !== '';
  const estadoRadio = String(p.estado_radio || '').toUpperCase().trim();
  const radioEstado = !tieneRadio ? 'no_asignado' : (estadoRadio === 'F/S' ? 'falla' : 'ok');

  const tieneCamara = ['cctv', 'camara_externa', 'camara_interna'].some(
    k => String(p[k] || '').toUpperCase().trim() === 'SI'
  );
  const estadoCamara = String(p.estado_camara || '').toUpperCase().trim();
  const camarasEstado = !tieneCamara ? 'no_asignado' : (estadoCamara === 'F/S' ? 'falla' : 'ok');

  const tieneBaliza = String(p.baliza || '').trim() !== '';
  const estadoBaliza = String(p.estado_baliza || '').toUpperCase().trim();
  const balizaEstado = !tieneBaliza ? 'no_asignado' : (estadoBaliza === 'F/S' ? 'falla' : 'ok');

  return {
    gps: gpsEstado,
    radio_base: radioEstado,
    camaras: camarasEstado,
    baliza: balizaEstado
  };
}

async function leerOverrides() {
  try {
    const r = await fetch(
      'https://api.github.com/repos/yannick12ayala/dashboard-patrulleros/contents/overrides.json',
      { headers: { 'Accept': 'application/vnd.github.v3.raw', 'User-Agent': 'dashboard-patrulleros' } }
    );
    if (!r.ok) return {};
    return await r.json();
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  try {
    const now = Date.now();
    if (lastData && (now - lastFetch) < CACHE_TIME) {
      return res.status(200).json(lastData);
    }
    const r = await fetch(
      'https://api.github.com/repos/yannick12ayala/dashboard-patrulleros/contents/datos.json',
      {
        headers: {
          'Accept': 'application/vnd.github.v3.raw',
          'User-Agent': 'dashboard-patrulleros'
        }
      }
    );
    if (!r.ok) throw new Error(`GitHub API HTTP ${r.status}`);
    const raw = await r.json();
    const patrulleros = Array.isArray(raw) ? raw : (raw.patrulleros || []);
    const overrides = await leerOverrides();

    patrulleros.forEach(p => {
      const estado = String(p.estado || '').toUpperCase().trim();
      p.operativo = estado === 'ACTIVO' || estado === 'E/S';
      p.fallas = calcularFallas(p);
      p.asignacion_original = p.asignacion;
      p.en_prestamo = false;
      p.motivo_fuera_servicio = null;
      p.historial = [];
      p.estado_manual = false;

      const ov = overrides[p.numero];
      if (ov) {
        p.historial = ov.historial || [];
        if (ov.estado_actual) {
          p.operativo = ov.estado_actual === 'OPERATIVO';
          p.motivo_fuera_servicio = ov.motivo || null;
          p.estado_manual = true;
        }
        if (ov.asignacion_actual && ov.asignacion_actual !== p.asignacion_original) {
          p.asignacion = ov.asignacion_actual;
          p.en_prestamo = true;
        }
      }
    });

    const sistemas = { gps: { ok: 0, falla: 0, no_asignado: 0 }, radio_base: { ok: 0, falla: 0, no_asignado: 0 }, camaras: { ok: 0, falla: 0, no_asignado: 0 }, baliza: { ok: 0, falla: 0, no_asignado: 0 } };
    patrulleros.forEach(p => {
      for (const key of ['gps', 'radio_base', 'camaras', 'baliza']) {
        const estado = p.fallas[key] || 'ok';
        sistemas[key][estado] = (sistemas[key][estado] || 0) + 1;
      }
    });

    const datos = {
      patrulleros,
      resumen: {
        total_general: patrulleros.length,
        total_operativos: patrulleros.filter(p => p.operativo).length,
        total_no_operativos: patrulleros.filter(p => !p.operativo).length
      },
      sistemas,
      lastUpdate: raw.lastUpdate || new Date().toISOString()
    };
    lastData = datos;
    lastFetch = now;
    res.setHeader('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=30');
    res.status(200).json(datos);
  } catch (error) {
    if (lastData) return res.status(200).json(lastData);
    res.status(503).json({ error: error.message });
  }
}
