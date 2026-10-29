/**
 * Cuándo puede sonar el audio, más allá del primer toque:
 * - Si el navegador ya deja sonar sin toque (Chrome lo hace en los sitios que se usan seguido: la
 *   visita de regreso), la música empieza sola al entrar, sin esperar un toque que ya no hace falta.
 * - Si el navegador pausa el audio (salir de la app, bloquear la tablet, otra pestaña), se reanuda al
 *   volver o con el siguiente toque. En iPad queda "interrupted" (no "suspended"): también se reanuda.
 * No depende de Howler: recibe el contexto de audio (así se prueba sin bocinas).
 */
export type ContextoAudio = Pick<AudioContext, 'state' | 'resume' | 'addEventListener'>;

/** Pide reanudar si el contexto no está sonando. Nunca lanza. */
export function reanudarContexto(ctx: ContextoAudio | undefined): void {
  if (!ctx || ctx.state === 'running' || ctx.state === 'closed') return;
  try {
    void ctx.resume().catch(() => undefined);
  } catch {
    // Sin audio el juego sigue igual.
  }
}

/**
 * Vigila el contexto: en cuanto puede sonar, deja empezar la música (`alPoderSonar`); al volver a la
 * página, intenta reanudarlo.
 */
export function vigilarContexto(ctx: ContextoAudio, alPoderSonar: () => void, doc: Document = document, win: Window = window): void {
  const siSuena = () => {
    if (ctx.state === 'running') alPoderSonar();
  };
  ctx.addEventListener('statechange', siSuena);
  siSuena();
  const alVolver = () => {
    if (doc.visibilityState === 'visible') reanudarContexto(ctx);
  };
  doc.addEventListener('visibilitychange', alVolver);
  win.addEventListener('pageshow', alVolver);
}
