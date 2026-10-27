import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, type Page, type Request, type TestInfo } from '@playwright/test';

export interface Tocable {
  nombre: string;
  escena: string;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  toqueAncho: number;
  toqueAlto: number;
}

interface Gancho {
  escenas(): string[];
  tocables(): Tocable[];
  resumen(): { residuosSeparados: number; animalesAyudados: number; plantados: number };
  camarasActivas(): number;
  fps(): number;
}

declare global {
  interface Window {
    __caco: Gancho;
  }
}

/** Hosts desde donde TensorFlow.js descarga MobileNet. */
export const HOSTS_MODELO = /tfhub\.dev|kaggle|storage\.googleapis\.com|tensorflow/;

/** Abre el juego y registra errores de consola y todas las peticiones de red. */
export async function abrir(page: Page, ruta = '/?e2e') {
  const errores: string[] = [];
  const peticiones: Request[] = [];
  page.on('pageerror', (e) => errores.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errores.push(m.text());
  });
  page.on('request', (r) => peticiones.push(r));
  await page.goto(ruta);
  await page.waitForFunction(() => !!window.__caco && window.__caco.escenas().length > 0);
  return { errores, peticiones };
}

export function escenas(page: Page): Promise<string[]> {
  return page.evaluate(() => window.__caco.escenas());
}

export async function esperarEscena(page: Page, clave: string, timeout = 30_000): Promise<void> {
  await expect.poll(() => escenas(page), { timeout }).toContain(clave);
}

export function tocables(page: Page): Promise<Tocable[]> {
  return page.evaluate(() => window.__caco.tocables());
}

export async function esperarTocable(page: Page, prefijo: string, timeout = 60_000): Promise<Tocable> {
  let encontrado: Tocable | undefined;
  await expect
    .poll(
      async () => {
        encontrado = (await tocables(page)).find((t) => t.nombre.startsWith(prefijo));
        return !!encontrado;
      },
      { timeout, message: `esperando "${prefijo}"` },
    )
    .toBe(true);
  return encontrado!;
}

/** Convierte coordenadas del juego (1920×1080) a la ventana, sin importar el escalado. */
async function aPantalla(page: Page, x: number, y: number) {
  const caja = (await page.locator('canvas').boundingBox())!;
  return { x: caja.x + (x / 1920) * caja.width, y: caja.y + (y / 1080) * caja.height };
}

/** Toca un objeto: con el dedo si el dispositivo es táctil, con el mouse si no. */
export async function tocar(page: Page, prefijo: string, timeout?: number): Promise<Tocable> {
  const t = await esperarTocable(page, prefijo, timeout);
  const p = await aPantalla(page, t.x, t.y);
  const tactil = await page.evaluate(() => navigator.maxTouchPoints > 0);
  if (tactil) await page.touchscreen.tap(p.x, p.y);
  else await page.mouse.click(p.x, p.y);
  return t;
}

export async function arrastrar(page: Page, de: Tocable, a: Tocable): Promise<void> {
  const p1 = await aPantalla(page, de.x, de.y);
  const p2 = await aPantalla(page, a.x, a.y);
  await page.mouse.move(p1.x, p1.y);
  await page.mouse.down();
  await page.mouse.move(p2.x, p2.y, { steps: 15 });
  await page.mouse.up();
}

export function resumen(page: Page) {
  return page.evaluate(() => window.__caco.resumen());
}

/**
 * Adjunta una captura al reporte. Con la variable CAPTURAS=<carpeta> también la guarda ahí
 * (así se generan las imágenes de docs/capturas).
 */
export async function captura(page: Page, info: TestInfo, nombre: string): Promise<void> {
  const body = await page.screenshot();
  await info.attach(nombre, { body, contentType: 'image/png' });
  const carpeta = process.env.CAPTURAS;
  if (carpeta) {
    await mkdir(carpeta, { recursive: true });
    await writeFile(join(carpeta, `${info.project.name}-${nombre}.png`), body);
  }
}
