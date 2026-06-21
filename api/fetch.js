let lastData = null;
let lastFetch = 0;
const CACHE_TIME = 15000;

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

    patrulleros.forEach(p => {
      const estado = String(p.estado || '').toUpperCase().trim();
      p.operativo = estado === 'ACTIVO' || estado === 'E/S';
      if (!p.fallas) p.fallas = { gps: false, radio_base: false, dvr: false, camaras: false };
    });

    const datos = {
      patrulleros,
      resumen: {
        total_general: patrulleros.length,
        total_operativos: patrulleros.filter(p => p.operativo).length,
        total_no_operativos: patrulleros.filter(p => !p.operativo).length
      },
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
