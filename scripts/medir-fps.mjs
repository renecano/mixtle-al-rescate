// Mide los cuadros por segundo reales (requestAnimationFrame) en los momentos más pesados de la v3,
// en esta computadora, a tamaño proyector (1920×1080) y tablet (1024×768). Sirve dist/ con vite preview.
// Uso: npm run build && node scripts/medir-fps.mjs [--con-ventana]
//   Sin opciones: Chromium sin ventana (headless), que dibuja sin tarjeta de video: es el peor caso.
//   --con-ventana: el Chrome instalado, con ventana y tarjeta de video, como lo usa Eco Urban.
//   --suave: con "animaciones suaves" encendidas (modo facilitador).
//   --solo=camino: solo los escenarios cuyo nombre empieza así (por ejemplo, para comparar el camino
//   con y sin las decoraciones de los lados en las mismas condiciones).
// Imprime una tabla y escribe docs/rendimiento-v3.json (o rendimiento-v3-sin-ventana.json).
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { cpus, totalmem } from 'node:os';
import { join } from 'node:path';
import { preview } from 'vite';
import { esperarPantalla, tocarBoton, tocarSelector } from './demo/jugar.mjs';
import { fragmento, grupoUnidadCompleta } from './demo/sembrar.mjs';

const PUERTO = 4190;
const URL = `http://localhost:${PUERTO}`;

/** Cuenta cuadros durante `ms` y devuelve promedio, percentil 5 de fps y % de cuadros lentos (>20 ms). */
async function medir(pagina, ms, mientras) {
  await pagina.evaluate((duracion) => {
    window.__cuadros = [];
    const inicio = performance.now();
    let anterior = inicio;
    const paso = (t) => {
      window.__cuadros.push(t - anterior);
      anterior = t;
      if (t - inicio < duracion) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }, ms);
  await Promise.all([mientras?.(), pagina.waitForTimeout(ms + 200)]);
  const cuadros = (await pagina.evaluate(() => window.__cuadros)).slice(1);
  // Una medición con muy pocos cuadros no es válida (la página no se estaba dibujando): se avisa.
  if (conVentana && cuadros.length < (ms / 1000) * 10) throw new Error(`Medición inválida: solo ${cuadros.length} cuadros en ${ms} ms (¿ventana tapada o minimizada?)`);
  const orden = [...cuadros].sort((a, b) => a - b);
  const p95 = orden[Math.floor(orden.length * 0.95)] ?? 0;
  const promedio = cuadros.reduce((s, c) => s + c, 0) / Math.max(1, cuadros.length);
  const mediana = orden[Math.floor(orden.length / 2)] ?? 0;
  return {
    fps: Math.round(1000 / promedio),
    // La mediana y la pausa más larga separan "animación lenta" de "la computadora se detuvo un momento".
    fpsMediana: Math.round(1000 / mediana),
    pausaMaxMs: Math.round(orden[orden.length - 1] ?? 0),
    fpsP5: Math.round(1000 / p95),
    lentos: Math.round((cuadros.filter((c) => c > 20).length / Math.max(1, cuadros.length)) * 1000) / 10,
    cuadros: cuadros.length,
  };
}

const ESCENARIOS = [
  {
    nombre: 'Inicio: entrada (capas, Mixtle columpiándose, logo) y paralaje',
    correr: async (p) => {
      await p.goto(`${URL}/`);
      await p.waitForSelector('[data-pantalla="inicio"]');
      const tam = p.viewportSize();
      return medir(p, 4000, async () => {
        for (let i = 0; i < 40; i++) {
          await p.mouse.move((tam.width * (i % 10)) / 10, (tam.height * ((i * 3) % 10)) / 10);
          await p.waitForTimeout(90);
        }
      });
    },
  },
  {
    nombre: 'Lección (demo): hojitas que vuelan al contador, chispas, racha',
    correr: async (p) => {
      await p.goto(`${URL}/?vitrina=leccion`);
      await p.waitForSelector('[data-vitrina="leccion"]');
      return medir(p, 5000);
    },
  },
  {
    nombre: 'Cofre (demo): se sacude, estalla, rayos girando',
    correr: async (p) => {
      await p.goto(`${URL}/?vitrina=cofre`);
      await p.waitForSelector('[data-vitrina="cofre"]');
      return medir(p, 4500);
    },
  },
  {
    nombre: 'Camino: desplazarse por los ambientes de las 5 unidades',
    correr: (p) => desplazarCamino(p, true),
  },
  {
    nombre: 'Camino sin decoraciones (para comparar en las mismas condiciones)',
    correr: (p) => desplazarCamino(p, false),
  },
];

/** Entra al camino con un grupo de ejemplo y lo recorre con la rueda del ratón (con o sin decoraciones). */
async function desplazarCamino(p, conDecoraciones) {
  await p.goto(`${URL}/?e2e${fragmento([grupoUnidadCompleta()])}`);
  await esperarPantalla(p, 'inicio');
  await tocarBoton(p, /¡Jugar!/);
  await esperarPantalla(p, 'grupos');
  await tocarSelector(p, 'button:has-text("Ajolote 1°A")');
  await esperarPantalla(p, 'camino');
  await p.waitForTimeout(1200);
  if (!conDecoraciones) await p.addStyleTag({ content: '.decoraciones{display:none!important}' });
  return medir(p, 4000, async () => {
    for (let i = 0; i < 30; i++) {
      await p.mouse.move(960, 600);
      await p.mouse.wheel(0, i < 15 ? 260 : -260);
      await p.waitForTimeout(110);
    }
  });
}

const TAMANOS = [
  { nombre: 'proyector', width: 1920, height: 1080 },
  { nombre: 'tablet', width: 1024, height: 768 },
];

const servidor = await preview({ preview: { port: PUERTO, strictPort: true }, logLevel: 'silent' });
const conVentana = process.argv.includes('--con-ventana');
const suave = process.argv.includes('--suave');
// Sin que Chrome frene la ventana si queda tapada por otra (si no, los cuadros no reflejan el juego).
const SIN_FRENOS = [
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--disable-background-timer-throttling',
  // Windows: Chrome calcula si su ventana quedó tapada y deja de dibujar.
  '--disable-features=CalculateNativeWinOcclusion',
];
const navegador = await chromium.launch(conVentana ? { channel: 'chrome', headless: false, args: SIN_FRENOS } : { args: SIN_FRENOS });
const resultados = [];
try {
  for (const tam of TAMANOS) {
    const solo = process.argv.find((a) => a.startsWith('--solo='))?.slice(7).toLowerCase();
    for (const e of ESCENARIOS.filter((x) => !solo || x.nombre.toLowerCase().startsWith(solo))) {
      const pagina = await navegador.newPage({ viewport: { width: tam.width, height: tam.height } });
      if (suave) await pagina.addInitScript(() => localStorage.setItem('mixtle-al-rescate:suave', 'si'));
      const r = await e.correr(pagina).catch((err) => {
        throw new Error(`${tam.nombre} · ${e.nombre}: ${err.message}`);
      });
      resultados.push({ tamano: tam.nombre, escenario: e.nombre, ...r });
      console.log(`${tam.nombre.padEnd(9)} ${String(r.fps).padStart(3)} fps (mediana ${String(r.fpsMediana).padStart(3)}, p5 ${String(r.fpsP5).padStart(3)}, lentos ${String(r.lentos).padStart(4)} %, pausa máx. ${String(r.pausaMaxMs).padStart(5)} ms)  ${e.nombre}`);
      await pagina.close();
    }
  }
} finally {
  await navegador.close();
  await servidor.close();
}
const equipo = {
  cpu: cpus()[0]?.model.trim(),
  nucleos: cpus().length,
  memoriaGB: Math.round(totalmem() / 1024 ** 3),
  animacionesSuaves: suave,
  navegador: conVentana ? `Chrome ${navegador.version()} con ventana y tarjeta de video` : `Chromium ${navegador.version()} sin ventana (sin tarjeta de video)`,
};
const soloArchivo = process.argv.find((x) => x.startsWith('--solo='))?.slice(7);
const archivo = `rendimiento-v3${conVentana ? '' : '-sin-ventana'}${suave ? '-suave' : ''}${soloArchivo ? `-${soloArchivo}` : ''}.json`;
writeFileSync(join(process.cwd(), 'docs', archivo), `${JSON.stringify({ fecha: new Date().toISOString().slice(0, 10), equipo, resultados }, null, 2)}\n`);
console.log(`Equipo: ${equipo.cpu} · ${equipo.nucleos} núcleos · ${equipo.memoriaGB} GB · ${equipo.navegador}. Guardado en docs/${archivo}`);
