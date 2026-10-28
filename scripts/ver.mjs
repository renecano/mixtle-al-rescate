// Herramienta de desarrollo: sirve dist/ con vite preview y toma capturas de las pantallas pedidas.
// Uso: node scripts/ver.mjs <carpeta-salida> [ancho] [alto] [--lento]
//   Captura: la pantalla de carga (con la red lenta si se pide), el inicio y el inicio a los 3 s.
import { chromium } from '@playwright/test';
import { join } from 'node:path';
import { preview } from 'vite';

const [salida = '.', ancho = '1920', alto = '1080'] = process.argv.slice(2);
const servidor = await preview({ preview: { port: 4179, strictPort: true }, logLevel: 'silent' });
const navegador = await chromium.launch();
try {
  const pagina = await navegador.newPage({ viewport: { width: Number(ancho), height: Number(alto) } });
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  pagina.on('console', (m) => m.type() === 'error' && errores.push(m.text()));
  if (process.argv.includes('--lento')) {
    // Red lenta para ver la pantalla de carga antes de que llegue el código.
    await pagina.route('**/assets/*.js', async (r) => { await new Promise((ok) => setTimeout(ok, 1500)); await r.continue(); });
    await pagina.goto('http://localhost:4179/', { waitUntil: 'commit' });
    await pagina.waitForTimeout(700);
    await pagina.screenshot({ path: join(salida, 'ver-carga.png') });
  } else {
    await pagina.goto('http://localhost:4179/');
  }
  await pagina.waitForSelector('[data-pantalla="inicio"]', { timeout: 20000 });
  await pagina.waitForTimeout(600);
  await pagina.screenshot({ path: join(salida, 'ver-inicio-0.png') });
  await pagina.waitForTimeout(3000);
  await pagina.screenshot({ path: join(salida, 'ver-inicio-3.png') });
  console.log('errores:', errores.length ? errores : 'ninguno');
} finally {
  await navegador.close();
  await servidor.close();
}
