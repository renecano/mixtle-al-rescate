import { createStore, get, set, type UseStore } from 'idb-keyval';
import { fusionarGrupos, gruposValidos } from '../logica/grupos';
import { ALMACEN_IDB, CLAVE_GRUPOS, migrarGrupos, PREFIJO } from './migracion';
import { leerMudanza } from './mudanza';

/**
 * Dónde se guarda el progreso de los grupos: IndexedDB del propio dispositivo (nada sale de él).
 * Todo va dentro de try/catch: si el almacenamiento está bloqueado (modo privado, permisos),
 * el juego sigue funcionando en memoria.
 */
export interface Almacen {
  leer(): Promise<unknown>;
  /** Devuelve false si no se pudo guardar. */
  guardar(valor: unknown): Promise<boolean>;
}

const CLAVE = CLAVE_GRUPOS;
let tienda: UseStore | null = null;

function tiendaIdb(): UseStore {
  tienda ??= createStore(PREFIJO, ALMACEN_IDB);
  return tienda;
}

/**
 * Antes de la primera lectura: pasar lo guardado con el nombre anterior del juego y, si se llegó
 * con una mudanza de dirección (#mudanza=…), juntar esos grupos y preferencias. Una sola vez.
 */
let preparado: Promise<void> | null = null;
function preparar(): Promise<void> {
  preparado ??= (async () => {
    await migrarGrupos();
    const mudanza = typeof location !== 'undefined' ? leerMudanza(location.hash) : null;
    if (!mudanza) return;
    try {
      const actuales = gruposValidos(await get(CLAVE, tiendaIdb()));
      await set(CLAVE, fusionarGrupos(actuales, mudanza.grupos), tiendaIdb());
    } catch {
      // Sin almacenamiento: la mudanza no se puede guardar, pero el juego sigue.
    }
    // El fragmento ya no hace falta (ni debe quedarse en el historial).
    history.replaceState(null, '', location.pathname + location.search);
  })();
  return preparado;
}

export const almacenIndexedDb: Almacen = {
  async leer() {
    try {
      await preparar();
      return await get(CLAVE, tiendaIdb());
    } catch {
      return undefined;
    }
  },
  async guardar(valor) {
    try {
      await set(CLAVE, valor, tiendaIdb());
      return true;
    } catch {
      return false;
    }
  },
};

/** Almacén en memoria (pruebas, o cuando no hay IndexedDB). */
export function almacenEnMemoria(inicial?: unknown): Almacen & { contenido: unknown } {
  const a = {
    contenido: inicial,
    async leer() {
      return structuredClone(a.contenido);
    },
    async guardar(valor: unknown) {
      a.contenido = structuredClone(valor);
      return true;
    },
  };
  return a;
}
