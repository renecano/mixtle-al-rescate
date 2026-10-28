// Herramienta de desarrollo: sirve dist/ con vite preview y toma capturas en momentos dados.
// Uso: node scripts/ver.mjs <carpeta-salida> [--ruta=/?vitrina] [--tiempos=500,1500,3000] [--nombre=inicio]
//        [--ancho=1920] [--alto=1080] [--tocar="texto del botón"] [--lento] [--movimiento-reducido]
// Con --tocar, toca ese botón después de la primera captura y sigue capturando en los mismos tiempos.
import { chromium } from '@playwright/test';
import { join } from 'node:path';
import { preview } from 'vite';

const args = process.argv.slice(2);
const salida = args.find((a) => !a.startsWith('--')) ?? '.';
const op = (n, def) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? def;
const ruta = op('ruta', '/');
const tiempos = op('tiempos', '600,3000').split(',').map(Number);
const nombre = op('nombre', 'ver');
const tocar = op('tocar', '');

const servidor = await preview({ preview: { port: 4179, strictPort: true }, logLevel: 'silent' });
const navegador = await chromium.launch();
try {
  const pagina = await navegador.newPage({
    viewport: { width: Number(op('ancho', 1920)), height: Number(op('alto', 1080)) },
    reducedMotion: args.includes('--movimiento-reducido') ? 'reduce' : 'no-preference',
  });
  const errores = [];
  pagina.on('pageerror', (e) => errores.push(e.message));
  pagina.on('console', (m) => m.type() === 'error' && errores.push(m.text()));
  if (args.includes('--lento')) {
    await pagina.route('**/assets/*.js', async (r) => {
      await new Promise((ok) => setTimeout(ok, 1500));
      await r.continue();
    });
  }
  await pagina.goto(`http://localhost:4179${ruta}`);
  await pagina.waitForSelector('[data-pantalla]', { timeout: 20000 });
  const capturar = async (prefijo) => {
    let antes = 0;
    for (const t of tiempos) {
      await pagina.waitForTimeout(t - antes);
      antes = t;
      await pagina.screenshot({ path: join(salida, `${prefijo}-${t}.png`) });
    }
  };
  await capturar(nombre);
  if (tocar) {
    await pagina.getByRole('button', { name: tocar }).click();
    await capturar(`${nombre}-tocar`);
  }
  console.log('errores:', errores.length ? errores : 'ninguno');
} finally {
  await navegador.close();
  await servidor.close();
}
