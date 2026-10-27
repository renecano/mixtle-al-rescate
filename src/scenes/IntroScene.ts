import Phaser from 'phaser';
import { ALTO, ANCHO, PALETA } from '../config';
import { TEXTOS } from '../data/textos';
import { escenaSiguiente } from '../logica/flujo';
import { AnimalesParque } from '../ui/animalesParque';
import { Boton } from '../ui/Boton';
import { agregarBotonSonido } from '../ui/BotonSonido';
import { Caco } from '../ui/Caco';
import { agregarParque } from '../ui/fondo';
import { Narrador } from '../ui/Narrador';
import { entrar, irA } from '../ui/transicion';

/** Caco se presenta: tres frases cortas, narradas, que se avanzan con un toque. */
export class IntroScene extends Phaser.Scene {
  private paso = 0;
  private ultimoToque = 0;
  private narrador!: Narrador;

  constructor() {
    super('Intro');
  }

  create(): void {
    entrar(this);
    this.paso = 0;
    agregarParque(this);
    new AnimalesParque(this);

    const caco = new Caco(this, 280, ALTO - 30, 1.1).setDepth(20);
    this.narrador = new Narrador(this, caco, {
      x: 520,
      y: 300,
      ancho: 1100,
      apuntaA: { x: 330, y: ALTO - 30 - 300 * 1.1 },
      tamanoTexto: 58,
    });

    // Tocar en cualquier parte avanza (Caco y los botones tienen su propia acción).
    const zona = this.add.zone(0, 0, ANCHO, ALTO).setOrigin(0).setInteractive().setName('fondo-intro');
    zona.on('pointerup', () => this.avanzar());

    new Boton(this, ANCHO - 170, ALTO - 120, {
      icono: 'icono-siguiente',
      ancho: 200,
      alto: 140,
      color: PALETA.naranja,
      nombre: 'siguiente',
      alPresionar: () => this.avanzar(),
    })
      .setDepth(600)
      .latir();

    agregarBotonSonido(this);
    this.time.delayedCall(450, () => this.decirPaso());
  }

  private decirPaso(): void {
    const frase = TEXTOS.intro[this.paso];
    if (frase) this.narrador.decir(frase);
  }

  private avanzar(): void {
    const ahora = this.time.now;
    if (ahora - this.ultimoToque < 350) return; // evita dobles toques accidentales
    this.ultimoToque = ahora;
    this.paso += 1;
    if (this.paso >= TEXTOS.intro.length) {
      irA(this, escenaSiguiente('Intro'));
      return;
    }
    this.decirPaso();
  }
}
