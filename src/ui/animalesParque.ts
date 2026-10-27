import Phaser from 'phaser';
import type { Animal } from '../data/animales';
import { Ardilla, Colibri, Mariposa } from './animales';
import { POS_ANIMALES } from './layoutParque';

/** Los animales colocados en el parque, con su reacción de alegría. */
export class AnimalesParque {
  readonly ardilla: Ardilla;
  readonly colibri: Colibri;
  readonly mariposas: Mariposa[];
  private readonly felices = new Set<Animal['id']>();

  constructor(private readonly scene: Phaser.Scene, felices: Animal['id'][] = []) {
    const pa = POS_ANIMALES;
    scene.add.image(pa.arbusto.x, pa.arbusto.y, 'arbusto').setOrigin(0.5, 0.95).setScale(pa.arbusto.escala / 1.2).setDepth(5);
    this.ardilla = new Ardilla(scene, pa.ardilla.x, pa.ardilla.y, pa.ardilla.escala).setDepth(6);
    this.colibri = new Colibri(scene, pa.colibri.x, pa.colibri.y, pa.colibri.escala).setDepth(7);
    this.mariposas = pa.mariposas.map((p) => new Mariposa(scene, p.x, p.y, 0.42).setDepth(7));
    for (const id of felices) this.ponerFeliz(id, false);
  }

  posicion(id: Animal['id']): { x: number; y: number } {
    if (id === 'ardilla') return { x: this.ardilla.x, y: this.ardilla.y - 120 };
    if (id === 'colibri') return { x: this.colibri.x, y: this.colibri.y };
    return { x: POS_ANIMALES.mariposas[1].x, y: POS_ANIMALES.mariposas[1].y };
  }

  estaFeliz(id: Animal['id']): boolean {
    return this.felices.has(id);
  }

  /** Cambia al animal a feliz; con `animar`, brinca o revolotea de alegría. */
  ponerFeliz(id: Animal['id'], animar = true): void {
    this.felices.add(id);
    const t = this.scene.tweens;
    if (id === 'ardilla') {
      this.ardilla.ponerFeliz(true);
      if (animar) {
        const y = this.ardilla.y;
        t.add({ targets: this.ardilla, y: y - 70, duration: 240, yoyo: true, repeat: 2, ease: 'Quad.easeOut' });
      }
      t.add({ targets: this.ardilla, angle: { from: -3, to: 3 }, duration: 700, yoyo: true, repeat: -1, delay: 1500, ease: 'Sine.easeInOut' });
    } else if (id === 'colibri') {
      this.colibri.ponerFeliz(true);
      if (animar) t.add({ targets: this.colibri, y: this.colibri.y - 90, duration: 500, ease: 'Back.easeOut' });
      else this.colibri.y -= 90;
      t.add({ targets: this.colibri, x: '+=40', duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else {
      this.mariposas.forEach((m, i) => {
        m.ponerFeliz(true);
        const base = { x: m.x, y: m.y - 110 };
        if (animar) t.add({ targets: m, y: base.y, duration: 600, delay: i * 120, ease: 'Back.easeOut' });
        else m.setPosition(base.x, base.y);
        t.add({
          targets: m,
          x: base.x + Phaser.Math.Between(-50, 50),
          y: base.y - Phaser.Math.Between(20, 60),
          duration: Phaser.Math.Between(1500, 2200),
          yoyo: true,
          repeat: -1,
          delay: 700 + i * 200,
          ease: 'Sine.easeInOut',
        });
      });
    }
  }
}
