import type Phaser from 'phaser';
import { RescateScene } from '../scenes/RescateScene';
import { crearAventura } from './crear';
import type { OpcionesAventura } from './index';

/** Aventura de la unidad 2: "Rescate en el parque". */
export function crearAventuraUnidad2(padre: HTMLElement, op: OpcionesAventura): Phaser.Game {
  return crearAventura(padre, op, [RescateScene], 'Rescate');
}
