import Phaser from 'phaser';
import { ALTO, ANCHO, PALETA } from './config';
import { BootScene } from './scenes/BootScene';
import { GaleriaScene } from './scenes/GaleriaScene';
import { InicioScene } from './scenes/InicioScene';
import { IntroScene } from './scenes/IntroScene';
import { Nivel1Scene } from './scenes/Nivel1Scene';
import { Nivel2Scene } from './scenes/Nivel2Scene';
import { Nivel3Scene } from './scenes/Nivel3Scene';
import { exponerParaPruebas } from './servicios/pruebas';

const juego = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'juego',
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
  scene: [BootScene, InicioScene, IntroScene, Nivel1Scene, Nivel2Scene, Nivel3Scene, GaleriaScene],
});

exponerParaPruebas(juego);

export default juego;
