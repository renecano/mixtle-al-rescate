import { createStore, del, get, set } from 'idb-keyval';

/*
 * El juego se llamaba "Caco al rescate" (v1 y v2) y guardaba con el prefijo de ese nombre. Ahora se
 * llama "Mixtle al rescate". Aquí se pasan los datos guardados con el nombre anterior al nuevo, en el
 * mismo aparato, para que ningún grupo pierda su avance. Es idempotente: se puede correr varias veces.
 */

/** Prefijo con el que guardaban las versiones anteriores. No cambiar: es lo que hay en los aparatos. */
export const PREFIJO_ANTERIOR = 'caco-al-rescate';
export const PREFIJO = 'mixtle-al-rescate';
/** Base de datos de IndexedDB (idb-keyval): nombre de la base y del almacén. */
export const ALMACEN_IDB = 'datos';
export const CLAVE_GRUPOS = 'grupos';

type Preferencias = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;

/**
 * localStorage: "caco-al-rescate:sonido" → "mixtle-al-rescate:sonido" (y música, proyector…).
 * Si la clave nueva ya existe, gana la nueva. La anterior se borra. Devuelve cuántas se pasaron.
 */
export function migrarPreferencias(almacen: Preferencias | null): number {
  if (!almacen) return 0;
  try {
    const viejas: string[] = [];
    for (let i = 0; i < almacen.length; i++) {
      const clave = almacen.key(i);
      if (clave?.startsWith(`${PREFIJO_ANTERIOR}:`)) viejas.push(clave);
    }
    let pasadas = 0;
    for (const vieja of viejas) {
      const nueva = PREFIJO + vieja.slice(PREFIJO_ANTERIOR.length);
      const valor = almacen.getItem(vieja);
      if (almacen.getItem(nueva) === null && valor !== null) {
        almacen.setItem(nueva, valor);
        pasadas += 1;
      }
      almacen.removeItem(vieja);
    }
    return pasadas;
  } catch {
    // Almacenamiento bloqueado: no hay nada que migrar.
    return 0;
  }
}

/** ¿Existe en este navegador la base de datos con el nombre anterior? (Sin crearla si no existe.) */
async function existeBaseAnterior(): Promise<boolean> {
  try {
    if (typeof indexedDB === 'undefined') return false;
    if (typeof indexedDB.databases !== 'function') return true; // no se puede saber: se intenta leer
    return (await indexedDB.databases()).some((d) => d.name === PREFIJO_ANTERIOR);
  } catch {
    return false;
  }
}

/**
 * IndexedDB: los grupos guardados en la base "caco-al-rescate" pasan a "mixtle-al-rescate".
 * Si la base nueva ya tiene grupos, no se pisan. La anterior se vacía al terminar. Nunca lanza.
 */
export async function migrarGrupos(): Promise<boolean> {
  try {
    if (!(await existeBaseAnterior())) return false;
    const anterior = createStore(PREFIJO_ANTERIOR, ALMACEN_IDB);
    const grupos = await get(CLAVE_GRUPOS, anterior);
    if (grupos === undefined) return false;
    const nueva = createStore(PREFIJO, ALMACEN_IDB);
    if ((await get(CLAVE_GRUPOS, nueva)) === undefined) await set(CLAVE_GRUPOS, grupos, nueva);
    await del(CLAVE_GRUPOS, anterior);
    return true;
  } catch {
    return false;
  }
}
