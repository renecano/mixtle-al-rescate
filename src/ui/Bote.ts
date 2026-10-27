import Phaser from 'phaser';
import { hex } from '../config';
import type { Categoria } from '../data/categorias';
import { estiloTexto } from './texto';

const RASTER = 1.2;
const ALTO_ETIQUETA = 66;

/**
 * Bote de una categoría: cuerpo con ícono, tapa que se abre y etiqueta con el nombre.
 * Color + ícono + texto: nunca depende solo del color. El origen es el centro de la base.
 */
export class Bote extends Phaser.GameObjects.Container {
  readonly categoria: Categoria;
  readonly ancho: number;
  readonly altoBote: number;
  private tapa: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, yBase: number, categoria: Categoria, ancho: number) {
    super(scene, x, yBase);
    this.categoria = categoria;
    this.ancho = ancho;
    const s = ancho / 260;
    this.altoBote = 300 * s;

    const cuerpo = scene.add.image(0, 0, `bote-${categoria.id}`).setOrigin(0.5, 1).setScale(s / RASTER);
    this.tapa = scene.add
      .image(0, -(300 - 92) * s + 4 * s, `tapa-${categoria.id}`)
      .setOrigin(0.5, 72 / 80)
      .setScale(s / RASTER);

    const etiqueta = scene.add.graphics();
    const anchoEtiqueta = Math.max(ancho + 10, 230);
    etiqueta.fillStyle(0xffffff, 1).fillRoundedRect(-anchoEtiqueta / 2, 14, anchoEtiqueta, ALTO_ETIQUETA, 24);
    etiqueta.lineStyle(6, hex(categoria.color), 1).strokeRoundedRect(-anchoEtiqueta / 2, 14, anchoEtiqueta, ALTO_ETIQUETA, 24);
    const nombre = scene.add
      .text(0, 14 + ALTO_ETIQUETA / 2, categoria.nombre, estiloTexto(categoria.nombre.length > 12 ? 34 : 40, categoria.color))
      .setOrigin(0.5);

    this.add([cuerpo, this.tapa, etiqueta, nombre]);
    // Área de toque y de soltar: todo el bote con su tapa y su etiqueta, con margen.
    const local = this.areaLocal();
    this.setSize(local.width, local.height);
    // Phaser mide el área desde la esquina del tamaño (centrado en el origen), por eso se desplaza.
    this.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, local.height / 2 + local.y, local.width, local.height),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });
    this.setName(`bote-${categoria.id}`);
    scene.add.existing(this);
  }

  /** Área del bote relativa a su origen (centro de la base). */
  private areaLocal(): Phaser.Geom.Rectangle {
    const w = Math.max(this.ancho + 10, 230) + 40;
    const arriba = this.altoBote + 90;
    return new Phaser.Geom.Rectangle(-w / 2, -arriba, w, arriba + 14 + ALTO_ETIQUETA);
  }

  /** Rectángulo (en coordenadas del juego) donde se puede soltar un residuo. */
  get zonaSoltar(): Phaser.Geom.Rectangle {
    const a = this.areaLocal();
    return new Phaser.Geom.Rectangle(this.x + a.x, this.y + a.y, a.width, a.height);
  }

  /** Punto de la boca del bote, donde cae el residuo. */
  get boca(): { x: number; y: number } {
    return { x: this.x, y: this.y - this.altoBote * 0.7 };
  }

  abrir(): void {
    this.scene.tweens.add({ targets: this.tapa, y: this.tapa.y - 40, angle: -18, duration: 160, yoyo: true, hold: 260, ease: 'Quad.easeOut' });
  }

  celebrar(): void {
    this.scene.tweens.add({ targets: this, scaleY: 0.92, scaleX: 1.06, duration: 110, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
  }

  /** Movimiento suave de "aquí no" (sin sonido de error). */
  sacudir(): void {
    this.scene.tweens.add({ targets: this, angle: { from: -4, to: 4 }, duration: 80, yoyo: true, repeat: 2, onComplete: () => this.setAngle(0) });
  }

  resaltar(si: boolean): void {
    this.setScale(si ? 1.06 : 1);
  }
}
