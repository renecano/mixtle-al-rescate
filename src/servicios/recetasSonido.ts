/**
 * Efectos de sonido sintetizados en el navegador con Web Audio.
 * Son originales de este proyecto (no hay archivos de audio de terceros).
 * Cada receta es una lista de notas; así se pueden ajustar sin tocar el reproductor.
 */
export type Onda = 'sine' | 'triangle' | 'square' | 'sawtooth' | 'ruido';

export interface Nota {
  /** Inicio, en segundos desde que se dispara el efecto. */
  t: number;
  /** Duración en segundos. */
  d: number;
  /** Frecuencia inicial (Hz). En 'ruido' es la frecuencia del filtro. */
  f: number;
  /** Frecuencia final (Hz), para barridos. */
  f2?: number;
  onda: Onda;
  /** Volumen pico, de 0 a 1. */
  vol: number;
}

// Notas de la escala mayor (Hz) para que todo suene alegre y consonante.
const C5 = 523.25, D5 = 587.33, E5 = 659.25, G5 = 783.99, A5 = 880, C6 = 1046.5, E6 = 1318.5, G4 = 392, E4 = 329.63, C4 = 261.63;

export const RECETAS = {
  toque: [{ t: 0, d: 0.08, f: 700, f2: 980, onda: 'sine', vol: 0.35 }],
  recoger: [
    { t: 0, d: 0.12, f: 420, f2: 940, onda: 'triangle', vol: 0.4 },
    { t: 0.05, d: 0.1, f: 1200, f2: 1600, onda: 'sine', vol: 0.15 },
  ],
  bolsa: [
    { t: 0, d: 0.1, f: 900, onda: 'ruido', vol: 0.18 },
    { t: 0.02, d: 0.14, f: 220, f2: 140, onda: 'sine', vol: 0.35 },
  ],
  feliz: [
    { t: 0, d: 0.14, f: C5, onda: 'triangle', vol: 0.32 },
    { t: 0.11, d: 0.14, f: E5, onda: 'triangle', vol: 0.32 },
    { t: 0.22, d: 0.14, f: G5, onda: 'triangle', vol: 0.32 },
    { t: 0.33, d: 0.3, f: C6, onda: 'triangle', vol: 0.32 },
    { t: 0.33, d: 0.3, f: E6, onda: 'sine', vol: 0.12 },
  ],
  acierto: [
    { t: 0, d: 0.12, f: G5, onda: 'triangle', vol: 0.3 },
    { t: 0.09, d: 0.12, f: C6, onda: 'triangle', vol: 0.3 },
    { t: 0.18, d: 0.35, f: E6, onda: 'sine', vol: 0.26 },
    { t: 0.18, d: 0.25, f: 5200, onda: 'ruido', vol: 0.05 },
  ],
  // "Casi": dos notas suaves y cálidas, nada de zumbidos de error.
  otraVez: [
    { t: 0, d: 0.18, f: G4, f2: G4 * 1.02, onda: 'sine', vol: 0.3 },
    { t: 0.18, d: 0.26, f: E4, f2: E4 * 1.03, onda: 'sine', vol: 0.28 },
  ],
  plantar: [
    { t: 0, d: 0.22, f: 600, onda: 'ruido', vol: 0.14 },
    { t: 0.16, d: 0.16, f: 300, f2: 760, onda: 'triangle', vol: 0.32 },
  ],
  brote: [
    { t: 0, d: 0.1, f: E6, onda: 'sine', vol: 0.18 },
    { t: 0.07, d: 0.1, f: G5 * 2, onda: 'sine', vol: 0.16 },
    { t: 0.14, d: 0.18, f: C6 * 2, onda: 'sine', vol: 0.12 },
  ],
  aleteo: [
    { t: 0, d: 0.05, f: 2400, onda: 'ruido', vol: 0.08 },
    { t: 0.07, d: 0.05, f: 2400, onda: 'ruido', vol: 0.08 },
    { t: 0.14, d: 0.05, f: 2400, onda: 'ruido', vol: 0.08 },
  ],
  pajaro: [
    { t: 0, d: 0.07, f: 2600, f2: 3600, onda: 'sine', vol: 0.18 },
    { t: 0.1, d: 0.07, f: 2800, f2: 3900, onda: 'sine', vol: 0.18 },
    { t: 0.2, d: 0.12, f: 3400, f2: 2500, onda: 'sine', vol: 0.16 },
  ],
  fanfarria: [
    { t: 0, d: 0.16, f: C5, onda: 'triangle', vol: 0.3 },
    { t: 0.16, d: 0.16, f: C5, onda: 'triangle', vol: 0.3 },
    { t: 0.32, d: 0.16, f: C5, onda: 'triangle', vol: 0.3 },
    { t: 0.48, d: 0.4, f: G5, onda: 'triangle', vol: 0.32 },
    { t: 0.88, d: 0.16, f: E5, onda: 'triangle', vol: 0.3 },
    { t: 1.04, d: 0.16, f: G5, onda: 'triangle', vol: 0.3 },
    { t: 1.2, d: 0.7, f: C6, onda: 'triangle', vol: 0.34 },
    { t: 1.2, d: 0.7, f: E5, onda: 'sine', vol: 0.16 },
    { t: 1.2, d: 0.7, f: C4, onda: 'sine', vol: 0.16 },
  ],
  // Remate musical del logo: arpegio que sube y un brillo (v3).
  remate: [
    { t: 0, d: 0.12, f: C5, onda: 'triangle', vol: 0.3 },
    { t: 0.1, d: 0.12, f: E5, onda: 'triangle', vol: 0.3 },
    { t: 0.2, d: 0.12, f: G5, onda: 'triangle', vol: 0.3 },
    { t: 0.3, d: 0.5, f: C6, onda: 'triangle', vol: 0.34 },
    { t: 0.3, d: 0.5, f: E6, onda: 'sine', vol: 0.14 },
    { t: 0.3, d: 0.5, f: C4, onda: 'sine', vol: 0.18 },
    { t: 0.32, d: 0.3, f: 6000, onda: 'ruido', vol: 0.05 },
  ],
  // Transición entre pantallas: un soplido suave que pasa.
  barrido: [
    { t: 0, d: 0.42, f: 500, f2: 2400, onda: 'ruido', vol: 0.12 },
    { t: 0.08, d: 0.2, f: 660, f2: 990, onda: 'sine', vol: 0.08 },
  ],
  // Una hojita que llega al contador: un "tin" corto y agudo.
  hojita: [
    { t: 0, d: 0.07, f: E6, f2: G5 * 2, onda: 'sine', vol: 0.16 },
  ],
  // Racha dentro de la lección: tres notas que suben.
  racha: [
    { t: 0, d: 0.1, f: E5, onda: 'triangle', vol: 0.26 },
    { t: 0.08, d: 0.1, f: G5, onda: 'triangle', vol: 0.26 },
    { t: 0.16, d: 0.25, f: C6, onda: 'triangle', vol: 0.28 },
    { t: 0.16, d: 0.2, f: 7000, onda: 'ruido', vol: 0.04 },
  ],
  // A la mitad de la lección: un destello suave.
  mitad: [
    { t: 0, d: 0.12, f: C6, onda: 'sine', vol: 0.18 },
    { t: 0.06, d: 0.12, f: E6, onda: 'sine', vol: 0.16 },
    { t: 0.12, d: 0.3, f: G5 * 2, onda: 'sine', vol: 0.14 },
  ],
  // Cofre: se sacude (golpecitos de madera) y estalla al abrirse.
  sacude: [
    { t: 0, d: 0.05, f: 300, onda: 'ruido', vol: 0.16 },
    { t: 0.11, d: 0.05, f: 340, onda: 'ruido', vol: 0.16 },
    { t: 0.22, d: 0.05, f: 300, onda: 'ruido', vol: 0.16 },
    { t: 0.33, d: 0.05, f: 360, onda: 'ruido', vol: 0.18 },
    { t: 0.44, d: 0.05, f: 320, onda: 'ruido', vol: 0.18 },
    { t: 0.55, d: 0.05, f: 380, onda: 'ruido', vol: 0.2 },
  ],
  estallido: [
    { t: 0, d: 0.3, f: 1800, f2: 400, onda: 'ruido', vol: 0.22 },
    { t: 0, d: 0.18, f: 180, f2: 90, onda: 'sine', vol: 0.4 },
    { t: 0.06, d: 0.3, f: G5, onda: 'triangle', vol: 0.22 },
    { t: 0.12, d: 0.4, f: C6, onda: 'triangle', vol: 0.24 },
    { t: 0.12, d: 0.4, f: E6, onda: 'sine', vol: 0.1 },
  ],
  // Estampa que se revela: un brillo que sube.
  revelar: [
    { t: 0, d: 0.5, f: 2000, f2: 6000, onda: 'ruido', vol: 0.06 },
    { t: 0.05, d: 0.12, f: G5, onda: 'sine', vol: 0.16 },
    { t: 0.15, d: 0.12, f: C6, onda: 'sine', vol: 0.16 },
    { t: 0.25, d: 0.4, f: E6, onda: 'sine', vol: 0.16 },
  ],
  // El parque se transforma: un barrido mágico.
  transformar: [
    { t: 0, d: 0.9, f: 300, f2: 1200, onda: 'triangle', vol: 0.12 },
    { t: 0, d: 0.9, f: 900, f2: 5000, onda: 'ruido', vol: 0.05 },
    { t: 0.5, d: 0.12, f: E6, onda: 'sine', vol: 0.14 },
    { t: 0.62, d: 0.12, f: G5 * 2, onda: 'sine', vol: 0.12 },
    { t: 0.74, d: 0.3, f: C6 * 2, onda: 'sine', vol: 0.1 },
  ],
  // Comprar un accesorio: un "pop" con brillo.
  comprar: [
    { t: 0, d: 0.08, f: 400, f2: 900, onda: 'triangle', vol: 0.3 },
    { t: 0.07, d: 0.12, f: E6, onda: 'sine', vol: 0.18 },
    { t: 0.14, d: 0.25, f: G5 * 2, onda: 'sine', vol: 0.14 },
    { t: 0.1, d: 0.2, f: 6500, onda: 'ruido', vol: 0.04 },
  ],
  pagina: [
    { t: 0, d: 0.09, f: 1800, onda: 'ruido', vol: 0.08 },
    { t: 0.02, d: 0.09, f: D5, f2: A5, onda: 'sine', vol: 0.18 },
  ],
} satisfies Record<string, Nota[]>;

export type NombreEfecto = keyof typeof RECETAS;
