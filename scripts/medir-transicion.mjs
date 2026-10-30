// Mide la transición al tocar "¡Jugar!" con la CPU 4× más lenta (como Edge en una laptop modesta): cuadros
// por segundo durante los 1.6 s que siguen al toque, el peor cuadro y las tareas largas del hilo principal
// (PerformanceObserver longtask). Uso: npm run build && node scripts/medir-transicion.mjs [veces=3].
// Resultado del 29 de octubre de 2026 en docs/transicion-jugar-4x.json.
import { chromium } from '@playwright/test';
import { preview } from 'vite';

const VECES = Number(process.argv[2] ?? 3);
const URL = 'http://localhost:4370/';
const servidor = await preview({ preview: { port: 4370, strictPort: true }, logLevel: 'silent' });
const navegador = await chromium.launch({ channel: 'chrome', headless: true });
const corridas = [];
try {
  for (let i = 0; i < VECES; i++) {
    const contexto = await navegador.newContext({ viewport: { width: 1280, height: 800 } });
    await contexto.addInitScript(() => {
      // Sondas: cuadros y tareas largas desde el toque en "¡Jugar!" hasta 1.6 s después.
      const c = (window.__transicion = { jugar: null, cuadros: [], largas: [] });
      new PerformanceObserver((l) => l.getEntries().forEach((e) => c.largas.push({ t: e.startTime, ms: Math.round(e.duration), que: e.attribution?.[0]?.name ?? '' }))).observe({ type: 'longtask', buffered: true });
      document.addEventListener('pointerdown', (e) => {
        if (!c.jugar && e.target.closest?.('button')?.textContent?.includes('¡Jugar!')) {
          c.jugar = performance.now();
          const marco = (t) => {
            c.cuadros.push(t);
            if (t - c.jugar < 1600) requestAnimationFrame(marco);
          };
          requestAnimationFrame(marco);
        }
      }, true);
    });
    const p = await contexto.newPage();
    const cdp = await contexto.newCDPSession(p);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await p.goto(URL);
    await p.locator('[data-pantalla="inicio"][data-entrada-lista="true"]').waitFor({ timeout: 30000 });
    await p.waitForTimeout(1500);
    await p.getByRole('button', { name: /¡Jugar!/ }).click({ force: true });
    await p.waitForTimeout(2500);
    const r = await p.evaluate(() => {
      const c = window.__transicion;
      const d = c.cuadros.slice(1).map((t, i) => t - c.cuadros[i]);
      const fps = d.length ? 1000 / (d.reduce((a, b) => a + b, 0) / d.length) : 0;
      const largas = c.largas.filter((l) => l.t >= c.jugar - 50 && l.t <= c.jugar + 1600);
      return { fps: Number(fps.toFixed(1)), cuadros: d.length, peorMs: Math.round(Math.max(0, ...d)), lentos: d.filter((x) => x > 33).length, largas, totalLargasMs: largas.reduce((a, l) => a + l.ms, 0) };
    });
    corridas.push(r);
    console.log(`#${i + 1}: ${r.fps} fps · peor cuadro ${r.peorMs} ms · ${r.lentos} cuadros lentos · tareas largas ${r.largas.length} (${r.totalLargasMs} ms): ${r.largas.map((l) => `${Math.round(l.t - 0)}:${l.ms}ms`).join(' ')}`);
    await contexto.close();
  }
} finally {
  await navegador.close();
  servidor.httpServer.close();
}
const med = (k) => corridas.map((c) => c[k]).sort((a, b) => a - b)[Math.floor((corridas.length - 1) / 2)];
console.log(JSON.stringify({ mediana: { fps: med('fps'), peorMs: med('peorMs'), lentos: med('lentos'), totalLargasMs: med('totalLargasMs') }, corridas }));
