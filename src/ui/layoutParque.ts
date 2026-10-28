import type { Animal } from '../data/animales';
import type { ZonaReparto } from '../logica/reparto';

/** Posiciones en el parque (px del juego, 1920×1080). Se comparten entre la intro y los niveles. */
export const MIXTLE_NIVEL = { x: 200, y: 1065, escala: 0.72 };
export const BOLSA = { x: 400, y: 1000 };
/** Globo de Mixtle en los niveles del parque: arriba de él, sin tapar a los animales. */
export const GLOBO_NIVEL = { x: 40, y: 250, ancho: 860, apuntaA: { x: 230, y: 900 }, tamanoTexto: 48 };

export const POS_ANIMALES = {
  ardilla: { x: 650, y: 790, escala: 0.62 },
  arbusto: { x: 1100, y: 830, escala: 0.85 },
  colibri: { x: 1100, y: 650, escala: 0.62 },
  mariposas: [
    { x: 1500, y: 790 },
    { x: 1640, y: 760 },
    { x: 1780, y: 800 },
  ],
} as const;

export interface ZonaParque {
  animal: Animal['id'];
  reparto: ZonaReparto;
  /** Lugares donde se planta en el nivel 3. */
  plantar: { x: number; y: number; que: 'arbol' | 'flores' }[];
}

export const ZONAS: readonly ZonaParque[] = [
  {
    animal: 'ardilla',
    reparto: {
      rect: { x: 530, y: 820, ancho: 380, alto: 200 },
      evitar: [{ x: 650, y: 720, r: 120 }],
    },
    plantar: [
      { x: 820, y: 860, que: 'arbol' },
      { x: 600, y: 990, que: 'flores' },
    ],
  },
  {
    animal: 'colibri',
    reparto: {
      rect: { x: 950, y: 870, ancho: 380, alto: 150 },
      evitar: [{ x: 1100, y: 760, r: 130 }],
    },
    plantar: [
      { x: 1000, y: 1000, que: 'flores' },
      { x: 1270, y: 900, que: 'arbol' },
    ],
  },
  {
    animal: 'mariposas',
    reparto: {
      rect: { x: 1390, y: 860, ancho: 460, alto: 160 },
      evitar: POS_ANIMALES.mariposas.map((m) => ({ x: m.x, y: m.y, r: 70 })),
    },
    plantar: [
      { x: 1460, y: 990, que: 'flores' },
      { x: 1640, y: 940, que: 'flores' },
      { x: 1810, y: 1000, que: 'flores' },
    ],
  },
];
