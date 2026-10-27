import type { Animal } from '../data/animales';

/** Posiciones en el parque (px del juego, 1920×1080). Se comparten entre la intro y los niveles. */
export const CACO_NIVEL = { x: 190, y: 1060, escala: 0.72 };
export const BOLSA = { x: 370, y: 990 };

export interface ZonaParque {
  animal: Animal['id'];
  /** Rectángulo donde aparece la basura de esta zona. */
  basura: { x: number; y: number; ancho: number; alto: number };
  /** Lugares donde se planta en el nivel 3. */
  plantar: { x: number; y: number; que: 'arbol' | 'flores' }[];
}

export const ZONAS: readonly ZonaParque[] = [
  {
    animal: 'ardilla',
    basura: { x: 560, y: 820, ancho: 300, alto: 200 },
    plantar: [
      { x: 640, y: 900, que: 'arbol' },
      { x: 800, y: 1000, que: 'flores' },
    ],
  },
  {
    animal: 'colibri',
    basura: { x: 920, y: 880, ancho: 320, alto: 150 },
    plantar: [
      { x: 1000, y: 1010, que: 'flores' },
      { x: 1180, y: 960, que: 'arbol' },
    ],
  },
  {
    animal: 'mariposas',
    basura: { x: 1380, y: 860, ancho: 420, alto: 170 },
    plantar: [
      { x: 1460, y: 1010, que: 'flores' },
      { x: 1640, y: 960, que: 'flores' },
      { x: 1800, y: 1030, que: 'flores' },
    ],
  },
];

export const POS_ANIMALES = {
  ardilla: { x: 640, y: 800, escala: 0.62 },
  arbusto: { x: 1060, y: 820, escala: 0.85 },
  colibri: { x: 1060, y: 640, escala: 0.62 },
  mariposas: [
    { x: 1470, y: 800 },
    { x: 1610, y: 770 },
    { x: 1750, y: 810 },
  ],
} as const;
