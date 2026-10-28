// Regenera las capturas del README (docs/capturas/) jugando como lo haría un grupo:
// crear un grupo, el camino, una lección con un error, la pantalla final, el álbum y las aventuras.
//
// Uso:  npm run build && npm run preview   (en otra terminal)
//       npm run capturas                    (o: node scripts/capturas.mjs <url-base>)
//
// Usa el Chrome instalado y un solo navegador a la vez (pensado para una laptop de 8 GB).
// Cada captura espera a que terminen las animaciones de entrada (window.__caco.quieto()).
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { runnerImport } from 'vite';

const base = (process.argv[2] ?? 'http://localhost:4173/').replace(/\/?$/, '/');
const carpeta = 'docs/capturas';
await mkdir(carpeta, { recursive: true });

const { UNIDADES } = (await runnerImport('./src/contenido/unidades/index.ts')).module;
const { todosLosEjercicios } = (await runnerImport('./src/voz/frases.ts')).module;
const { RESIDUOS } = (await runnerImport('./src/data/residuos.ts')).module;
const { CATEGORIAS } = (await runnerImport('./src/data/categorias.ts')).module;
const { categoriaDe } = (await runnerImport('./src/logica/clasificacion.ts')).module;
const EJERCICIOS = new Map(UNIDADES.flatMap((u) => u.lecciones.flatMap((l) => todosLosEjercicios(l.ejercicios))).map((e) => [e.id, e]));
const boteDe = (id) => categoriaDe(RESIDUOS.find((r) => r.id === id), CATEGORIAS).id;

const TAMANOS = [
  { nombre: 'proyector-1920x1080', viewport: { width: 1920, height: 1080 }, hasTouch: false },
  { nombre: 'tablet-1024x768', viewport: { width: 1024, height: 768 }, hasTouch: true },
];

const navegador = await chromium.launch({ channel: 'chrome' });
const errores = [];
try {
  for (const t of TAMANOS) {
    const contexto = await navegador.newContext({ viewport: t.viewport, hasTouch: t.hasTouch });
    // Sin cámara: "Muéstrale a Caco" se juega con dibujos.
    await contexto.addInitScript(() => Object.defineProperty(navigator, 'mediaDevices', { value: undefined }));
    const page = await contexto.newPage();
    page.on('pageerror', (e) => errores.push(`${t.nombre}: ${e}`));
    const guardar = async (nombre) => {
      await page.waitForFunction(() => window.__caco?.quieto?.() === true, null, { timeout: 20000 }).catch(() => console.log(`Aviso: ${nombre} sin confirmar animaciones`));
      await page.screenshot({ path: `${carpeta}/${t.nombre}-${nombre}.png` });
      console.log(`Captura: ${t.nombre}-${nombre}.png`);
    };
    const pantalla = (nombre) => page.waitForFunction((n) => window.__caco?.pantalla?.() === n, nombre, { timeout: 30000 });
    const boton = async (nombre) => {
      const b = page.getByRole('button', { name: nombre, exact: typeof nombre === 'string' }).first();
      await b.waitFor({ state: 'visible' });
      await page.waitForTimeout(450); // banners y modales entran deslizándose
      await b.click({ force: true });
    };
    const clic = async (selector) => {
      const el = page.locator(selector).first();
      await el.waitFor({ state: 'visible' });
      await el.evaluate((e) => e.scrollIntoView({ block: 'nearest' }));
      await page.waitForTimeout(700); // el camino se desplaza suave
      await el.click({ force: true });
    };

    // 1. Grupos y camino.
    await page.goto(`${base}?e2e`);
    await pantalla('inicio');
    await boton(/¡Jugar!/);
    await pantalla('grupos');
    await guardar('v2-1-grupos');
    await boton('Nuevo grupo');
    await clic('[data-mascota="ajolote"]');
    await page.locator('input[name="etiqueta-grupo"]').fill('1°A');
    await boton(/¡Listo!/);
    await pantalla('camino');
    await page.waitForTimeout(1500);
    await guardar('v2-2-camino');

    // 2. Lección 1 de la unidad 1, con un error a propósito.
    await clic('[data-nodo="leccion:u1-l1"]');
    await pantalla('leccion');
    let error = false;
    for (let paso = 0; paso < 30; paso++) {
      if ((await page.evaluate(() => window.__caco.pantalla())) === 'fin-leccion') break;
      const caja = page.locator('[data-ejercicio-id]');
      await caja.waitFor({ state: 'visible' });
      const e = EJERCICIOS.get(await caja.getAttribute('data-ejercicio-id'));
      const zona = `[data-ejercicio-id="${e.id}"]`;
      if (!error && (e.tipo === 'escucha-toca' || e.tipo === 'elige-imagen')) {
        await page.waitForTimeout(1200);
        await clic(`${zona} [data-tarjeta="${e.opciones.find((o) => o.id !== e.correcta).id}"]`);
        await page.locator('[data-banner="casi"]').waitFor({ state: 'visible' });
        await page.waitForTimeout(900);
        await guardar('v2-3-casi');
        await boton('Intentar otra vez');
        error = true;
      }
      await resolver(page, clic, boton, e, zona);
      await page.locator('[data-banner="bien"]').waitFor({ state: 'visible' });
      if (paso === 1) {
        await page.waitForTimeout(900);
        await guardar('v2-4-bien');
      }
      await boton(/¡Sigamos!/);
    }
    await pantalla('fin-leccion');
    await page.waitForTimeout(2500); // el parque termina de crecer
    await guardar('v2-5-fin');
    await boton('Volver al camino');
    await pantalla('camino');
    await page.waitForTimeout(1500);
    await guardar('v2-6-camino-despues');
    await boton(/Álbum/);
    await pantalla('album');
    await guardar('v2-7-album');
    await contexto.close();

    // 3. Aventuras: la de la unidad 2 de principio a fin; de las otras, la primera pantalla.
    const aventura = await navegador.newContext({ viewport: t.viewport, hasTouch: t.hasTouch });
    const p2 = await aventura.newPage();
    p2.on('pageerror', (e) => errores.push(`${t.nombre}: ${e}`));
    const guardarAventura = async (nombre) => {
      await p2.waitForFunction(() => window.__caco?.quieto?.() === true, null, { timeout: 20000 }).catch(() => {});
      await p2.screenshot({ path: `${carpeta}/${t.nombre}-${nombre}.png` });
      console.log(`Captura: ${t.nombre}-${nombre}.png`);
    };
    const tocar = async (prefijo) => {
      const o = await p2.evaluate((p) => window.__caco.tocables().find((x) => x.nombre.startsWith(p)), prefijo);
      if (!o) return false;
      const caja = await p2.locator('canvas').boundingBox();
      await p2.mouse.click(caja.x + (o.x / 1920) * caja.width, caja.y + (o.y / 1080) * caja.height);
      return true;
    };
    const escena = (clave) => p2.waitForFunction((c) => window.__caco?.escenas?.().includes(c), clave, { timeout: 30000 });

    await p2.goto(`${base}?e2e&escena=Rescate&unidad=u2`);
    await escena('Rescate');
    await p2.waitForTimeout(1500);
    await guardarAventura('aventura-u2-rescate');
    while (await tocar('basura-')) await p2.waitForTimeout(800);
    for (let i = 0; i < 12; i++) {
      await p2.waitForFunction(() => window.__caco.tocables().some((x) => x.nombre.startsWith('pieza-') || x.nombre === 'siguiente'), null, { timeout: 30000 });
      const pieza = await p2.evaluate(() => window.__caco.tocables().find((x) => x.nombre.startsWith('pieza-'))?.nombre);
      if (!pieza) break;
      if (i === 0) await guardarAventura('aventura-u2-separar');
      await tocar(`bote-${boteDe(pieza.replace('pieza-', ''))}`);
      await p2.waitForTimeout(600);
      await p2.waitForFunction((n) => !window.__caco.tocables().some((x) => x.nombre === n), pieza, { timeout: 30000 });
    }
    await p2.waitForFunction(() => window.__caco.tocables().some((x) => x.nombre === 'siguiente'), null, { timeout: 30000 });
    await tocar('siguiente');
    await escena('Final');
    await p2.waitForFunction(() => window.__caco.tocables().some((x) => x.nombre === 'terminar-aventura'), null, { timeout: 30000 });
    await guardarAventura('aventura-u2-diploma');

    for (const [clave, unidad, nombre, espera] of [
      ['Bosque', 'u3', 'aventura-u3-bosque', 1500],
      ['Bici', 'u4', 'aventura-u4-bici', 14000],
      ['Lonchera', 'u5', 'aventura-u5-lonchera', 9000],
    ]) {
      await p2.goto(`${base}?e2e&escena=${clave}&unidad=${unidad}`);
      await escena(clave);
      await p2.waitForTimeout(espera);
      await guardarAventura(nombre);
    }
    await aventura.close();
  }
} finally {
  await navegador.close();
}
if (errores.length) {
  console.log('Errores en la página:\n' + errores.join('\n'));
  process.exitCode = 1;
}

/** Resuelve bien el ejercicio que está en pantalla. */
async function resolver(page, clic, boton, e, zona) {
  switch (e.tipo) {
    case 'elige-imagen':
    case 'escucha-toca':
      return clic(`${zona} [data-tarjeta="${e.correcta}"]`);
    case 'si-no':
      return clic(`${zona} [data-respuesta="${e.respuesta ? 'si' : 'no'}"]`);
    case 'al-bote':
      for (const id of e.residuos) {
        await page.locator(`${zona} [data-residuo="${id}"]`).waitFor({ state: 'visible' });
        await clic(`${zona} [data-bote="${boteDe(id)}"]`);
      }
      return;
    case 'parejas':
      for (const p of e.pares) {
        await clic(`${zona} [data-tarjeta="${p.izquierda.id}"]`);
        await clic(`${zona} [data-tarjeta="${p.derecha.id}"]`);
      }
      return;
    case 'ordena':
      for (const paso of e.pasos) await clic(`${zona} [data-tarjeta="${paso.id}"]`);
      return;
    case 'encuentra-error':
      for (const o of e.objetos.filter((x) => x.mal)) await clic(`${zona} [data-objeto="${o.id}"]`);
      return;
    case 'muestrale':
      await boton('Usar dibujos');
      return clic(`${zona} [data-tarjeta="${e.respaldo.correcta}"]`);
  }
}
