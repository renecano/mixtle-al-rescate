import Phaser from 'phaser';
import { PALETA, hex } from '../config';
import { sonido } from '../servicios/sonido';

/** Un lugar donde se puede soltar una cosa (un bote, la lonchera…). */
export interface Destino {
  id: string;
  /** Lo que se toca o donde se suelta (con área interactiva). */
  objeto: Phaser.GameObjects.Container | Phaser.GameObjects.Image;
  /** Zona de soltar, en coordenadas del juego. */
  zona: Phaser.Geom.Rectangle;
  /** Resaltar mientras se arrastra encima (opcional). */
  resaltar?: (si: boolean) => void;
}

export interface Pieza {
  id: string;
  clave: string;
}

interface Opciones {
  piezas: Pieza[];
  destinos: Destino[];
  /** Dónde aparece cada pieza, esperando a que la lleven a su lugar. */
  pedestal: { x: number; y: number };
  tamano: number;
  /** ¿Esta pieza va en este destino? */
  esCorrecto: (pieza: Pieza, destino: Destino) => boolean;
  /** Al aparecer cada pieza (por ejemplo, Mixtle pregunta a dónde va). */
  alAparecer: (pieza: Pieza) => void;
  /** Bien: la pieza ya entró. `seguir` muestra la siguiente cuando Mixtle termina de hablar. */
  alAcertar: (pieza: Pieza, destino: Destino, seguir: () => void) => void;
  /** Casi: la pieza regresa al pedestal; nunca se castiga. */
  alFallar: (pieza: Pieza, destino: Destino) => void;
  alTerminar: () => void;
}

/**
 * Llevar cosas a su lugar, una por una: se arrastran o, si cuesta arrastrar, se toca el destino.
 * Es la mecánica del nivel 2 de la v1, generalizada para las aventuras nuevas.
 */
export class Clasificador {
  private cola: Pieza[];
  private actual: { pieza: Pieza; imagen: Phaser.GameObjects.Image } | null = null;
  private esperando = false;
  private finArrastre = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly op: Opciones,
  ) {
    this.cola = [...op.piezas];
    for (const d of op.destinos) {
      d.objeto.on('pointerup', () => {
        // Tocar el destino también sirve (mouse del facilitador o si cuesta arrastrar).
        if (performance.now() - this.finArrastre < 250) return;
        if (this.actual && this.esperando) this.soltarEn(d);
      });
    }
    scene.input.on('dragstart', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) => {
      if (!this.esperando || obj !== this.actual?.imagen) return;
      scene.tweens.killTweensOf(obj);
      obj.setScale(this.escala(obj) * 1.08).setAngle(0);
      sonido.tocar('toque');
    });
    scene.input.on('drag', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image, x: number, y: number) => {
      if (!this.esperando || obj !== this.actual?.imagen) return;
      obj.setPosition(x, y);
      for (const d of op.destinos) d.resaltar?.(d.zona.contains(x, y));
    });
    scene.input.on('dragend', (_p: Phaser.Input.Pointer, obj: Phaser.GameObjects.Image) => {
      if (!this.esperando || obj !== this.actual?.imagen) return;
      this.finArrastre = performance.now();
      for (const d of op.destinos) d.resaltar?.(false);
      const destino = op.destinos.find((d) => d.zona.contains(obj.x, obj.y));
      if (destino) this.soltarEn(destino);
      else this.regresar(obj);
    });
  }

  /** Cuántas piezas faltan (incluida la que está en el pedestal). */
  get faltan(): number {
    return this.cola.length + (this.actual ? 1 : 0);
  }

  empezar(): void {
    this.siguiente();
  }

  private escala(img: Phaser.GameObjects.Image): number {
    return this.op.tamano / Math.max(img.width, img.height);
  }

  private siguiente(): void {
    const pieza = this.cola.shift();
    this.actual = null;
    if (!pieza) {
      this.op.alTerminar();
      return;
    }
    const { x, y } = this.op.pedestal;
    const imagen = this.scene.add.image(x, y, pieza.clave).setDepth(700);
    const escala = this.escala(imagen);
    imagen.setScale(0);
    imagen.setInteractive({ useHandCursor: true, draggable: true });
    imagen.setName(`pieza-${pieza.id}`);
    this.actual = { pieza, imagen };
    // Se puede llevar a su lugar desde que aparece (un toque rápido no se pierde).
    this.esperando = true;
    this.scene.tweens.add({
      targets: imagen,
      scale: escala,
      duration: 380,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.scene.tweens.add({ targets: imagen, angle: { from: -4, to: 4 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      },
    });
    this.op.alAparecer(pieza);
  }

  private soltarEn(destino: Destino): void {
    const actual = this.actual;
    if (!actual) return;
    const { pieza, imagen } = actual;
    if (!this.op.esCorrecto(pieza, destino)) {
      sonido.tocar('otraVez');
      this.scene.tweens.add({ targets: destino.objeto, x: destino.objeto.x + 12, duration: 60, yoyo: true, repeat: 3 });
      this.regresar(imagen);
      this.op.alFallar(pieza, destino);
      return;
    }
    this.esperando = false;
    imagen.disableInteractive();
    this.scene.tweens.killTweensOf(imagen);
    sonido.tocar('acierto');
    this.scene.tweens.add({
      targets: imagen,
      x: destino.zona.centerX,
      y: destino.zona.centerY,
      scale: imagen.scale * 0.4,
      angle: 0,
      duration: 420,
      ease: 'Quad.easeIn',
      onComplete: () => {
        imagen.destroy();
        this.op.alAcertar(pieza, destino, () => this.siguiente());
      },
    });
  }

  private regresar(obj: Phaser.GameObjects.Image): void {
    const { x, y } = this.op.pedestal;
    this.scene.tweens.add({ targets: obj, x, y, scale: this.escala(obj), angle: 0, duration: 320, ease: 'Back.easeOut' });
  }
}

/** Pedestal claro donde aparece cada pieza (el mismo look que el nivel 2 de la v1). */
export function pedestal(scene: Phaser.Scene, x: number, y: number, radio = 152): void {
  const brillo = scene.add.circle(x, y, radio + 26, 0xffffff, 0.5).setDepth(15);
  scene.add.circle(x, y, radio, hex(PALETA.crema), 0.95).setDepth(15).setStrokeStyle(8, hex(PALETA.pasto));
  scene.tweens.add({ targets: brillo, scale: 1.08, alpha: 0.35, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
}
