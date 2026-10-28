import { archivoDeFrase } from './hash';
import { piezasDeTexto, type Locucion } from './locucion';

/** public/voz/manifiesto.json: qué frases tienen audio (por nombre de archivo) y cuánto duran. */
export interface Manifiesto {
  version: number;
  frases: Record<string, { texto: string; ms: number; config?: string }>;
}

/** Pausa entre piezas encadenadas ("Separaron bien" · "trece" · "residuos"). */
export const PAUSA_ENTRE_PIEZAS_MS = 90;

export interface PlanLocucion {
  /** Archivos a reproducir en orden, o null si a alguna pieza le falta audio. */
  archivos: string[] | null;
  faltantes: string[];
  /** Duración total si hay audio (con las pausas entre piezas). */
  ms: number;
}

/** Decide cómo decir una locución con los audios disponibles. */
export function planDeLocucion(l: Locucion, manifiesto: Manifiesto | null): PlanLocucion {
  const piezas = piezasDeTexto(l);
  const archivos = piezas.map(archivoDeFrase);
  const faltantes = piezas.filter((_, i) => !manifiesto?.frases[archivos[i]!]);
  if (faltantes.length) return { archivos: null, faltantes, ms: 0 };
  const ms = archivos.reduce((s, a) => s + manifiesto!.frases[a]!.ms, 0) + PAUSA_ENTRE_PIEZAS_MS * (archivos.length - 1);
  return { archivos, faltantes: [], ms };
}
