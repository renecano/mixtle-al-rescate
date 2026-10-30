import { iniciarDescargaSinInternet } from './sinInternet';

/*
 * Qué se baja y cuándo, para que en una red lenta lo primero sea poder jugar:
 * 1. La primera pantalla (inicio) con lo mínimo.
 * 2. Mientras se ve el inicio: el código de Grupos y Camino, y la voz de "¡Al rescate!" y de la
 *    bienvenida (lo pide el inicio).
 * 3. Ya lista la primera pantalla, y con el navegador desocupado: se registra el service worker (que
 *    guarda código, arte y fuentes) y, cuando está activo, empieza la descarga del audio para jugar
 *    sin internet, de pocos archivos a la vez (servicios/sinInternet.ts).
 */

let avisado = false;

/** El inicio ya se ve (o ya se pasó a otra pantalla). Solo cuenta la primera vez. */
export function primeraPantallaLista(): void {
  if (avisado || typeof window === 'undefined') return;
  avisado = true;
  const cuandoEsteDesocupado = (fn: () => void) => (typeof window.requestIdleCallback === 'function' ? window.requestIdleCallback(fn, { timeout: 2000 }) : window.setTimeout(fn, 500));
  cuandoEsteDesocupado(() => {
    void (async () => {
      const registro = await registrarServiceWorker();
      if (!registro) return;
      await navigator.serviceWorker.ready;
      await iniciarDescargaSinInternet();
    })();
  });
}

/**
 * Registra el service worker (solo en la versión construida). Si hay una versión nueva ya instalada
 * pero "esperando" (la de un build anterior sin skipWaiting, o una que llegó mientras tanto), le pide
 * que tome el control: así el juego no se queda con la versión vieja hasta cerrar todas las pestañas.
 * Nunca lanza.
 */
export async function registrarServiceWorker(): Promise<ServiceWorkerRegistration | undefined> {
  if (import.meta.env.DEV || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return undefined;
  try {
    const registro = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL });
    activarLaQueEspera(registro);
    return registro;
  } catch {
    return undefined;
  }
}

/** Lo que se necesita de un registro de service worker (así se prueba con uno falso). */
interface RegistroSw {
  waiting: ServiceWorker | null;
  installing: ServiceWorker | null;
  addEventListener(tipo: 'updatefound', escuchar: () => void): void;
}

/** Le dice a un service worker en espera que se active (todos los builds entienden este mensaje). */
export function activarLaQueEspera(registro: RegistroSw): void {
  const pedir = (sw: ServiceWorker | null) => sw?.postMessage({ type: 'SKIP_WAITING' });
  pedir(registro.waiting);
  registro.addEventListener('updatefound', () => {
    const nuevo = registro.installing;
    nuevo?.addEventListener('statechange', () => {
      if (nuevo.state === 'installed' && navigator.serviceWorker.controller) pedir(nuevo);
    });
  });
}
