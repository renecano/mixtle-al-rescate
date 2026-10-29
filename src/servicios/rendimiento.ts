/*
 * Si el equipo no puede con las animaciones (por ejemplo, una computadora del salón sin aceleración
 * por tarjeta de video), el juego se calma solo: mide los cuadros por segundo reales un momento
 * después de entrar y, si van muy bajos, enciende las "animaciones suaves" en esta sesión (no se
 * guarda: el facilitador puede encenderlas o apagarlas en su panel).
 * Medido (docs/rendimiento-v3*.json): con tarjeta de video, 59–60 fps; sin ella, 11–33 fps con
 * todas las animaciones y 57–60 fps con las suaves.
 */

/** Por debajo de esto (promedio) se encienden las animaciones suaves. */
export const FPS_MINIMO = 35;
/** Con menos cuadros no hay suficiente evidencia (por ejemplo, la pestaña estaba oculta). */
const CUADROS_MINIMOS = 20;

/** ¿Con estos intervalos entre cuadros (ms) conviene calmar las animaciones? */
export function debeSuavizar(intervalos: readonly number[]): boolean {
  if (intervalos.length < CUADROS_MINIMOS) return false;
  const promedio = intervalos.reduce((s, x) => s + x, 0) / intervalos.length;
  return 1000 / promedio < FPS_MINIMO;
}

/**
 * Espera a que pase la carga y la entrada del inicio, mide `duracionMs` y avisa si conviene suavizar.
 * Devuelve una función para cancelar.
 */
export function vigilarRendimiento(alSuavizar: () => void, { esperaMs = 3000, duracionMs = 2000 } = {}): () => void {
  if (typeof window === 'undefined' || typeof requestAnimationFrame !== 'function') return () => undefined;
  let cuadro = 0;
  const espera = window.setTimeout(() => {
    if (document.hidden) return;
    const intervalos: number[] = [];
    const inicio = performance.now();
    let anterior = inicio;
    const paso = (t: number) => {
      intervalos.push(t - anterior);
      anterior = t;
      if (t - inicio < duracionMs) cuadro = requestAnimationFrame(paso);
      else if (debeSuavizar(intervalos.slice(1))) alSuavizar();
    };
    cuadro = requestAnimationFrame(paso);
  }, esperaMs);
  return () => {
    window.clearTimeout(espera);
    cancelAnimationFrame(cuadro);
  };
}
