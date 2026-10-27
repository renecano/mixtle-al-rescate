/**
 * Orden de las pantallas de la aventura de la unidad 1 (los niveles de la v1).
 * Cada clave es una escena de `src/scenes/`. La pantalla de inicio ahora es de React.
 */
export const ORDEN_ESCENAS = ['Intro', 'Nivel1', 'Nivel2', 'Nivel3', 'Bonus', 'Final'] as const;

export type ClaveEscena = (typeof ORDEN_ESCENAS)[number];

/** Escena que sigue a `actual`. Desde el diploma (Final) se sale de la aventura, no hay siguiente. */
export function escenaSiguiente(actual: Exclude<ClaveEscena, 'Final'>): ClaveEscena {
  return ORDEN_ESCENAS[ORDEN_ESCENAS.indexOf(actual) + 1]!;
}

export function esEscena(clave: string | null | undefined): clave is ClaveEscena {
  return !!clave && (ORDEN_ESCENAS as readonly string[]).includes(clave);
}
