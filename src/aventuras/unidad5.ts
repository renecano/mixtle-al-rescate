import type Phaser from 'phaser';
import { LoncheraScene } from '../scenes/LoncheraScene';
import { crearAventura } from './crear';
import type { OpcionesAventura } from './index';

/** Aventura de la unidad 5: "Mi lonchera sin basura". */
export function crearAventuraUnidad5(padre: HTMLElement, op: OpcionesAventura): Phaser.Game {
  return crearAventura(padre, op, [LoncheraScene], 'Lonchera');
}
