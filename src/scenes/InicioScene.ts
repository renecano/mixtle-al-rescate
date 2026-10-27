import Phaser from 'phaser';
import { ALTO, ANCHO, PALETA, hex } from '../config';
import { sonido } from '../servicios/sonido';
import { Boton } from '../ui/Boton';
import { agregarBotonSonido } from '../ui/BotonSonido';
import { estiloTexto } from '../ui/texto';
import { entrar, irA } from '../ui/transicion';

/** Pantalla tipo póster: título, botón "¡Jugar!" y botón de sonido. */
export class InicioScene extends Phaser.Scene {
  constructor() {
    super('Inicio');
  }

  create(): void {
    entrar(this);
    const cielo = this.add.graphics();
    cielo.fillGradientStyle(hex(PALETA.cielo), hex(PALETA.cielo), hex(PALETA.cieloClaro), hex(PALETA.cieloClaro), 1);
    cielo.fillRect(0, 0, ANCHO, ALTO);

    const titulo = this.add
      .text(ANCHO / 2, 250, 'Caco al rescate', estiloTexto(150, PALETA.blanco, { stroke: PALETA.verde, strokeThickness: 22 }))
      .setOrigin(0.5)
      .setShadow(0, 10, 'rgba(18,61,43,0.35)', 0, true, true);
    this.tweens.add({ targets: titulo, y: 262, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    new Boton(this, ANCHO / 2, ALTO - 190, {
      texto: '¡Jugar!',
      icono: 'icono-jugar',
      ancho: 520,
      alto: 170,
      tamanoTexto: 84,
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
