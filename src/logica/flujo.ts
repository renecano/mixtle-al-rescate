/** Orden de las pantallas del juego. Cada clave es una escena de `src/scenes/`. */
export const ORDEN_ESCENAS = ['Inicio', 'Intro', 'Nivel1', 'Nivel2', 'Nivel3', 'Bonus', 'Final'] as const;

export type ClaveEscena = (typeof ORDEN_ESCENAS)[number];

/** Escena que sigue a `actual`. Después del final se vuelve al inicio. */
export function escenaSiguiente(actual: ClaveEscena): ClaveEscena {
  const i = ORDEN_ESCENAS.indexOf(actual);
  return ORDEN_ESCENAS[(i + 1) % ORDEN_ESCENAS.length] ?? 'Inicio';
}
