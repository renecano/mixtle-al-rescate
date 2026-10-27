import type Phaser from 'phaser';
import { PALETA } from '../config';
import { voz } from '../servicios/voz';
import { Boton } from './Boton';
import type { Caco } from './Caco';
import { Globo, type OpcionesGlobo } from './Globo';

/**
 * Une a Caco, su globo de texto y la voz. Todo lo que Caco dice se narra en voz alta
 * y se muestra en el globo; el botón de repetir (o tocar a Caco) lo vuelve a decir.
 */
export class Narrador {
  readonly globo: Globo;
  private repetir: Boton;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly caco: Caco,
    opGlobo: OpcionesGlobo,
  ) {
    this.globo = new Globo(scene, opGlobo);
    this.globo.margenDerecho = 96;
    this.repetir = new Boton(scene, 0, 0, {
      icono: 'icono-repetir',
      ancho: 96,
      alto: 96,
      color: PALETA.verde,
      nombre: 'repetir',
      alPresionar: () => this.repetirFrase(),
    }).setDepth(501);
    this.repetir.setVisible(false);

    caco.hacerTocable().on('pointerup', () => this.repetirFrase());
    scene.events.once('shutdown', () => voz.callar());
  }

  /** Caco dice la frase (voz + globo). Devuelve la duración estimada en ms. */
  decir(texto: string, alTerminar?: () => void): number {
    this.globo.mostrar(texto);
    this.repetir.setPosition(this.globo.x + this.globo.ancho - 70, this.globo.y + 66).setVisible(true);
    const ms = voz.decir(texto, () => {
      this.caco.callar();
      alTerminar?.();
    });
    this.caco.hablar(ms);
    return ms;
  }

  ocultar(): void {
    this.globo.ocultar();
    this.repetir.setVisible(false);
  }

  private repetirFrase(): void {
    if (!this.globo.visible || !this.globo.contenido) return;
    const ms = voz.decir(this.globo.contenido, () => this.caco.callar());
    this.caco.hablar(ms);
    this.scene.tweens.add({ targets: this.globo, scale: 1.03, duration: 120, yoyo: true });
  }
}
