// Toma capturas del juego para revisar el arte y el diseño.
// Uso: node scripts/captura.mjs <url> <salida.png> [ancho] [alto] [esperaMs]
// Usa el Chrome instalado en la máquina (no descarga navegadores).
import { chromium } from '@playwright/test';

const [url = 'http://localhost:5173/', salida = 'captura.png', ancho = '1920', alto = '1080', espera = '1500'] =
  process.argv.slice(2);

const navegador = await chromium.launch({ channel: 'chrome' });
const pagina = await navegador.newPage({ viewport: { width: Number(ancho), height: Number(alto) } });
const errores = [];
pagina.on('pageerror', (e) => errores.push(String(e)));
pagina.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') errores.push(`${m.type()}: ${m.text()}`);
});
await pagina.goto(url);
await pagina.waitForTimeout(Number(espera));
await pagina.screenshot({ path: salida });
await navegador.close();
if (errores.length) console.log(errores.join('\n'));
console.log(`Captura guardada en ${salida}`);
