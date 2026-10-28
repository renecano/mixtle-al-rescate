import { expect, test, type Page } from '@playwright/test';
import { CATEGORIAS } from '../src/data/categorias';
import { RESIDUOS } from '../src/data/residuos';
import { COSAS_LONCHERA } from '../src/aventuras/datos';
import { categoriaDe } from '../src/logica/clasificacion';
import { abrir, captura, esperarEscena, esperarPantalla, esperarTocable, tocables, tocar } from './ayudas';

/*
 * Las aventuras nuevas (unidades 2 a 5), de principio a fin, entrando directo con el atajo de pruebas
 * `?e2e&escena=<Escena>&unidad=<id>`. Sin grupo elegido, al terminar se vuelve al inicio.
 */

const marcador = (page: Page) => page.evaluate(() => window.__mixtle.marcador());

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

test('unidad 3 — Siembra un bosquecito: plantar seis arbolitos y regarlos hasta que crezcan', async ({ page }, info) => {
  const { errores } = await abrir(page, '/?e2e&escena=Bosque&unidad=u3');
  await esperarEscena(page, 'Bosque');
  await page.waitForTimeout(900);
  await captura(page, info, 'aventura-u3-bosque');
  await tocarTodos(page, 'hoyo-', 500);
  await expect.poll(async () => (await marcador(page))?.sembrados).toBe(6);
  // Cada arbolito se riega dos veces; se toca hasta que ya no quede ninguno por regar.
  await tocarTodos(page, 'arbolito-', 1300, 30);
  await expect.poll(async () => (await marcador(page))?.riegos).toBe(12);
  await captura(page, info, 'aventura-u3-crecido');
  await terminarEnDiploma(page, info, 'aventura-u3-diploma');
  expect(errores).toEqual([]);
});

test('unidad 4 — En bici a la escuela: cambiar de carril y llegar', async ({ page }, info) => {
  const { errores } = await abrir(page, '/?e2e&escena=Bici&unidad=u4');
  await esperarEscena(page, 'Bici');
  await page.waitForTimeout(900);
  await captura(page, info, 'aventura-u4-bici');
  // Cambiarse de carril de vez en cuando; el humo nunca castiga, solo hace toser a Mixtle.
  for (const carril of ['arriba', 'abajo', 'arriba', 'abajo']) {
    await page.waitForTimeout(4000);
    await tocar(page, `carril-${carril}`);
  }
  await expect.poll(async () => (await marcador(page))?.terminado, { timeout: 90_000 }).toBe(1);
  const m = (await marcador(page))!;
  expect((m.hojitas ?? 0) + (m.esquivadas ?? 0) + (m.toses ?? 0)).toBeGreaterThan(0);
  await terminarEnDiploma(page, info, 'aventura-u4-diploma');
  expect(errores).toEqual([]);
});

test('unidad 5 — Mi lonchera sin basura: cada cosa a la lonchera o a "Mejor no"', async ({ page }, info) => {
  const { errores } = await abrir(page, '/?e2e&escena=Lonchera&unidad=u5');
  await esperarEscena(page, 'Lonchera');
  for (let i = 0; i < COSAS_LONCHERA.length; i++) {
    const pieza = await esperarTocable(page, 'pieza-');
    if (i === 0) await captura(page, info, 'aventura-u5-lonchera');
    const cosa = COSAS_LONCHERA.find((c) => c.id === pieza.nombre.replace('pieza-', ''))!;
    // La primera, a propósito, al lugar equivocado: regresa sin castigo.
    if (i === 0) {
      await tocar(page, cosa.reutilizable ? 'destino-mejor-no' : 'destino-lonchera');
      await page.waitForTimeout(800);
      expect(await marcador(page)).toEqual({ reutilizables: 0, evitados: 0 });
    }
    await tocar(page, cosa.reutilizable ? 'destino-lonchera' : 'destino-mejor-no');
    await expect.poll(async () => {
      const m = (await marcador(page))!;
      return (m.reutilizables ?? 0) + (m.evitados ?? 0);
    }).toBe(i + 1);
  }
  await terminarEnDiploma(page, info, 'aventura-u5-diploma');
  expect(errores).toEqual([]);
});
