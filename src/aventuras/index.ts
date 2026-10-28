import type Phaser from 'phaser';

export interface OpcionesAventura {
  /** Escena donde empieza (por defecto, la primera de la aventura). 'Galeria' muestra todo el arte. */
  escenaInicial?: string;
  /** Se llama cuando el grupo termina la aventura. */
  alTerminar: () => void;
}

export type CrearAventura = (padre: HTMLElement, op: OpcionesAventura) => Phaser.Game;

/**
 * Las aventuras (minijuegos con escena, en Phaser) de cada unidad. Se cargan bajo demanda:
 * Phaser y las escenas solo se descargan al entrar a una aventura.
 */
const AVENTURAS: Record<string, () => Promise<CrearAventura>> = {
  u1: () => import('./unidad1').then((m) => m.crearAventuraUnidad1),
};

export function cargarAventura(unidadId: string): Promise<CrearAventura> | null {
  return AVENTURAS[unidadId]?.() ?? null;
}
