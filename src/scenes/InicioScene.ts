import Phaser from 'phaser';
import { ALTO, ANCHO, PALETA } from '../config';
import { sonido } from '../servicios/sonido';
import { Ardilla, Colibri, Mariposa } from '../ui/animales';
import { Boton } from '../ui/Boton';
import { agregarBotonSonido } from '../ui/BotonSonido';
import { Caco } from '../ui/Caco';
import { agregarParque } from '../ui/fondo';
import { estiloTexto } from '../ui/texto';
import { entrar, irA } from '../ui/transicion';

/** Pantalla tipo póster: título, botón "¡Jugar!" y botón de sonido. */
export class InicioScene extends Phaser.Scene {
  constructor() {
    super('Inicio');
  }

  create(): void {
    entrar(this);
    agregarParque(this);

    const titulo = this.add
      .text(ANCHO / 2 + 160, 200, 'Caco\nal rescate', estiloTexto(150, PALETA.blanco, {
        stroke: PALETA.verde,
        strokeThickness: 24,
        lineSpacing: -20,
      }))
      .setOrigin(0.5)
      .setShadow(0, 10, 'rgba(18,61,43,0.35)', 0, true, true);
    this.tweens.add({ targets: titulo, y: 214, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    new Caco(this, 330, ALTO - 50, 1.25);

    const ardilla = new Ardilla(this, 1600, 1010, 0.95, true);
    this.tweens.add({ targets: ardilla, y: 985, duration: 260, yoyo: true, repeat: -1, repeatDelay: 1600, ease: 'Quad.easeOut' });

    new Colibri(this, 1720, 560, 0.85, true);

    for (const [x, y] of [
      [1180, 610],
      [1420, 470],
      [1840, 780],
    ] as const) {
      const m = new Mariposa(this, x, y, 0.55, true);
      this.tweens.add({ targets: m, y: y - 34, x: x + 24, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    new Boton(this, ANCHO / 2 + 160, ALTO - 170, {
      texto: '¡Jugar!',
      icono: 'icono-jugar',
      ancho: 540,
      alto: 176,
      tamanoTexto: 88,
      color: PALETA.naranja,
      nombre: 'jugar',
      alPresionar: () => {
        sonido.desbloquear();
        irA(this, 'Intro');
      },
    }).latir();

    agregarBotonSonido(this);
  }
}
