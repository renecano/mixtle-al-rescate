import { segun } from '../logica/diploma';
import type { Locucion } from '../voz/locucion';

/*
 * Lo que dice Caco en las aventuras de las unidades 2 a 5 (la de la unidad 1 está en src/data/textos.ts).
 * Todo se narra: npm run voz:generar junta estas frases solas.
 * TODO(Eco Urban): validar con las educadoras y educadores. Fuentes: docs/fuentes-contenido.md.
 *
 * Narraciones con números: los números se encadenan como audios aparte. Solo se ponen antes de
 * sustantivos masculinos ("un animal", "veintiún árboles"); los femeninos van después: "hojitas: doce".
 */

/** Diploma de una unidad: tema, qué cuenta cada columna y lo que narra Caco. */
export interface TextosDiploma {
  subtitulo: string;
  izquierda: (n: number) => string;
  derecha: (n: number) => string;
  narracion: (izquierda: number, derecha: number) => Locucion;
}

export const TEXTOS_AVENTURAS = {
  u2: {
    intro: '¡Hay animales atrapados en la basura! Toca la basura para liberarlos.',
    pista: 'Toca la basura que tiene atrapado a un animal.',
    // A7, A5, A10, A20
    agradece: {
      ardilla: '¡Gracias! Ahora puedo ir a buscar bellotas.',
      tlacuache: '¡Gracias! Ya puedo cargar a mis bebés en la espalda.',
      colibri: '¡Gracias! Ya puedo volar de flor en flor.',
      mariposa: '¡Gracias! Ya puedo buscar algodoncillo para mis huevitos.',
    },
    separar: 'Ahora separemos la basura que recogimos. Lleva cada una a su bote.',
    fin: '¡Rescataron a todos los animales y separaron la basura!',
    botonDiploma: 'Ver el diploma',
    diploma: {
      subtitulo: 'Los animales del parque',
      izquierda: (n) => segun(n, 'animal rescatado', 'animales rescatados'),
      derecha: (n) => segun(n, 'residuo separado', 'residuos separados'),
      narracion: (animales, residuos) => [
        '¡Felicidades, guardianes del parque! Rescataron a',
        { numero: animales, antesDeSustantivo: true },
        animales === 1 ? 'animal y separaron' : 'animales y separaron',
        { numero: residuos, antesDeSustantivo: true },
        residuos === 1 ? 'residuo.' : 'residuos.',
      ],
    } satisfies TextosDiploma,
  },
} as const;

export type UnidadConAventura = keyof typeof TEXTOS_AVENTURAS;
