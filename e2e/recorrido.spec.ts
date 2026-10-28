import { expect, test } from '@playwright/test';
import { CATEGORIAS } from '../src/data/categorias';
import { RESIDUOS } from '../src/data/residuos';
import { BASURAS_BONUS } from '../src/aventuras/datos';
import { categoriaDe } from '../src/logica/clasificacion';
import {
  abrir,
  arrastrar,
  captura,
  crearGrupo,
  desbloquearTodo,
  esperarEscena,
  esperarPantalla,
  esperarTocable,
  resumen,
  tocables,
  tocar,
  tocarBoton,
} from './ayudas';

function boteCorrecto(idResiduo: string): string {
  const r = RESIDUOS.find((x) => x.id === idResiduo)!;
  return `bote-${categoriaDe(r, CATEGORIAS)!.id}`;
}

function boteIncorrecto(idResiduo: string): string {
  const correcto = boteCorrecto(idResiduo);
  return `bote-${CATEGORIAS.find((c) => `bote-${c.id}` !== correcto)!.id}`;
}

test('aventura de la unidad 1 completa: grupo → facilitador → intro → 3 niveles → lluvia de basura → diploma → estampa', async ({ page }, info) => {
  const { errores, peticiones } = await abrir(page);

  // Inicio (pantalla de React) → crear un grupo → camino.
  await esperarPantalla(page, 'inicio');
  await captura(page, info, '1-inicio');
  await tocarBoton(page, /¡Jugar!/);
  await crearGrupo(page, 'ardilla');
  // Modo facilitador (mantener el logo 3 s) para abrir directo la aventura de la unidad 1.
  await desbloquearTodo(page);
  await page.locator('[data-nodo="aventura:u1"]').click({ force: true });

  // Intro: tres frases, se avanza tocando.
  await esperarEscena(page, 'Intro');
  await page.waitForTimeout(800);
  await captura(page, info, '2-intro');
  for (let i = 0; i < 3; i++) {
    await tocar(page, 'siguiente');
    await page.waitForTimeout(500);
  }

  // Nivel 1: recoger toda la basura.
  await esperarEscena(page, 'Nivel1');
  await page.waitForTimeout(800);
  await captura(page, info, '3-nivel1');
  await page.waitForTimeout(1500);
  info.annotations.push({ type: 'fps nivel 1', description: String(await page.evaluate(() => window.__caco.fps())) });
  for (let i = 0; i < RESIDUOS.length; i++) {
    await tocar(page, 'residuo-');
    await page.waitForTimeout(250);
  }
  await tocar(page, 'siguiente');

  // Nivel 2: un intento al bote equivocado (no castiga ni suma), luego al correcto.
  await esperarEscena(page, 'Nivel2');
  for (let i = 0; i < RESIDUOS.length; i++) {
    const residuo = await esperarTocable(page, 'residuo-');
    const id = residuo.nombre.replace('residuo-', '');
    const lista = await tocables(page);
    if (i === 0) {
      await captura(page, info, '4-nivel2');
      await arrastrar(page, residuo, lista.find((t) => t.nombre === boteIncorrecto(id))!);
      await page.waitForTimeout(1200);
      expect((await resumen(page)).residuosSeparados).toBe(0);
      // El residuo regresó al centro y se puede volver a intentar.
      const otraVez = await esperarTocable(page, `residuo-${id}`);
      expect(Math.abs(otraVez.x - residuo.x)).toBeLessThan(40);
      await captura(page, info, '5-nivel2-pista');
    }
    if (i === 1) {
      // Alternativa sin arrastrar: tocar el bote.
      await tocar(page, boteCorrecto(id));
    } else {
      const fresco = await esperarTocable(page, `residuo-${id}`);
      await arrastrar(page, fresco, (await tocables(page)).find((t) => t.nombre === boteCorrecto(id))!);
    }
    await expect.poll(async () => (await resumen(page)).residuosSeparados).toBe(i + 1);
  }
  await tocar(page, 'siguiente');

  // Nivel 3: sembrar en todos los lugares limpios.
  await esperarEscena(page, 'Nivel3');
  await page.waitForTimeout(600);
  await captura(page, info, '6-nivel3');
  while ((await tocables(page)).some((t) => t.nombre.startsWith('tierra-'))) {
    await tocar(page, 'tierra-');
    await page.waitForTimeout(400);
  }
  await tocar(page, 'siguiente');

  // Bonus "Lluvia de basura": cae una basura a la vez y se toca su bote. La primera, a propósito,
  // al bote equivocado (no castiga) y la segunda se deja caer hasta el suelo (vuelve a caer).
  await esperarEscena(page, 'Bonus');
  for (let i = 0; i < BASURAS_BONUS; i++) {
    const cae = await esperarTocable(page, 'cae-', 90_000);
    const id = cae.nombre.replace('cae-', '');
    if (i === 0) {
      await page.waitForTimeout(1500);
      await captura(page, info, '7-bonus');
      await tocar(page, boteIncorrecto(id));
      await page.waitForTimeout(800);
      expect((await resumen(page)).residuosSeparados).toBe(RESIDUOS.length);
    }
    if (i === 1) {
      // Llega al suelo sin elegir bote: Mixtle avisa y vuelve a caer; nada se pierde.
      await page.waitForTimeout(11_000);
      await esperarTocable(page, `cae-${id}`);
    }
    await tocar(page, boteCorrecto(id));
    await expect.poll(async () => (await resumen(page)).residuosSeparados, { timeout: 15_000 }).toBe(RESIDUOS.length + i + 1);
  }
  await captura(page, info, '8-bonus-fin');
  await tocar(page, 'ir-al-diploma');

  // Diploma con los números de la partida.
  await esperarEscena(page, 'Final');
  await esperarTocable(page, 'terminar-aventura');
  await captura(page, info, '9-diploma');
  expect(await resumen(page)).toMatchObject({ residuosSeparados: RESIDUOS.length + BASURAS_BONUS, animalesAyudados: 10 });

  // Al terminar se sale de la aventura (Phaser se destruye) y el grupo gana la estampa de la unidad 1.
  await tocar(page, 'terminar-aventura');
  await esperarPantalla(page, 'camino');
  expect(await page.locator('canvas').count()).toBe(0);
  await expect(page.getByRole('dialog')).toContainText('El cacomixtle');
  await captura(page, info, '10-estampa');
  await tocarBoton(page, /¡Sigamos!/);
  await expect(page.locator('[data-nodo="aventura:u1"]')).toHaveAttribute('data-estado', 'hecho');

  // Mixtle habló siempre con su voz grabada (nunca con la del navegador) y sonó la música.
  const cuentaVoz = await page.evaluate(() => window.__caco.voz());
  info.annotations.push({ type: 'voz', description: JSON.stringify(cuentaVoz) });
  expect(cuentaVoz.conAudio).toBeGreaterThan(20);
  expect(cuentaVoz.conNavegador).toBe(0);
  expect(await page.evaluate(() => window.__caco.musica())).not.toBeNull();
  const audios = peticiones.map((r) => r.url()).filter((u) => /\/voz\/[0-9a-f]{14}\.mp3$/.test(u));
  expect(audios.length).toBeGreaterThan(20);

  // Privacidad: el juego nunca envía datos (ni imágenes ni nada) a ningún servidor.
  expect(peticiones.filter((r) => r.method() !== 'GET').map((r) => `${r.method()} ${r.url()}`)).toEqual([]);
  expect(errores).toEqual([]);
});

test('el botón de sonido se recuerda y el juego no se rompe sin localStorage', async ({ page, context }) => {
  await abrir(page);
  await esperarPantalla(page, 'inicio');
  await tocarBoton(page, 'Apagar la voz');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('mixtle-al-rescate:sonido'))).toBe('no');
  await page.reload();
  await page.waitForFunction(() => !!window.__caco);
  await expect(page.getByRole('button', { name: 'Encender la voz' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('mixtle-al-rescate:sonido'))).toBe('no');
  // Lo único guardado es esa preferencia.
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['mixtle-al-rescate:sonido']);

  // Navegador con almacenamiento bloqueado: el juego arranca igual.
  const bloqueada = await context.newPage();
  await bloqueada.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('bloqueado', 'SecurityError');
      },
    });
  });
  const { errores } = await abrir(bloqueada);
  await esperarPantalla(bloqueada, 'inicio');
  // En la v2, "¡Jugar!" lleva a elegir el grupo (la aventura de la v1 ya no es lo primero).
  await tocarBoton(bloqueada, /¡Jugar!/);
  await esperarPantalla(bloqueada, 'grupos');
  await expect(bloqueada.getByRole('heading', { name: '¿Quién va a jugar?' })).toBeVisible();
  expect(errores).toEqual([]);
});

test('Inicio: cada botón mide al menos 64 px reales en esta pantalla', async ({ page }) => {
  await abrir(page);
  await esperarPantalla(page, 'inicio');
  const botones = await page.getByRole('button').all();
  expect(botones.length).toBeGreaterThan(0);
  for (const b of botones) {
    const caja = (await b.boundingBox())!;
    expect.soft(Math.min(caja.width, caja.height), `${await b.getAttribute('aria-label') ?? await b.textContent()}`).toBeGreaterThanOrEqual(64);
  }
});

const PANTALLAS: [string, string][] = [
  ['Nivel1', 'residuo-'],
  ['Nivel2', 'residuo-'],
  ['Nivel3', 'tierra-'],
  ['Bonus', 'cae-'],
];

for (const [escena, espera] of PANTALLAS) {
  test(`${escena}: cada zona de toque mide al menos 64 px reales en esta pantalla`, async ({ page }) => {
    await abrir(page, `/?e2e&escena=${escena}`);
    await esperarTocable(page, espera);
    await page.waitForTimeout(1500); // que terminen las animaciones de entrada
    const caja = (await page.locator('canvas').boundingBox())!;
    const factor = caja.width / 1920; // en la tablet el juego se ve más chico
    const lista = await tocables(page);
    expect(lista.length).toBeGreaterThan(0);
    for (const t of lista) {
      const lado = Math.min(t.toqueAncho, t.toqueAlto) * factor;
      expect.soft(lado, `${t.nombre}: ${lado.toFixed(0)} px`).toBeGreaterThanOrEqual(64);
    }
  });
}
