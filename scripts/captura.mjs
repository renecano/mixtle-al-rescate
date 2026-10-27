// Toma capturas del juego para revisar el arte y el diseño.
// Uso: node scripts/captura.mjs <url> <ancho> <alto> [pasos...]
//   c:x,y      toca en coordenadas del juego (1920×1080), sin importar el tamaño de ventana
//   w:ms       espera
//   s:ruta.png guarda una captura
//   t:nombre   toca el primer objeto tocable cuyo nombre empieza así (requiere el gancho __caco)
//   T:nombre   toca, uno por uno, todos los que empiezan así
//   d:a>b      arrastra el tocable "a" hasta el tocable "b" (prefijos)
// Usa el Chrome instalado en la máquina (no descarga navegadores).
import { chromium } from '@playwright/test';

const [url = 'http://localhost:5173/', ancho = '1920', alto = '1080', ...pasos] = process.argv.slice(2);

// CAMARA=falsa usa la cámara de prueba de Chrome (patrón verde) y concede el permiso.
const camaraFalsa = process.env.CAMARA === 'falsa';
const navegador = await chromium.launch({
  channel: 'chrome',
  args: camaraFalsa ? ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] : [],
});
const contexto = await navegador.newContext({
  viewport: { width: Number(ancho), height: Number(alto) },
  permissions: camaraFalsa ? ['camera'] : [],
});
const pagina = await contexto.newPage();
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
  if (tipo === 'd') {
    const [a, b] = valor.split('>');
    const lista = await pagina.evaluate(() => window.__caco.tocables());
    const origen = lista.find((o) => o.nombre.startsWith(a));
    const destino = lista.find((o) => o.nombre.startsWith(b));
    if (!origen || !destino) console.log(`No se pudo arrastrar ${valor}`);
    else await arrastrar(origen, destino);
  }
}

async function aPantalla(gx, gy) {
  const caja = await pagina.locator('canvas').boundingBox();
  return { x: caja.x + (gx / 1920) * caja.width, y: caja.y + (gy / 1080) * caja.height };
}

async function arrastrar(o, d) {
  const a = await aPantalla(o.x, o.y);
  const b = await aPantalla(d.x, d.y);
  await pagina.mouse.move(a.x, a.y);
  await pagina.mouse.down();
  await pagina.mouse.move(b.x, b.y, { steps: 12 });
  await pagina.mouse.up();
}

async function tocar(gx, gy) {
  const caja = await pagina.locator('canvas').boundingBox();
  await pagina.mouse.click(caja.x + (gx / 1920) * caja.width, caja.y + (gy / 1080) * caja.height);
}
await navegador.close();
if (errores.length) console.log(errores.join('\n'));
