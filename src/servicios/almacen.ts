import { createStore, get, set, type UseStore } from 'idb-keyval';

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

const CLAVE = 'grupos';
let tienda: UseStore | null = null;

function tiendaIdb(): UseStore {
  tienda ??= createStore('caco-al-rescate', 'datos');
  return tienda;
}

export const almacenIndexedDb: Almacen = {
  async leer() {
    try {
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
