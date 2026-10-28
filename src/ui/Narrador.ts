import type Phaser from 'phaser';
import { PALETA } from '../config';
import { voz } from '../servicios/voz';
import { textoDeLocucion, type Locucion } from '../voz/locucion';
import { Boton } from './Boton';
import type { Mixtle } from './Mixtle';
import { Globo, type OpcionesGlobo } from './Globo';

/** Margen extra tras la duración estimada antes de seguir aunque la voz no haya avisado. */
const MARGEN_MS = 1200;

/**
 * Une a Mixtle, su globo de texto y la voz. Todo lo que Mixtle dice se narra en voz alta
 * y se muestra en el globo; el botón de repetir (o tocar a Mixtle) lo vuelve a decir.
 */
export class Narrador {
  readonly globo: Globo;
  private repetir: Boton;
  private activo = true;
  private ultima: Locucion | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly mixtle: Mixtle,
    opGlobo: OpcionesGlobo,
  ) {
    this.globo = new Globo(scene, opGlobo);
    // 124 px del juego ≈ 66 px reales en una tablet de 1024 px (mínimo de toque: 64).
    this.globo.margenDerecho = 130;
    this.repetir = new Boton(scene, 0, 0, {
      icono: 'icono-repetir',
      ancho: 124,
      alto: 124,
      color: PALETA.verde,
      nombre: 'repetir',
      alPresionar: () => this.repetirFrase(),
    }).setDepth(501);
    this.repetir.setVisible(false);

    mixtle.hacerTocable().on('pointerup', () => this.repetirFrase());
    scene.events.once('shutdown', () => {
      this.activo = false;
      voz.callar();
    });
  }

  /**
   * Mixtle dice la frase (voz + globo). `alTerminar` se llama una sola vez: al acabar la voz
   * o, si se interrumpe o no hay voz, poco después de la duración estimada.
   */
  decir(locucion: Locucion, alTerminar?: () => void): number {
    this.ultima = locucion;
    // El globo es el subtítulo: muestra lo que dice Mixtle (con cifras en lugar de números en palabras).
    this.globo.mostrar(textoDeLocucion(locucion));
    this.repetir.setPosition(this.globo.x + this.globo.ancho - 84, this.globo.y + 80).setVisible(true);
    let hecho = false;
    const fin = () => {
      if (hecho || !this.activo) return;
      hecho = true;
      alTerminar?.();
    };
    const ms = voz.decir(locucion, () => {
      if (!this.activo) return;
      this.mixtle.callar();
      fin();
    });
    this.mixtle.hablar(ms);
    if (alTerminar) this.scene.time.delayedCall(ms + MARGEN_MS, fin);
    return ms;
  }

  ocultar(): void {
    this.globo.ocultar();
    this.repetir.setVisible(false);
  }

  private repetirFrase(): void {
    if (!this.globo.visible || !this.ultima) return;
    const ms = voz.decir(this.ultima, () => {
      if (this.activo) this.mixtle.callar();
    });
    this.mixtle.hablar(ms);
    this.scene.tweens.add({ targets: this.globo, scale: 1.03, duration: 120, yoyo: true });
  }
}
