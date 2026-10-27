/** Lo mínimo que necesitamos de una voz (compatible con SpeechSynthesisVoice). */
export interface VozDisponible {
  lang: string;
  name: string;
  localService: boolean;
}

/** Preferencia de idioma: primero español de México, luego otras variantes latinoamericanas. */
const PRIORIDAD_IDIOMA = ['es-mx', 'es-us', 'es-419', 'es-co', 'es-ar', 'es-cl', 'es-pe', 'es-es', 'es'];

/**
 * Elige la mejor voz en español disponible. Devuelve null si no hay ninguna;
 * en ese caso se usa la voz por defecto del navegador con `lang = es-MX`.
 */
export function elegirVoz<V extends VozDisponible>(voces: readonly V[]): V | null {
  const normal = (lang: string) => lang.toLowerCase().replace('_', '-');
  let mejor: V | null = null;
  let mejorPuntaje = -1;
  for (const voz of voces) {
    const lang = normal(voz.lang);
    if (!lang.startsWith('es')) continue;
    const idx = PRIORIDAD_IDIOMA.findIndex((p) => lang === p || (p === 'es' && lang.startsWith('es')));
    let puntaje = (PRIORIDAD_IDIOMA.length - (idx === -1 ? PRIORIDAD_IDIOMA.length : idx)) * 10;
    // Las voces "naturales"/en línea suelen sonar mejor; las locales funcionan sin internet.
    if (/natural|online|neural/i.test(voz.name)) puntaje += 4;
    if (voz.localService) puntaje += 2;
    if (puntaje > mejorPuntaje) {
      mejor = voz;
      mejorPuntaje = puntaje;
    }
  }
  return mejor;
}

/** Duración aproximada de una frase hablada (ms), para animar la boca de Caco y esperar sin voz. */
export function estimarDuracion(texto: string, velocidad = 0.9): number {
  const palabras = texto.trim().split(/\s+/).filter(Boolean).length;
  const pausas = (texto.match(/[.,;:!?¡¿]/g) ?? []).length;
  return Math.round((palabras * 340 + pausas * 120 + 300) / velocidad);
}
