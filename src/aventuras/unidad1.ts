import type Phaser from 'phaser';
import { BonusScene } from '../scenes/BonusScene';
import { IntroScene } from '../scenes/IntroScene';
import { Nivel1Scene } from '../scenes/Nivel1Scene';
import { Nivel2Scene } from '../scenes/Nivel2Scene';
import { Nivel3Scene } from '../scenes/Nivel3Scene';
import { crearAventura } from './crear';
import type { OpcionesAventura } from './index';

/**
 * Aventura de la unidad 1: los tres niveles de la v1 con su intro, bonus y diploma.
 * Phaser se monta dentro de `padre` (un div de React) y se destruye al salir.
 */
export function crearAventuraUnidad1(padre: HTMLElement, op: OpcionesAventura): Phaser.Game {
  return crearAventura(padre, op, [IntroScene, Nivel1Scene, Nivel2Scene, Nivel3Scene, BonusScene], 'Intro');
}
