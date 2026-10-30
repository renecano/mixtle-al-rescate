// Capturas de revisión del 30 de octubre: el modo facilitador en 4 tamaños y el paliacate en la monarca.
// Uso: node scripts/capturas-revision.mjs <urlBase> <carpetaSalida> [facilitador|paliacate|todo] [1920x1080,1366x768,…]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import os from 'node:os';

const [base, salida, que = 'todo', tamanos = '1920x1080,1366x768,1280x650,1024x768'] = process.argv.slice(2);
mkdirSync(salida, { recursive: true });
const libre = () => (os.freemem() / 1e9).toFixed(2);
/** Laptop de 8 GB: por debajo de ~1.5 GB libres se avisa (son capturas de segundos; las corridas largas sí se paran). */
const revisarMemoria = () => { if (os.freemem() < 1.45e9) console.warn('  ¡Memoria libre ' + libre() + ' GB (< 1.5 GB)!'); };
console.log('memoria libre al empezar:', libre(), 'GB');
/** Toca un botón cuando ya está quieto dentro de la pantalla (algunos entran deslizándose o laten). */
async function tocar(page, nombre) {
  await page.waitForFunction(() => window.__mixtle.quieto(), null, { timeout: 20000 });
  const boton = page.getByRole('button', { name: nombre, exact: typeof nombre === 'string' });
  const { width, height } = page.viewportSize();
  await boton.first().evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'nearest' })).catch(() => undefined);
  let c = null;
  for (let i = 0; i < 100; i++) {
    c = await boton.boundingBox().catch(() => null);
    if (c && c.y >= 0 && c.x >= 0 && c.y + c.height <= height + 1 && c.x + c.width <= width + 1) break;
    await page.waitForTimeout(200);
  }
  if (!c) throw new Error('no se ve el botón ' + nombre);
  if (c.y + c.height > page.viewportSize().height + 1 || c.y < 0) console.warn('  el botón', nombre, 'sigue fuera de la vista:', JSON.stringify(c));
  await page.mouse.click(c.x + c.width / 2, c.y + c.height / 2);
}
const navegador = await chromium.launch({ channel: 'chrome' });
try {
  if (que === 'facilitador' || que === 'todo') {
    for (const [w, h] of tamanos.split(',').map((t) => t.split('x').map(Number))) {
      revisarMemoria();
      const ctx = await navegador.newContext({ viewport: { width: w, height: h }, hasTouch: w === 1024 });
      const page = await ctx.newPage();
      await page.goto(`${base}/?e2e`);
      await page.waitForFunction(() => window.__mixtle?.pantalla() === 'inicio');
      await page.locator('.transicion-marca').waitFor({ state: 'detached' });
      await tocar(page, /¡Jugar!/);
      await page.waitForFunction(() => window.__mixtle?.pantalla() === 'grupos', null, { timeout: 60000 });
      await page.locator('.transicion-marca').waitFor({ state: 'detached' });
      await tocar(page, 'Nuevo grupo');
      await page.locator('[data-mascota="ardilla"]').click({ force: true });
      await tocar(page, /¡Listo!/);
      await page.waitForFunction(() => window.__mixtle?.pantalla() === 'camino', null, { timeout: 60000 });
      await page.locator('.transicion-marca').waitFor({ state: 'detached' });
      await page.waitForTimeout(800);
      const logo = page.locator('[data-logo]');
      const c = await logo.boundingBox();
      await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(3300);
      await page.mouse.up();
      const dialogo = page.getByRole('dialog', { name: 'Modo facilitador' });
      await dialogo.waitFor();
      await page.waitForTimeout(900);
      const cerrar = await page.getByRole('button', { name: 'Cerrar', exact: true }).boundingBox();
      const sobra = await page.evaluate(() => { const c = document.querySelector('[data-modal-cuerpo]'); return c.scrollHeight - c.clientHeight; });
      console.log(`${w}×${h}: Cerrar y=${cerrar.y.toFixed(0)}..${(cerrar.y + cerrar.height).toFixed(0)} (alto ${h}); el contenido sobra ${sobra} px`);
      await page.screenshot({ path: join(salida, `facilitador-${w}x${h}.png`) });
      await tocar(page, 'Borrar este grupo');
      await page.waitForTimeout(500);
      const cerrar2 = await page.getByRole('button', { name: 'Cerrar', exact: true }).boundingBox();
      console.log(`  con la confirmación abierta: Cerrar ${cerrar2.y.toFixed(0)}..${(cerrar2.y + cerrar2.height).toFixed(0)}`);
      await page.screenshot({ path: join(salida, `facilitador-${w}x${h}-confirmar.png`) });
      await ctx.close();
      console.log('  memoria libre:', libre(), 'GB');
    }
  }
  if (que === 'paliacate' || que === 'todo') {
    const ctx = await navegador.newContext({ viewport: { width: 1600, height: 1000 } });
    const page = await ctx.newPage();
    await page.goto(`${base}/?mixtle`);
    await page.locator('[data-pantalla="revision"]').waitFor({ timeout: 60000 });
    await page.waitForTimeout(1200);
    await page.locator('[data-revision="paliacate"]').screenshot({ path: join(salida, 'paliacate.png') });
    // La monarca sola, grande.
    await page.evaluate(() => { const s = document.querySelector('[data-revision="paliacate"]'); s.scrollIntoView(); });
    const monarca = page.locator('[data-revision="paliacate"] [data-mascota-vestida="monarca"]').first();
    await monarca.screenshot({ path: join(salida, 'paliacate-monarca.png') });
    await ctx.close();
  }
} finally {
  await navegador.close();
  console.log('memoria libre al terminar:', libre(), 'GB');
}
