/**
 * Cuando se publica una versión nueva, el service worker la descarga en segundo plano y toma el
 * control. Hasta que la página se recarga, el juego seguiría con la versión vieja en memoria
 * (por ejemplo, con la lista de audios vieja). Aquí se avisa en cuanto la versión nueva toma el control.
 *
 * En la primera visita no hay nada que actualizar: el service worker toma el control por primera
 * vez, y eso no cuenta como versión nueva.
 */
export function vigilarActualizaciones(alHaberVersionNueva: () => void, sw: ServiceWorkerContainer | undefined = navegadorSw()): void {
  if (!sw) return;
  const habiaVersion = !!sw.controller;
  let avisado = false;
  sw.addEventListener('controllerchange', () => {
    if (!habiaVersion || avisado) return;
    avisado = true;
    alHaberVersionNueva();
  });
}

function navegadorSw(): ServiceWorkerContainer | undefined {
  try {
    return typeof navigator !== 'undefined' && 'serviceWorker' in navigator ? navigator.serviceWorker : undefined;
  } catch {
    return undefined;
  }
}
