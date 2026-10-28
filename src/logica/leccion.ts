import type { Ejercicio, Leccion } from '../contenido/tipos';

/**
 * Motor de una lección (sin interfaz, para probarlo a fondo).
 * - Los ejercicios van en orden; si uno se falla, se sigue intentando con pistas hasta acertarlo
 *   (nunca hay vidas ni castigos) y además vuelve al final de la lección para repasar.
 * - Cuenta cuántos salieron a la primera y cuántas hojitas se ganan.
 */
export interface SesionLeccion {
  leccion: Leccion;
  /** Lo que falta por hacer, en orden. El primero es el actual. */
  cola: Ejercicio[];
  /** Ejercicios ya resueltos (cuenta para la barra de progreso). */
  hechos: number;
  /** ids que tuvieron al menos un error. */
  fallados: Set<string>;
  /** ids que ya se mandaron a repaso (solo una vez cada uno). */
  enRepaso: Set<string>;
  /** Errores en el ejercicio actual (para dar pistas). */
  erroresActual: number;
  aLaPrimera: number;
  /**
   * Racha dentro de la lección: aciertos a la primera seguidos. Un error la regresa a cero sin
   * decir nada (nunca hay mensajes de culpa) y no pasa de una lección a otra ni de un día a otro.
   */
  racha: number;
}

export function iniciarLeccion(leccion: Leccion): SesionLeccion {
  return {
    leccion,
    cola: [...leccion.ejercicios],
    hechos: 0,
    fallados: new Set(),
    enRepaso: new Set(),
    erroresActual: 0,
    aLaPrimera: 0,
    racha: 0,
  };
}

export function ejercicioActual(s: SesionLeccion): Ejercicio | null {
  return s.cola[0] ?? null;
}

/** Ejercicios en total, incluidos los de repaso que se han agregado. */
export function totalEjercicios(s: SesionLeccion): number {
  return s.hechos + s.cola.length;
}

/** Avance de 0 a 1 para la barra de progreso. */
export function avance(s: SesionLeccion): number {
  const total = totalEjercicios(s);
  return total === 0 ? 1 : s.hechos / total;
}

export function terminada(s: SesionLeccion): boolean {
  return s.cola.length === 0;
}

/** Un error en el ejercicio actual: se queda (para intentar otra vez) y se agenda su repaso. */
export function registrarError(s: SesionLeccion): SesionLeccion {
  const actual = ejercicioActual(s);
  if (!actual) return s;
  const fallados = new Set(s.fallados).add(actual.id);
  const enRepaso = new Set(s.enRepaso);
  const cola = [...s.cola];
  // Cada ejercicio fallado se repasa una sola vez al final (si se vuelve a fallar en el repaso,
  // se sigue intentando ahí mismo con pistas, sin agregar más).
  if (!enRepaso.has(actual.id)) {
    enRepaso.add(actual.id);
    cola.push(actual);
  }
  return { ...s, fallados, enRepaso, cola, erroresActual: s.erroresActual + 1, racha: 0 };
}

/** Acierto en el ejercicio actual: avanza. */
export function registrarAcierto(s: SesionLeccion): SesionLeccion {
  const actual = ejercicioActual(s);
  if (!actual) return s;
  const primeraVez = !s.fallados.has(actual.id);
  return {
    ...s,
    cola: s.cola.slice(1),
    hechos: s.hechos + 1,
    erroresActual: 0,
    aLaPrimera: s.aLaPrimera + (primeraVez ? 1 : 0),
    racha: primeraVez ? s.racha + 1 : 0,
  };
}

/** Las rachas que se celebran ("¡3 seguidas!"). */
export const HITOS_RACHA = [3, 5, 7, 10] as const;

/** Si con esta racha toca celebrar, el número; si no, null. */
export function hitoDeRacha(racha: number): number | null {
  return (HITOS_RACHA as readonly number[]).includes(racha) ? racha : null;
}

/** ¿Este acierto hizo cruzar la mitad de la lección? (para la pequeña celebración de la barra). */
export function cruzaLaMitad(antes: SesionLeccion, despues: SesionLeccion): boolean {
  return avance(antes) < 0.5 && avance(despues) >= 0.5;
}

/** Hojitas por terminar una lección: 10 por completarla + 1 por cada ejercicio a la primera. */
export const HOJITAS_POR_LECCION = 10;

export function hojitasGanadas(s: SesionLeccion): number {
  return HOJITAS_POR_LECCION + s.aLaPrimera;
}

/** Resumen para la pantalla final. */
export function resumenLeccion(s: SesionLeccion): { ejercicios: number; aLaPrimera: number; hojitas: number } {
  return { ejercicios: s.leccion.ejercicios.length, aLaPrimera: s.aLaPrimera, hojitas: hojitasGanadas(s) };
}
