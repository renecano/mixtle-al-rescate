// Toma capturas del juego para revisar el arte y el diseño.
// Uso: node scripts/captura.mjs <url> <ancho> <alto> [pasos...]
//   c:x,y      toca en coordenadas del juego (1920×1080), sin importar el tamaño de ventana
//   w:ms       espera
//   s:ruta.png guarda una captura
//   t:nombre   toca el primer objeto tocable cuyo nombre empieza así (requiere el gancho __caco)
//   T:nombre   toca, uno por uno, todos los que empiezan así
// Usa el Chrome instalado en la máquina (no descarga navegadores).
import { chromium } from '@playwright/test';

const [url = 'http://localhost:5173/', ancho = '1920', alto = '1080', ...pasos] = process.argv.slice(2);

const navegador = await chromium.launch({ channel: 'chrome' });
const pagina = await navegador.newPage({ viewport: { width: Number(ancho), height: Number(alto) } });
const errores = [];
pagina.on('pageerror', (e) => errores.push(String(e)));
pagina.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') errores.push(`${m.type()}: ${m.text()}`);
});
await pagina.goto(url);
await pagina.waitForSelector('canvas');
await pagina.waitForTimeout(1200);

for (const paso of pasos) {
  const [tipo, valor = ''] = paso.split(/:(.*)/s);
  if (tipo === 'w') await pagina.waitForTimeout(Number(valor));
  if (tipo === 's') {
    await pagina.screenshot({ path: valor });
    console.log(`Captura: ${valor}`);
  }
  if (tipo === 'c') {
    const [gx, gy] = valor.split(',').map(Number);
    await tocar(gx, gy);
  }
  if (tipo === 't' || tipo === 'T') {
    const objetos = await pagina.evaluate((p) => window.__caco.tocables().filter((o) => o.nombre.startsWith(p)), valor);
    if (!objetos.length) console.log(`No hay tocables "${valor}"`);
    for (const o of tipo === 't' ? objetos.slice(0, 1) : objetos) {
      await tocar(o.x, o.y);
      await pagina.waitForTimeout(tipo === 'T' ? 900 : 100);
    }
  }
}

async function tocar(gx, gy) {
  const caja = await pagina.locator('canvas').boundingBox();
  await pagina.mouse.click(caja.x + (gx / 1920) * caja.width, caja.y + (gy / 1080) * caja.height);
}
await navegador.close();
if (errores.length) console.log(errores.join('\n'));
