let lastData = null;
let lastFetch = 0;
const CACHE_TIME = 30000;

export default async function handler(req, res) {
  try {
    const now = Date.now();
    if (lastData && (now - lastFetch) < CACHE_TIME) {
      return res.status(200).json(lastData);
    }
    const r = await fetch(
      `https://raw.githubusercontent.com/yannick12ayala/dashboard-patrulleros/main/datos.json?t=${now}`
    );
    if (!r.ok) throw new Error('datos.json no disponible');
    const raw = await r.json();
    const patrulleros = Array.isArray(raw) ? raw : (raw.patrulleros || []);

    // Calcular operativo desde estado si no viene en los datos
    patrulleros.forEach(p => {
      const estado = (p.estado || '').toUpperCase();
      p.operativo = estado.includes('EN SERVICIO') || estado.includes('OPERATIVO');
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
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    res.status(200).json(datos);
  } catch (error) {
    if (lastData) return res.status(200).json(lastData);
    res.status(503).json({ error: error.message });
  }
}
