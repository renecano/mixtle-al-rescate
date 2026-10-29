// Revisa que la mascota del grupo en el camino nunca tape etiquetas, botones ni a Mixtle,
// con la siguiente parada en cada lugar del zigzag, a 1920×1080 y 1024×768.
// Uso: npm run build && node scripts/demo/revisar-ficha.mjs [carpeta-para-capturas]
import { chromium } from '@playwright/test';
import { join } from 'node:path';
import { preview } from 'vite';
import { esperarPantalla, tocarBoton, tocarSelector } from './jugar.mjs';
import { fragmento, grupoEnParada } from './sembrar.mjs';

const carpeta = process.argv[2];
const PUERTO = 4197;
const servidor = await preview({ preview: { port: PUERTO, strictPort: true }, logLevel: 'silent' });
const navegador = await chromium.launch();
const choques = [];
let revisados = 0;
try {
  for (const tam of [{ width: 1920, height: 1080 }, { width: 1024, height: 768 }]) {
    for (let k = 0; k < 9; k++) {
      const p = await navegador.newPage({ viewport: tam });
      await p.addInitScript(() => localStorage.setItem('mixtle-al-rescate:suave', 'si')); // sin brincos: cajas quietas
      await p.goto(`http://localhost:${PUERTO}/?e2e&k=${k}${fragmento([grupoEnParada(k)])}`);
      await esperarPantalla(p, 'inicio');
      await tocarBoton(p, /¡Jugar!/);
      await esperarPantalla(p, 'grupos');
      await tocarSelector(p, `button:has-text("P${k}")`);
      await esperarPantalla(p, 'camino');
      await p.waitForTimeout(1500);
      const r = await p.evaluate(() => {
        const caja = (el) => el.getBoundingClientRect();
        const ficha = document.querySelector('[data-ficha-grupo]');
        if (!ficha) return { sinFicha: true };
        const f = caja(ficha);
        const otros = [
          ...[...document.querySelectorAll('[data-nodo]')].map((e) => ({ que: `botón ${e.dataset.nodo}`, c: caja(e) })),
          ...[...document.querySelectorAll('[data-nodo]')].map((e) => ({ que: `etiqueta ${e.dataset.nodo}`, c: caja(e.nextElementSibling) })),
          ...[...document.querySelectorAll('main [aria-label="Mixtle, el cacomixtle"]')].map((e) => ({ que: 'Mixtle', c: caja(e) })),
        ];
        const cruza = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        return { choques: otros.filter((o) => o.c.width && cruza(f, o.c)).map((o) => o.que), dentro: f.left >= 0 && f.right <= innerWidth };
      });
      revisados += 1;
      if (r.sinFicha || r.choques.length || !r.dentro) choques.push({ tamano: `${tam.width}×${tam.height}`, parada: k, ...r });
      if (carpeta) await p.screenshot({ path: join(carpeta, `ficha-${tam.width}-${k}.png`) });
      await p.close();
    }
  }
} finally {
  await navegador.close();
  await servidor.close();
}
console.log(`${revisados} casos revisados.`, choques.length ? `Problemas: ${JSON.stringify(choques)}` : 'La mascota no tapa nada.');
process.exit(choques.length ? 1 : 0);
