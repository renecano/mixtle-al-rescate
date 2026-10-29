// Tráiler de "Mixtle al rescate" (30 a 45 s) para la reunión con Eco Urban.
// 1. Juega de verdad en Chrome (con ventana y tarjeta de video, a 1920×1080), con Playwright.
// 2. Graba aparte cada momento con el screencast de Chrome (CDP): cada cuadro trae su hora exacta,
//    así el video no se desfasa (el video continuo de Playwright omite cuadros sin cambios y se corría).
//    Momentos: el inicio, la entrada al camino, una lección con tres aciertos, el cofre, el parque que
//    se transforma, una aventura y el cierre con el logo.
// 3. Con ffmpeg arma cada momento a 30 cuadros por segundo, los une con fundidos y pone la música.
// Uso: npm run build && node scripts/trailer.mjs   → docs/trailer/mixtle-al-rescate.mp4
import { chromium } from '@playwright/test';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { preview } from 'vite';
import { pythonDelEntorno, RAIZ } from './voz/comun.mjs';
import { ejercicioEnPantalla, entrarConGrupoNuevo, esperarPantalla, resolver, seguir, tocarBoton, tocarSelector } from './demo/jugar.mjs';
import { fragmento, grupoConCofre } from './demo/sembrar.mjs';

const PUERTO = 4195;
const URL = `http://localhost:${PUERTO}`;
const SALIDA = join(RAIZ, 'docs', 'trailer', 'mixtle-al-rescate.mp4');
const MUSICA = join(RAIZ, 'public', 'musica', 'lecciones.mp3');
const FUNDIDO = 0.35;

const ffmpeg = spawnSync(pythonDelEntorno(), ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())'], { encoding: 'utf8' }).stdout.trim();
if (!ffmpeg) throw new Error('No encontré ffmpeg (npm run voz:preparar instala el entorno que lo trae).');

const carpetaVideo = mkdtempSync(join(tmpdir(), 'mixtle-trailer-'));
const servidor = await preview({ preview: { port: PUERTO, strictPort: true }, logLevel: 'silent' });
const navegador = await chromium.launch({ channel: 'chrome', headless: false, args: ['--window-size=1920,1080'] });
const contexto = await navegador.newContext({ viewport: { width: 1920, height: 1080 } });
// Con todas las animaciones (es el tráiler): el facilitador "las dejó así" en este aparato.
await contexto.addInitScript(() => localStorage.setItem('mixtle-al-rescate:suave', 'no'));
const pagina = await contexto.newPage();
const cdp = await contexto.newCDPSession(pagina);
let cuadros = null;
cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
  cuadros?.push({ data, t: metadata.timestamp });
  void cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => undefined);
});
const momentos = [];
/** Graba un momento: lo que pasa dentro de `hacer`, más `extra` segundos al final; lo guarda como clip. */
async function momento(nombre, hacer, extra = 0) {
  cuadros = [];
  const desde = Date.now() / 1000;
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080 });
  await hacer();
  if (extra) await pagina.waitForTimeout(extra * 1000);
  await cdp.send('Page.stopScreencast');
  const hasta = Date.now() / 1000;
  const lista = cuadros;
  cuadros = null;
  // Cada cuadro dura hasta el siguiente; el último, hasta el final del momento.
  const carpeta = join(carpetaVideo, String(momentos.length));
  mkdirSync(carpeta);
  const lineas = [];
  lista.forEach((c, i) => {
    const archivo = join(carpeta, `${String(i).padStart(5, '0')}.jpg`);
    writeFileSync(archivo, Buffer.from(c.data, 'base64'));
    const fin = i < lista.length - 1 ? lista[i + 1].t : hasta;
    lineas.push(`file '${archivo.replace(/\\/g, '/')}'`, `duration ${Math.max(0.001, fin - c.t).toFixed(4)}`);
  });
  if (lista.length) lineas.push(`file '${join(carpeta, `${String(lista.length - 1).padStart(5, '0')}.jpg`).replace(/\\/g, '/')}'`);
  const indice = join(carpeta, 'cuadros.txt');
  writeFileSync(indice, lineas.join('\n'));
  const clip = join(carpetaVideo, `${momentos.length}.mp4`);
  const r = spawnSync(ffmpeg, ['-y', '-f', 'concat', '-safe', '0', '-i', indice, '-vf', 'fps=30,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2', '-c:v', 'libx264', '-preset', 'fast', '-crf', '16', '-pix_fmt', 'yuv420p', clip], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr.slice(-1500));
  const dur = lista.length ? hasta - lista[0].t : 0;
  momentos.push({ nombre, clip, dur });
  console.log(`${nombre}: ${dur.toFixed(1)} s, ${lista.length} cuadros (${(lista.length / Math.max(0.1, hasta - desde)).toFixed(0)} por segundo)`);
}

try {
  // 1. El inicio: la pantalla de carga, el parque en capas, Mixtle columpiándose y el logo.
  await momento('inicio', async () => {
    await pagina.goto(`${URL}/?e2e`, { waitUntil: 'commit' });
    await esperarPantalla(pagina, 'inicio');
  }, 3.4);
  // 2. "¡Jugar!", la transición de marca y un grupo nuevo hasta el camino.
  await momento('al camino', async () => {
    await entrarConGrupoNuevo(pagina, 'ajolote');
  }, 1.6);
  // 3. Una lección: tres aciertos seguidos (lluvia de hojitas, contador, "¡3 seguidas!").
  await tocarSelector(pagina, '[data-nodo^="leccion:"]');
  await esperarPantalla(pagina, 'leccion');
  await momento('lección', async () => {
    for (let i = 0; i < 3; i++) {
      await resolver(pagina, await ejercicioEnPantalla(pagina));
      await pagina.waitForTimeout(i < 2 ? 1300 : 2200);
      if (i < 2) await seguir(pagina);
    }
  });
  // 4. El cofre: lo que trae, se sacude y estalla.
  // Otra dirección (no solo otro #fragmento): así la página se carga de nuevo y llega el grupo de ejemplo.
  await pagina.goto(`${URL}/?e2e&demo=cofre${fragmento([grupoConCofre()])}`);
  await esperarPantalla(pagina, 'inicio');
  await tocarBoton(pagina, /¡Jugar!/);
  await esperarPantalla(pagina, 'grupos');
  await tocarSelector(pagina, 'button:has-text("Ardilla 2°B")');
  await esperarPantalla(pagina, 'camino');
  await pagina.locator('[data-nodo="cofre:u1"]').evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await pagina.waitForTimeout(900);
  await momento('cofre', async () => {
    await tocarSelector(pagina, '[data-nodo="cofre:u1"]');
    await pagina.waitForTimeout(1400);
    await pagina.locator('[data-fase-cofre] button').click({ force: true });
  }, 2.6);
  // 5. El parque del grupo se transforma (demo con el componente real).
  await pagina.goto(`${URL}/?vitrina=parque`);
  await pagina.waitForSelector('[data-vitrina="parque"]');
  await momento('parque', async () => undefined, 6);
  // 6. Una aventura: en bici a la escuela (unidad 4).
  await pagina.goto(`${URL}/?e2e&escena=Bici&unidad=u4`);
  await pagina.waitForFunction(() => window.__mixtle?.escenas?.().includes('Bici'), null, { timeout: 30000 });
  await pagina.waitForTimeout(1500);
  await momento('aventura', async () => undefined, 5.5);
  // 7. Cierre: el logo con el lema y la invitación.
  await pagina.goto(`${URL}/?vitrina=invitacion`);
  await pagina.waitForSelector('[data-vitrina="invitacion"]');
  await momento('cierre', async () => undefined, 4);
} finally {
  await contexto.close();
  await navegador.close();
  await servidor.close();
}

const total = momentos.reduce((s, m) => s + m.dur, 0);
console.log(`Total: ${total.toFixed(1)} s en ${momentos.length} momentos`);

// Cada clip con fundido de entrada y salida; luego todos juntos y la música encima.
const entradas = momentos.flatMap((m) => ['-i', m.clip]);
const filtros = momentos.map((m, i) => `[${i}:v]setpts=PTS-STARTPTS,fade=t=in:st=0:d=${FUNDIDO},fade=t=out:st=${(m.dur - FUNDIDO).toFixed(3)}:d=${FUNDIDO}[v${i}]`);
const unir = `${momentos.map((_, i) => `[v${i}]`).join('')}concat=n=${momentos.length}:v=1:a=0[v]`;
const audio = `[${momentos.length}:a]atrim=0:${total.toFixed(3)},afade=t=in:st=0:d=1,afade=t=out:st=${(total - 2.5).toFixed(3)}:d=2.5,volume=0.85[a]`;
mkdirSync(join(RAIZ, 'docs', 'trailer'), { recursive: true });
const r = spawnSync(
  ffmpeg,
  ['-y', ...entradas, '-stream_loop', '-1', '-i', MUSICA, '-filter_complex', [...filtros, unir, audio].join(';'), '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-shortest', SALIDA],
  { encoding: 'utf8' },
);
if (r.status !== 0) {
  console.error(r.stderr.slice(-2000));
  process.exit(1);
}
rmSync(carpetaVideo, { recursive: true, force: true });
console.log(`Listo: docs/trailer/mixtle-al-rescate.mp4 (${total.toFixed(1)} s, ${(statSync(SALIDA).size / 1024 / 1024).toFixed(1)} MB)`);
