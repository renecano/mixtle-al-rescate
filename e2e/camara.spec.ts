import { expect, test } from '@playwright/test';
import { HOSTS_MODELO, abrir, captura, esperarEscena, esperarTocable, tocar } from './ayudas';

test.skip(!!process.env.SIN_RED, 'Necesita internet para descargar MobileNet.');

test('con cámara: el modelo se descarga solo al pedirlo, clasifica en el navegador y la cámara se apaga al salir', async ({ page }, info) => {
  const { errores, peticiones } = await abrir(page, '/?e2e&escena=Bonus');
  await esperarEscena(page, 'Bonus');
  await page.waitForTimeout(1500);
  // Ni la cámara ni el modelo se piden antes de tocar el botón.
  expect(peticiones.filter((r) => HOSTS_MODELO.test(r.url()))).toHaveLength(0);
  expect(await page.evaluate(() => window.__caco.camarasActivas())).toBe(0);

  const inicio = Date.now();
  await tocar(page, 'muestrale-a-caco');
  await esperarTocable(page, 'adivina', 300_000);
  const segundos = (Date.now() - inicio) / 1000;
  expect(await page.evaluate(() => window.__caco.camarasActivas())).toBe(1);
  const delModelo = peticiones.filter((r) => HOSTS_MODELO.test(r.url()));
  expect(delModelo.length).toBeGreaterThan(0);
  let bytes = 0;
  for (const r of delModelo) bytes += (await (await r.response())?.body().catch(() => Buffer.alloc(0)))?.length ?? 0;
  info.annotations.push({ type: 'modelo', description: `${delModelo.length} archivos, ${(bytes / 1e6).toFixed(1)} MB, listo en ${segundos.toFixed(1)} s` });
  await captura(page, info, 'camara-lista');

  // La imagen de prueba (patrón verde) no es basura: Caco pide ayuda y muestra los botes.
  await tocar(page, 'adivina');
  await tocar(page, 'bote-organico', 30_000);
  await captura(page, info, 'camara-despues-de-elegir');

  await tocar(page, 'ir-al-diploma');
  await esperarEscena(page, 'Final');
  expect(await page.evaluate(() => window.__caco.camarasActivas())).toBe(0);
  expect(await page.locator('video').count()).toBe(0);

  expect(peticiones.filter((r) => r.method() !== 'GET').map((r) => `${r.method()} ${r.url()}`)).toEqual([]);
  expect(errores.filter((e) => !/WebGL|GPU stall|backend/i.test(e))).toEqual([]);
});
