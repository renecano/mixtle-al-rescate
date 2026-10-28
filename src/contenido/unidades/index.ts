import type { Unidad } from '../tipos';
import { U1 } from './u1-separa';
import { U2 } from './u2-animales';
import { U3 } from './u3-arboles';
import { U4 } from './u4-aire';
import { U5 } from './u5-reutiliza';

/** Las unidades del camino, en orden. Cada una vive en su propio archivo de esta carpeta. */
export const UNIDADES: readonly Unidad[] = [U1, U2, U3, U4, U5];

export function unidadPorId(id: string): Unidad | undefined {
  return UNIDADES.find((u) => u.id === id);
}

export function leccionPorId(id: string) {
  for (const unidad of UNIDADES) {
    const leccion = unidad.lecciones.find((l) => l.id === id);
    if (leccion) return { unidad, leccion };
  }
  return undefined;
}
