/*
 * La lógica de la lluvia de basura (bonus de la aventura 1), aparte de Phaser para poder probarla:
 * cae una basura a la vez; el grupo toca un bote. Si llega al suelo, Mixtle avisa y la basura vuelve
 * a caer, pero los botes responden siempre: un toque mientras Mixtle dice "¡Uy, llegó al suelo!"
 * cuenta como cualquier otro (lo reportó la corrida en producción del 27 de octubre de 2026).
 */

export interface EstadoLluvia {
  /** La basura que está cayendo (o en el suelo), o null entre una y otra. */
  actual: string | null;
  /** Ya se eligió el bote correcto y la basura va hacia él: nada más responde hasta la siguiente. */
  ocupado: boolean;
  /** La basura actual llegó al suelo y Mixtle lo está diciendo. */
  enElSuelo: boolean;
}

export const LLUVIA_INICIAL: EstadoLluvia = { actual: null, ocupado: false, enElSuelo: false };

/** Empieza a caer una basura nueva. */
export function caeBasura(residuo: string): EstadoLluvia {
  return { actual: residuo, ocupado: false, enElSuelo: false };
}

/** Llegó al suelo sin que se eligiera bote (si ya se había elegido, no cambia nada). */
export function llegaAlSuelo(e: EstadoLluvia): EstadoLluvia {
  if (!e.actual || e.ocupado) return e;
  return { ...e, enElSuelo: true };
}

/** ¿Un toque en un bote cuenta ahora mismo? Siempre que haya basura y no se haya acertado ya: en el aire o en el suelo. */
export function boteResponde(e: EstadoLluvia): boolean {
  return !!e.actual && !e.ocupado;
}

/**
 * El grupo tocó un bote. Correcto: la basura va al bote y nada más responde hasta la siguiente.
 * Incorrecto: una pista, y todo sigue igual (ni castigo ni pausa).
 */
export function eligeBote(e: EstadoLluvia, correcto: boolean): { estado: EstadoLluvia; efecto: 'acierto' | 'pista' | 'nada' } {
  if (!boteResponde(e)) return { estado: e, efecto: 'nada' };
  if (!correcto) return { estado: e, efecto: 'pista' };
  return { estado: { ...e, ocupado: true, actual: null }, efecto: 'acierto' };
}

/** Mixtle terminó de decir "llegó al suelo": ¿la misma basura vuelve a caer? (solo si nadie eligió mientras tanto) */
export function vuelveACaer(e: EstadoLluvia, residuo: string): boolean {
  return e.actual === residuo && e.enElSuelo && !e.ocupado;
}
