import { expect, test, type Page } from '@playwright/test';
import { CATEGORIAS } from '../src/data/categorias';
import { RESIDUOS } from '../src/data/residuos';
import { categoriaDe } from '../src/logica/clasificacion';
import { abrir, captura, esperarEscena, esperarPantalla, esperarTocable, tocables, tocar } from './ayudas';

/*
 * Las aventuras nuevas (unidades 2 a 5), de principio a fin, entrando directo con el atajo de pruebas
 * `?e2e&escena=<Escena>&unidad=<id>`. Sin grupo elegido, al terminar se vuelve al inicio.
 */

const marcador = (page: Page) => page.evaluate(() => window.__caco.marcador());

function boteDe(idResiduo: string): string {
  const r = RESIDUOS.find((x) => x.id === idResiduo)!;
  return `bote-${categoriaDe(r, CATEGORIAS)!.id}`;
}

/** Toca, uno por uno, todos los objetos cuyo nombre empieza con `prefijo`, hasta que no quede ninguno. */
async function tocarTodos(page: Page, prefijo: string, espera = 700, maximo = 40): Promise<number> {
  let veces = 0;
  while ((await tocables(page)).some((t) => t.nombre.startsWith(prefijo)) && veces < maximo) {
    await tocar(page, prefijo);
    veces += 1;
    await page.waitForTimeout(espera);
  }
  return veces;
}

/** Diploma y salida: el botón "Volver al camino" cierra Phaser. */
async function terminarEnDiploma(page: Page, info: Parameters<typeof captura>[1], nombre: string) {
  await tocar(page, 'siguiente');
  await esperarEscena(page, 'Final');
  await esperarTocable(page, 'terminar-aventura');
  await captura(page, info, nombre);
  await tocar(page, 'terminar-aventura');
  await esperarPantalla(page, 'inicio');
  expect(await page.locator('canvas').count()).toBe(0);
}

test('unidad 2 — Rescate en el parque: liberar a los animales y separar su basura', async ({ page }, info) => {
  const { errores, peticiones } = await abrir(page, '/?e2e&escena=Rescate&unidad=u2');
  await esperarEscena(page, 'Rescate');
  await page.waitForTimeout(900);
  await captura(page, info, 'aventura-u2-rescate');

  await tocarTodos(page, 'basura-');
  await expect.poll(async () => (await marcador(page))?.rescatados).toBe(4);

  // Segunda parte: cada pieza recogida va a su bote (se toca el bote).
  for (let i = 0; i < 6; i++) {
    const pieza = await esperarTocable(page, 'pieza-');
    if (i === 0) await captura(page, info, 'aventura-u2-separar');
    await tocar(page, boteDe(pieza.nombre.replace('pieza-', '')));
    await expect.poll(async () => (await marcador(page))?.separados).toBe(i + 1);
  }
  await terminarEnDiploma(page, info, 'aventura-u2-diploma');

  expect(peticiones.filter((r) => r.method() !== 'GET').map((r) => `${r.method()} ${r.url()}`)).toEqual([]);
  expect(errores).toEqual([]);
});
