import type { Leccion } from '../../contenido/tipos';
import { retenerDescarga, soltarDescarga } from '../../servicios/sinInternet';
import { voz } from '../../servicios/voz';
import type { Locucion } from '../../voz/locucion';

/*
 * Abrir la primera lección rápido también la primera vez (en un aparato recién actualizado tardaba
 * mucho; al reiniciar ya era rápido porque todo estaba guardado). El código de la lección se adelanta
 * desde el camino (cargadores.ts); aquí, al tocar una lección, se adelanta lo primero que dice Mixtle
 * y la descarga en segundo plano se retiene para no quitarle la red, hasta que el primer ejercicio
 * está en pantalla y narrando.
 */

/** Lo primero que dice Mixtle al abrir una lección: la bienvenida y la consigna del primer ejercicio (van en orden). */
export function primeraNarracion(leccion: Leccion): Locucion {
  return [leccion.bienvenida, leccion.ejercicios[0]!.consigna];
}

/** Al tocar una lección: se adelanta su primera narración y se retiene la descarga en segundo plano. */
export function prepararLeccion(leccion: Leccion, v: Pick<typeof voz, 'precargar'> = voz): void {
  retenerDescarga();
  void v.precargar([primeraNarracion(leccion)]);
}

/** Cuánto se espera, como mucho, a que Mixtle se oiga antes de soltar la descarga de todos modos. */
export const ESPERA_NARRACION_MS = 3000;

/** El primer ejercicio ya está en pantalla: en cuanto Mixtle se oye (o pasado el tope), la descarga sigue. */
export function soltarAlNarrar(v: Pick<typeof voz, 'sonandoAhora'> = voz, ahora: () => number = Date.now, maxMs = ESPERA_NARRACION_MS): void {
  const limite = ahora() + maxMs;
  const revisar = () => {
    if (v.sonandoAhora || ahora() >= limite) {
      soltarDescarga();
      return;
    }
    setTimeout(revisar, 100);
  };
  revisar();
}
