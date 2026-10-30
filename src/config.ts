/** Resolución base del juego. Phaser escala a 16:9 con letterbox (FIT). */
export const ANCHO = 1920;
export const ALTO = 1080;

/** Paleta base pedida por Eco Urban y tonos de apoyo. */
export const PALETA = {
  verde: '#1F6B4A',
  azul: '#2459A6',
  naranja: '#B84A14',
  morado: '#6345A8',
  cielo: '#CFEAF7',
  cieloClaro: '#EAF6FC',
  pasto: '#BFE3A6',
  pastoClaro: '#DDF0CC',
  tierra: '#8A5A3B',
  crema: '#FFF8E7',
  tinta: '#1D2B24',
  blanco: '#FFFFFF',
} as const;

/** Convierte '#RRGGBB' a número para Phaser. */
export function hex(color: string): number {
  return parseInt(color.replace('#', ''), 16);
}

/** Nunito (licencia OFL), autoalojada con @fontsource: no se descarga nada de Google Fonts. */
export const FUENTE = '"Nunito", "Arial Rounded MT Bold", "Segoe UI", system-ui, sans-serif';

/** Tamaño mínimo de cualquier zona de toque, en píxeles del juego. */
export const TOQUE_MINIMO = 64;
