import type Phaser from 'phaser';
import { PALETA } from '../config';
import { voz } from '../servicios/voz';
import { Boton } from './Boton';
import type { Caco } from './Caco';
import { Globo, type OpcionesGlobo } from './Globo';

/** Margen extra tras la duración estimada antes de seguir aunque la voz no haya avisado. */
const MARGEN_MS = 1200;

/**
 * Une a Caco, su globo de texto y la voz. Todo lo que Caco dice se narra en voz alta
 * y se muestra en el globo; el botón de repetir (o tocar a Caco) lo vuelve a decir.
 */
export class Narrador {
  readonly globo: Globo;
  private repetir: Boton;
  private activo = true;

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
    scene.events.once('shutdown', () => {
      this.activo = false;
      voz.callar();
    });
  }

  /**
   * Caco dice la frase (voz + globo). `alTerminar` se llama una sola vez: al acabar la voz
   * o, si se interrumpe o no hay voz, poco después de la duración estimada.
   */
  decir(texto: string, alTerminar?: () => void): number {
    this.globo.mostrar(texto);
    this.repetir.setPosition(this.globo.x + this.globo.ancho - 70, this.globo.y + 66).setVisible(true);
    let hecho = false;
    const fin = () => {
      if (hecho || !this.activo) return;
      hecho = true;
      alTerminar?.();
    };
    const ms = voz.decir(texto, () => {
      if (!this.activo) return;
      this.caco.callar();
      fin();
    });
    this.caco.hablar(ms);
    if (alTerminar) this.scene.time.delayedCall(ms + MARGEN_MS, fin);
    return ms;
  }

  ocultar(): void {
    this.globo.ocultar();
    this.repetir.setVisible(false);
  }

  private repetirFrase(): void {
    if (!this.globo.visible || !this.globo.contenido) return;
    const ms = voz.decir(this.globo.contenido, () => {
      if (this.activo) this.caco.callar();
    });
    this.caco.hablar(ms);
    this.scene.tweens.add({ targets: this.globo, scale: 1.03, duration: 120, yoyo: true });
  }
}
