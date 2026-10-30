import { archivoDeFrase } from './hash';
import { piezasDeTexto, textoHablado, type Locucion } from './locucion';

/**
 * public/voz/manifiesto.json: qué frases tienen audio y cuánto duran. La clave es el hash del texto
 * (estable: con él se busca la frase y se nombra una grabación humana); `archivo` es el mp3 publicado,
 * que además lleva la configuración de voz en el nombre (`<hash-texto>.<hash-config>.mp3`), para que un
 * cambio de voz nunca choque con una copia guardada en alguna caché.
 */
export interface Manifiesto {
  version: number;
  frases: Record<string, { texto: string; ms: number; config?: string; archivo?: string }>;
}

/** Pausa entre piezas encadenadas ("Separaron bien" · "trece" · "residuos"), solo si no hay frase completa. */
export const PAUSA_ENTRE_PIEZAS_MS = 40;

export interface PlanLocucion {
  /** Archivos a reproducir en orden, o null si a alguna pieza le falta audio. */
  archivos: string[] | null;
  faltantes: string[];
  /** Duración total si hay audio (con las pausas entre piezas). */
  ms: number;
}

/**
 * Decide cómo decir una locución con los audios disponibles. Primero busca la frase completa
 * grabada de corrido (se pregeneran las que de verdad pueden salir, como el resumen de cada
 * lección); si no está, encadena las piezas (texto + números del 0 al 100).
 */
export function planDeLocucion(l: Locucion, manifiesto: Manifiesto | null): PlanLocucion {
  if (typeof l !== 'string' && l.length > 1) {
    const completa = archivoDeFrase(textoHablado(l));
    const audio = manifiesto?.frases[completa];
    if (audio) return { archivos: [audio.archivo ?? completa], faltantes: [], ms: audio.ms };
  }
  const piezas = piezasDeTexto(l);
  const claves = piezas.map(archivoDeFrase);
  const faltantes = piezas.filter((_, i) => !manifiesto?.frases[claves[i]!]);
  if (faltantes.length) return { archivos: null, faltantes, ms: 0 };
  const entradas = claves.map((c) => manifiesto!.frases[c]!);
  const ms = entradas.reduce((s, e) => s + e.ms, 0) + PAUSA_ENTRE_PIEZAS_MS * (claves.length - 1);
  return { archivos: entradas.map((e, i) => e.archivo ?? claves[i]!), faltantes: [], ms };
}
