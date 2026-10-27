import { expect, test } from '@playwright/test';
import { CATEGORIAS } from '../src/data/categorias';
import { RESIDUOS } from '../src/data/residuos';
import { categoriaDe } from '../src/logica/clasificacion';
import {
  HOSTS_MODELO,
  abrir,
  arrastrar,
  captura,
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

test('recorrido completo: inicio → intro → 3 niveles → bonus sin cámara → diploma', async ({ page }, info) => {
  // Sin cámara de forma determinista: en el proyector, permiso negado; en la tablet, navegador sin cámara.
  if (info.project.name.startsWith('proyector')) {
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('negado', 'NotAllowedError'));
    });
  } else {
    await page.addInitScript(() => Object.defineProperty(navigator, 'mediaDevices', { value: undefined }));
  }
  const { errores, peticiones } = await abrir(page);

  // Inicio (pantalla de React)
  await esperarPantalla(page, 'inicio');
  await captura(page, info, '1-inicio');
  await tocarBoton(page, /¡Jugar!/);

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

  // Bonus: hasta aquí no se ha descargado ningún modelo de visión.
  await esperarEscena(page, 'Bonus');
  expect(peticiones.filter((r) => HOSTS_MODELO.test(r.url()))).toHaveLength(0);
  await page.waitForTimeout(900); // que termine el fundido de entrada
  await captura(page, info, '7-bonus');
  await tocar(page, 'muestrale-a-caco');
  // Sin permiso de cámara se juega con dibujos y botones.
  const dibujo = await esperarTocable(page, 'dibujo-');
  await page.waitForTimeout(900); // que termine de aparecer el dibujo
  await captura(page, info, '8-bonus-dibujos');
  await tocar(page, boteCorrecto(dibujo.nombre.replace('dibujo-', '')));
  await expect.poll(async () => (await resumen(page)).residuosSeparados).toBe(RESIDUOS.length + 1);
  await tocar(page, 'ir-al-diploma');

  // Diploma con los números de la partida.
  await esperarEscena(page, 'Final');
  await esperarTocable(page, 'jugar-otra-vez');
  await captura(page, info, '9-diploma');
  expect(await resumen(page)).toMatchObject({ residuosSeparados: RESIDUOS.length + 1, animalesAyudados: 10 });
  expect(await page.evaluate(() => window.__caco.camarasActivas())).toBe(0);

  // Jugar otra vez: se sale de la aventura (Phaser se destruye) y "¡Jugar!" reinicia todo.
  await tocar(page, 'jugar-otra-vez');
  await esperarPantalla(page, 'inicio');
  expect(await page.locator('canvas').count()).toBe(0);
  await tocarBoton(page, /¡Jugar!/);
  await esperarEscena(page, 'Intro');
  expect(await resumen(page)).toMatchObject({ residuosSeparados: 0, animalesAyudados: 0 });

  // Privacidad: el juego nunca envía datos (ni imágenes ni nada) a ningún servidor.
  expect(peticiones.filter((r) => r.method() !== 'GET').map((r) => `${r.method()} ${r.url()}`)).toEqual([]);
  expect(errores).toEqual([]);
});

test('el botón de sonido se recuerda y el juego no se rompe sin localStorage', async ({ page, context }) => {
  await abrir(page);
  await esperarPantalla(page, 'inicio');
  await tocarBoton(page, 'Apagar el sonido');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('caco-al-rescate:sonido'))).toBe('no');
  await page.reload();
  await page.waitForFunction(() => !!window.__caco);
  await expect(page.getByRole('button', { name: 'Encender el sonido' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('caco-al-rescate:sonido'))).toBe('no');
  // Lo único guardado es esa preferencia.
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual(['caco-al-rescate:sonido']);

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
  await tocarBoton(bloqueada, /¡Jugar!/);
  await esperarEscena(bloqueada, 'Intro');
  expect(errores).toEqual([]);
});

test('bonus: si el permiso de cámara no llega, "Usar dibujos" sigue el juego y apaga la cámara que llegue tarde', async ({ page }) => {
  await page.addInitScript(() => {
    // El permiso "se concede" 3 s después, cuando ya se eligió jugar con dibujos.
    navigator.mediaDevices.getUserMedia = () =>
      new Promise((resolver) =>
        setTimeout(() => {
          const flujo = document.createElement('canvas').captureStream(5);
          (window as unknown as { __flujoTarde: MediaStream }).__flujoTarde = flujo;
          resolver(flujo);
        }, 3000),
      );
  });
  const { errores } = await abrir(page, '/?e2e&escena=Bonus');
  await tocar(page, 'muestrale-a-caco');
  await tocar(page, 'usar-dibujos');
  await esperarTocable(page, 'dibujo-');
  await page.waitForFunction(() => !!(window as unknown as { __flujoTarde?: MediaStream }).__flujoTarde);
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as unknown as { __flujoTarde: MediaStream }).__flujoTarde.getTracks().every((t) => t.readyState === 'ended'),
      ),
    )
    .toBe(true);
  expect(await page.evaluate(() => window.__caco.camarasActivas())).toBe(0);
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
  ['Bonus', 'muestrale-a-caco'],
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
