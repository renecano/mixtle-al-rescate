import Phaser from 'phaser';
import { ALTO, ANCHO, PALETA } from '../config';
import { BootScene } from '../scenes/BootScene';
import { FinalScene } from '../scenes/FinalScene';
import { GaleriaScene } from '../scenes/GaleriaScene';
import type { OpcionesAventura } from './index';
import { fijarJuegoActual } from './juegoActual';

/**
 * Monta una aventura de Phaser dentro de `padre` (un div de React). Todas comparten el arranque
 * (BootScene rasteriza el arte), el diploma (FinalScene) y la galería; cada unidad aporta sus escenas.
 * `primera` es la escena donde empieza si React no pide otra (`escenaInicial`, para pruebas).
 */
export function crearAventura(padre: HTMLElement, op: OpcionesAventura, escenas: Phaser.Types.Scenes.SceneType[], primera: string): Phaser.Game {
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
        g.registry.set('primeraEscena', primera);
        g.registry.set('alTerminar', op.alTerminar);
      },
    },
    scene: [BootScene, ...escenas, FinalScene, GaleriaScene],
  });
  fijarJuegoActual(juego);
  juego.events.once(Phaser.Core.Events.DESTROY, () => fijarJuegoActual(null));
  return juego;
}
