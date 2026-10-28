import type Phaser from 'phaser';
import { BiciScene } from '../scenes/BiciScene';
import { crearAventura } from './crear';
import type { OpcionesAventura } from './index';

/** Aventura de la unidad 4: "En bici a la escuela". */
export function crearAventuraUnidad4(padre: HTMLElement, op: OpcionesAventura): Phaser.Game {
  return crearAventura(padre, op, [BiciScene], 'Bici');
}
