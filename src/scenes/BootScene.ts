import Phaser from 'phaser';
import { ALTO, ANCHO, PALETA, hex } from '../config';
import { catalogoArte } from '../arte/catalogo';
import { aDataUri } from '../arte/svg';
import { estiloTexto } from '../ui/texto';

/** Rasteriza todas las ilustraciones SVG y muestra una barra de carga. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    this.cameras.main.setBackgroundColor(PALETA.verde);
    const ancho = 760;
    const marco = this.add.graphics();
    marco.fillStyle(0xffffff, 0.25).fillRoundedRect(ANCHO / 2 - ancho / 2, ALTO / 2 - 24, ancho, 48, 24);
    const barra = this.add.graphics();
    this.add.text(ANCHO / 2, ALTO / 2 - 90, 'Caco al rescate', estiloTexto(72, PALETA.blanco)).setOrigin(0.5);

    this.load.on('progress', (p: number) => {
      barra.clear();
      barra.fillStyle(hex(PALETA.crema), 1);
      barra.fillRoundedRect(ANCHO / 2 - ancho / 2 + 6, ALTO / 2 - 18, Math.max(36, (ancho - 12) * p), 36, 18);
    });

    for (const a of catalogoArte()) {
      this.load.svg(a.clave, aDataUri(a.svg), { width: a.ancho, height: a.alto });
    }
  }

  create(): void {
    const params = new URLSearchParams(window.location.search);
    this.scene.start(params.has('galeria') ? 'Galeria' : 'Inicio');
  }
}
