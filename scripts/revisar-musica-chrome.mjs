// Reproduce en Chrome REAL con ventana (no headless) lo que se observó el 29 de octubre de 2026: la
// música que se detenía sola. Modos (argv[2]): "permitido" (Chrome deja el autoplay, como con historial
// de uso: --autoplay-policy=no-user-gesture-required) o "bloqueado" (la política real de Chrome).
// Abre el inicio con ?depurar-audio, observa (con "permitido", 15 s sin tocar), toca el fondo, sigue
// observando (argv[4] segundos, 210 por defecto; la pista da la vuelta a los 39.5 s), esconde la pestaña
// 20 s a la mitad y la vuelve a mostrar, y al final vuelca el estado del <audio> cada 5 s y el registro
// de audio del juego (argv[3]: archivo de salida).
// Uso: npm run build && node scripts/revisar-musica-chrome.mjs permitido salida.txt 120
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { preview } from 'vite';

const MODO = process.argv[2] ?? 'permitido';
const SALIDA = process.argv[3];
const DURACION_S = Number(process.argv[4] ?? 210);
const URL = 'http://localhost:4360/?depurar-audio';
const servidor = await preview({ preview: { port: 4360, strictPort: true }, logLevel: 'silent' });
const navegador = await chromium.launch({
  channel: 'chrome',
  headless: false,
  args: [MODO === 'permitido' ? '--autoplay-policy=no-user-gesture-required' : '--autoplay-policy=document-user-activation-required', '--window-size=1100,700'],
});
const contexto = await navegador.newContext({ viewport: { width: 1000, height: 640 } });
await contexto.addInitScript(() => {
  window.__audiosRene = [];
  const play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (...a) {
    if (!window.__audiosRene.includes(this)) window.__audiosRene.push(this);
    return play.apply(this, a);
  };
});
const p = await contexto.newPage();
const estado = () =>
  p.evaluate(() => {
    const m = (window.__audiosRene ?? []).find((a) => a.src.includes('/musica/'));
    return { t: m ? Number(m.currentTime.toFixed(1)) : null, paused: m?.paused ?? null, ready: m?.readyState ?? null, ctx: window.Howler?.ctx?.state, indicio: !!document.querySelector('[data-toca-para-empezar]'), visible: document.visibilityState, pantalla: document.querySelector('[data-pantalla]')?.dataset.pantalla };
  });
const linea = [];
const anotar = async (que) => {
  const e = await estado();
  const l = `${((Date.now() - t0) / 1000).toFixed(0).padStart(4)} s ${que.padEnd(22)} t=${e.t} paused=${e.paused} ready=${e.ready} ctx=${e.ctx} indicio=${e.indicio} ${e.visible} ${e.pantalla}`;
  linea.push(l);
  console.log(l);
};
const t0 = Date.now();
try {
  await p.goto(URL);
  await p.locator('[data-pantalla="inicio"][data-entrada-lista="true"]').waitFor({ timeout: 30000 });
  await anotar('inicio listo');
  // Con autoplay permitido se observan 15 s sin tocar (¿arranca sola?); luego, en los dos modos, un toque en el fondo.
  if (MODO === 'permitido') {
    await p.waitForTimeout(15000);
    await anotar('15 s sin tocar');
  }
  await p.mouse.click(60, 400);
  await anotar('toque en el fondo');
  // Observa; a la mitad, esconde la pestaña 20 s (otra pestaña al frente) y vuelve.
  const mitad = Math.floor(DURACION_S / 2);
  for (let s = 5; s <= DURACION_S; s += 5) {
    await p.waitForTimeout(5000);
    if (s === mitad) {
      const otra = await contexto.newPage();
      await otra.goto('about:blank');
      await otra.bringToFront();
      await anotar('pestaña escondida');
      await p.waitForTimeout(20000);
      await p.bringToFront();
      await otra.close();
      await anotar('pestaña de vuelta');
      s += 20;
      continue;
    }
    await anotar('observando');
  }
  const registro = await p.evaluate(() => window.__registroAudio?.().map((e) => `${e.hora} ${e.evento}${e.datos ? ' ' + JSON.stringify(e.datos) : ''}`).join('\n'));
  if (SALIDA) writeFileSync(SALIDA, `${linea.join('\n')}\n\n=== registro de audio del juego ===\n${registro}\n`);
  console.log('\n=== registro de audio del juego (últimas 60 líneas) ===');
  console.log(registro.split('\n').slice(-60).join('\n'));
} finally {
  await navegador.close();
  servidor.httpServer.close();
}
