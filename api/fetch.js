import XLSX from 'xlsx';

let lastData = null;
let lastFetch = 0;
const CACHE_TIME = 10000;

export default async function handler(req, res) {
  try {
    const now = Date.now();
    if (lastData && (now - lastFetch) < CACHE_TIME) {
      return res.status(200).json(lastData);
    }
    const ONEDRIVE_URL = process.env.ONEDRIVE_URL;
    if (!ONEDRIVE_URL) {
      return res.status(500).json({ error: 'ONEDRIVE_URL no configurada' });
    }
    const response = await fetch(ONEDRIVE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*'
      },
      redirect: 'follow'
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const datos = {
      patrulleros: [],
      resumen: { total_operativos: 0, total_no_operativos: 0, total_general: 0 },
      lastUpdate: new Date().toISOString()
    };
    for (const sheetName of ['PATRULLA BASE', 'PATRULLA HT', 'TOTAL']) {
      if (!workbook.SheetNames.includes(sheetName)) continue;
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      for (const row of rows) {
        const movil = String(row['MOVIL'] || row['MÓVIL'] || row['Móvil'] || row['movil'] || '').trim();
        const estado = String(row['ESTADO OPERATIVO'] || row['Estado'] || '').toUpperCase();
        if (movil && movil !== 'NAN') {
          const esOperativo = estado.includes('EN SERVICIO') || estado.includes('OPERATIVO');
          if (!datos.patrulleros.find(p => p.numero === movil)) {
            datos.patrulleros.push({
              numero: movil,
              serie: String(row['Nº SERIE'] || '').trim(),
              tipo: String(row['TIPO'] || '').trim(),
              placa: String(row['nº placa'] || '').trim(),
              modelo: String(row['MODELO'] || '').trim(),
              area: String(row['ÁREA'] || '').trim(),
              estado,
              operativo: esOperativo,
              fallas: { gps: false, radio_base: false, dvr: false, camaras: false }
            });
          }
        }
      }
    }
    datos.resumen.total_general = datos.patrulleros.length;
    datos.resumen.total_operativos = datos.patrulleros.filter(p => p.operativo).length;
    datos.resumen.total_no_operativos = datos.resumen.total_general - datos.resumen.total_operativos;
    lastData = datos;
    lastFetch = now;
    res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
    res.status(200).json(datos);
  } catch (error) {
    res.status(500).json({ error: 'Error procesando Excel', message: error.message, ...(lastData && { datos: lastData }) });
  }
}
