let lastData = null;
let lastFetch = 0;
const CACHE_TIME = 30000;

export default async function handler(req, res) {
  try {
    const now = Date.now();
    if (lastData && (now - lastFetch) < CACHE_TIME) {
      return res.status(200).json(lastData);
    }

    // Leer datos.json desde GitHub (actualizado por Power Automate)
    const r = await fetch(
      `https://raw.githubusercontent.com/yannick12ayala/dashboard-patrulleros/main/datos.json?t=${now}`
    );
    if (!r.ok) throw new Error('datos.json no disponible aún');

    const datos = await r.json();
    lastData = datos;
    lastFetch = now;

    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    res.status(200).json(datos);
  } catch (error) {
    if (lastData) return res.status(200).json(lastData);
    res.status(503).json({ error: error.message });
  }
}
