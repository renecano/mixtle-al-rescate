import type Phaser from 'phaser';
import { BosqueScene } from '../scenes/BosqueScene';
import { crearAventura } from './crear';
import type { OpcionesAventura } from './index';

/** Aventura de la unidad 3: "Siembra un bosquecito" (sembrar y regar; amplía el nivel 3 de la v1). */
export function crearAventuraUnidad3(padre: HTMLElement, op: OpcionesAventura): Phaser.Game {
  return crearAventura(padre, op, [BosqueScene], 'Bosque');
}
