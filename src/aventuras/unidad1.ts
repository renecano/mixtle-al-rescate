import Phaser from 'phaser';
import { ALTO, ANCHO, PALETA } from '../config';
import { BonusScene } from '../scenes/BonusScene';
import { BootScene } from '../scenes/BootScene';
import { FinalScene } from '../scenes/FinalScene';
import { GaleriaScene } from '../scenes/GaleriaScene';
import { IntroScene } from '../scenes/IntroScene';
import { Nivel1Scene } from '../scenes/Nivel1Scene';
import { Nivel2Scene } from '../scenes/Nivel2Scene';
import { Nivel3Scene } from '../scenes/Nivel3Scene';
import { fijarJuegoActual } from './juegoActual';

export interface OpcionesAventura {
  /** Escena donde empieza (por defecto, la intro). 'Galeria' muestra todo el arte. */
  escenaInicial?: string;
  /** Se llama cuando el grupo termina la aventura (botón del diploma). */
  alTerminar: () => void;
}

/**
 * Aventura de la unidad 1: los tres niveles de la v1 con su intro, bonus y diploma.
 * Phaser se monta dentro de `padre` (un div de React) y se destruye al salir.
 */
export function crearAventuraUnidad1(padre: HTMLElement, op: OpcionesAventura): Phaser.Game {
  const juego = new Phaser.Game({
    type: Phaser.AUTO,
    parent: padre,
    backgroundColor: PALETA.verde,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: ANCHO,
      height: ALTO,
    },
    dom: { createContainer: true },
    input: { activePointers: 3 },
    render: { antialias: true, roundPixels: false },
    callbacks: {
      preBoot: (g) => {
        g.registry.set('escenaInicial', op.escenaInicial);
        g.registry.set('alTerminar', op.alTerminar);
      },
    },
    scene: [BootScene, IntroScene, Nivel1Scene, Nivel2Scene, Nivel3Scene, BonusScene, FinalScene, GaleriaScene],
  });
  fijarJuegoActual(juego);
  juego.events.once(Phaser.Core.Events.DESTROY, () => fijarJuegoActual(null));
  return juego;
}
