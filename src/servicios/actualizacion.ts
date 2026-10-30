import { create } from 'zustand';

/*
 * Versiones nuevas. Cuando se publica una, el service worker nuevo se instala en segundo plano, se
 * activa sin esperar (skipWaiting) y toma las pestañas abiertas (clientsClaim). Aquí:
 * - se avisa en cuanto una versión nueva toma el control (`vigilarActualizaciones`), para recargar la
 *   página en un momento seguro (nunca a media lección: `esMomentoSeguro`);
 * - se comprueba si hay versión nueva aunque la pestaña ya estuviera abierta antes del push: al volver
 *   a la pestaña y cada cierto tiempo (`programarRevisiones`), porque el navegador solo lo hace solo al
 *   navegar;
 * - y queda un aviso visible en el inicio ("Hay una versión nueva. Toca para actualizar") por si la
 *   recarga automática no ocurre (`useActualizacion`, `actualizarAhora`).
 * El avance de los grupos vive en IndexedDB: recargar no lo toca.
 */

/** Pantallas en las que recargar no interrumpe nada (una lección o una aventura a medias, sí). */
export const PANTALLAS_SEGURAS: ReadonlySet<string> = new Set(['inicio', 'grupos', 'camino', 'album']);

export function esMomentoSeguro(pantalla: string): boolean {
  return PANTALLAS_SEGURAS.has(pantalla);
}

/** Cada cuánto se comprueba si hay versión nueva con la pestaña abierta. */
export const REVISION_CADA_MS = 15 * 60 * 1000;
/** Al volver a la pestaña, no se comprueba más de una vez por minuto. */
export const REVISION_MINIMA_MS = 60 * 1000;

interface EstadoActualizacion {
  /** Una versión nueva ya tomó el control (o está instalada esperando): se puede actualizar. */
  hayNueva: boolean;
  /** Hay un service worker instalado que sigue "esperando" (no debería pasar; el aviso lo resuelve). */
  esperando: boolean;
}

export const useActualizacion = create<EstadoActualizacion>(() => ({ hayNueva: false, esperando: false }));

/**
 * Avisa una vez cuando una versión nueva toma el control de la página. En la primera visita no hay
 * nada que actualizar: el service worker toma el control por primera vez, y eso no cuenta.
 */
export function vigilarActualizaciones(alHaberVersionNueva: () => void, sw: ServiceWorkerContainer | undefined = navegadorSw()): void {
  if (!sw) return;
  const habiaVersion = !!sw.controller;
  let avisado = false;
  sw.addEventListener('controllerchange', () => {
    if (!habiaVersion || avisado) return;
    avisado = true;
    useActualizacion.setState({ hayNueva: true });
    alHaberVersionNueva();
  });
}

/** Lo que se necesita de un registro para programar revisiones (así se prueba con uno falso). */
export interface RegistroRevisable {
  update(): Promise<unknown>;
}

/**
 * Con la pestaña abierta, el navegador solo busca versiones nuevas al navegar. Aquí se busca también
 * al volver a la pestaña (como mucho una vez por minuto) y cada REVISION_CADA_MS. Devuelve cómo dejar
 * de hacerlo.
 */
/** Lo que se necesita del documento (así se prueba con uno falso). */
export interface DocumentoVisible {
  visibilityState: DocumentVisibilityState;
  addEventListener(tipo: 'visibilitychange', escuchar: () => void): void;
  removeEventListener(tipo: 'visibilitychange', escuchar: () => void): void;
}

export function programarRevisiones(registro: RegistroRevisable, doc: DocumentoVisible = document, ahora: () => number = Date.now): () => void {
  let ultima = ahora();
  const revisar = () => {
    ultima = ahora();
    registro.update().catch(() => undefined);
  };
  const reloj = setInterval(revisar, REVISION_CADA_MS);
  const alVolver = () => {
    if (doc.visibilityState === 'visible' && ahora() - ultima >= REVISION_MINIMA_MS) revisar();
  };
  doc.addEventListener('visibilitychange', alVolver);
  return () => {
    clearInterval(reloj);
    doc.removeEventListener('visibilitychange', alVolver);
  };
}

/** El aviso del inicio: si hay uno esperando se le pide activarse, y se recarga (los grupos no se tocan). */
export async function actualizarAhora(sw: ServiceWorkerContainer | undefined = navegadorSw(), recargar: () => void = () => window.location.reload()): Promise<void> {
  try {
    const registro = await sw?.getRegistration();
    registro?.waiting?.postMessage({ type: 'SKIP_WAITING' });
  } catch {
    // Sin service worker: solo recargar.
  }
  setTimeout(recargar, 300);
}

function navegadorSw(): ServiceWorkerContainer | undefined {
  try {
    return typeof navigator !== 'undefined' && 'serviceWorker' in navigator ? navigator.serviceWorker : undefined;
  } catch {
    return undefined;
  }
}
