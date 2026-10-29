// Juega como lo haría un grupo, para revisar pantallas y grabar el tráiler (no son las pruebas e2e:
// esas viven en e2e/ y corren al final contra producción). Usa el contenido real del juego.
import { runnerImport } from 'vite';

const { UNIDADES } = (await runnerImport('./src/contenido/unidades/index.ts')).module;
const { todosLosEjercicios } = (await runnerImport('./src/voz/frases.ts')).module;
const { CATEGORIAS } = (await runnerImport('./src/data/categorias.ts')).module;
const { RESIDUOS } = (await runnerImport('./src/data/residuos.ts')).module;
const { categoriaDe } = (await runnerImport('./src/logica/clasificacion.ts')).module;

export { UNIDADES };
const EJERCICIOS = new Map(UNIDADES.flatMap((u) => u.lecciones.flatMap((l) => todosLosEjercicios(l.ejercicios))).map((e) => [e.id, e]));

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/** Toca un elemento cuando ya dejó de moverse (los botones laten: se toca forzado). */
export async function tocarSelector(page, selector) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'visible', timeout: 20000 });
  await el.evaluate((e) => e.scrollIntoView({ block: 'nearest' }));
  await espera(350);
  await el.click({ force: true });
}

export async function tocarBoton(page, nombre) {
  const boton = page.getByRole('button', { name: nombre }).first();
  await boton.waitFor({ state: 'visible', timeout: 20000 });
  await boton.click({ force: true });
}

export async function esperarPantalla(page, nombre, timeout = 30000) {
  await page.waitForSelector(`[data-pantalla="${nombre}"][data-entrada-lista="true"]`, { timeout });
  // Mientras el panel de la transición de marca cubre la pantalla, no recibe toques (a propósito).
  await page.waitForSelector('.transicion-marca', { state: 'detached', timeout });
}

/** Del inicio a un grupo nuevo en el camino. */
export async function entrarConGrupoNuevo(page, mascota = 'ardilla') {
  await esperarPantalla(page, 'inicio');
  await tocarBoton(page, /¡Jugar!/);
  await esperarPantalla(page, 'grupos');
  await tocarBoton(page, 'Nuevo grupo');
  await page.locator(`[data-mascota="${mascota}"]`).click({ force: true });
  await tocarBoton(page, /¡Listo!/);
  await esperarPantalla(page, 'camino');
}

/** El ejercicio que está en pantalla. */
export async function ejercicioEnPantalla(page) {
  const caja = page.locator('[data-ejercicio-id]');
  await caja.waitFor({ timeout: 20000 });
  return EJERCICIOS.get(await caja.getAttribute('data-ejercicio-id'));
}

/** Resuelve bien el ejercicio en pantalla. */
export async function resolver(page, e) {
  const zona = `[data-ejercicio-id="${e.id}"]`;
  switch (e.tipo) {
    case 'elige-imagen':
    case 'escucha-toca':
      return tocarSelector(page, `${zona} [data-tarjeta="${e.correcta}"]`);
    case 'si-no':
      return tocarSelector(page, `${zona} [data-respuesta="${e.respuesta ? 'si' : 'no'}"]`);
    case 'al-bote':
      for (const id of e.residuos) {
        const categoria = categoriaDe(RESIDUOS.find((r) => r.id === id), CATEGORIAS);
        await page.locator(`${zona} [data-residuo="${id}"]`).waitFor();
        await tocarSelector(page, `${zona} [data-bote="${categoria.id}"]`);
      }
      return;
    case 'parejas':
      for (const p of e.pares) {
        await tocarSelector(page, `${zona} [data-tarjeta="${p.izquierda.id}"]`);
        await tocarSelector(page, `${zona} [data-tarjeta="${p.derecha.id}"]`);
      }
      return;
    case 'ordena':
      for (const paso of e.pasos) await tocarSelector(page, `${zona} [data-tarjeta="${paso.id}"]`);
      return;
    case 'encuentra-error':
      for (const o of e.objetos.filter((x) => x.mal)) await tocarSelector(page, `${zona} [data-objeto="${o.id}"]`);
      return;
    default:
      throw new Error(`Tipo de ejercicio sin resolver: ${e.tipo}`);
  }
}

/** Después de acertar: espera el banner y toca "¡Sigamos!". */
export async function seguir(page) {
  await tocarBoton(page, /¡Sigamos!/);
}
