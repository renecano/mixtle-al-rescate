import Phaser from 'phaser';

/** Escala a la que se rasterizan las texturas de Caco (ver arte/personajes.ts). */
const RASTER = 1.3;

/**
 * Caco, el cacomixtle guía. Un contenedor con la cola (que se mueve) y el cuerpo
 * (que respira, parpadea, habla y celebra). Sus coordenadas están en las unidades
 * del dibujo original: el origen es el centro de sus patas.
 */
export class Caco extends Phaser.GameObjects.Container {
  private cuerpo: Phaser.GameObjects.Image;
  private cola: Phaser.GameObjects.Image;
  private hablando: Phaser.Time.TimerEvent | null = null;
  private festejando = false;
  private texturaBase = 'caco';

  constructor(scene: Phaser.Scene, x: number, y: number, escala = 1) {
    super(scene, x, y);
    this.cola = scene.add.image(60, -40, 'caco-cola').setOrigin(28 / 260, 400 / 440).setScale(1 / RASTER);
    this.cuerpo = scene.add.image(0, 0, 'caco').setOrigin(0.5, 1).setScale(1 / RASTER);
    this.add([this.cola, this.cuerpo]);
    this.setScale(escala);
    this.setSize(320, 440);
    scene.add.existing(this);

    scene.tweens.add({
      targets: this.cola,
      angle: { from: -6, to: 7 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    scene.tweens.add({
      targets: this.cuerpo,
      scaleY: { from: 1 / RASTER, to: 1.025 / RASTER },
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.programarParpadeo();
  }

  /** Mueve la boca durante `ms` milisegundos. */
  hablar(ms: number): void {
    this.hablando?.remove();
    let abierta = false;
    const pasos = Math.max(1, Math.round(ms / 150));
    this.hablando = this.scene.time.addEvent({
      delay: 150,
      repeat: pasos - 1,
      callback: () => {
        abierta = !abierta;
        if (!this.festejando) this.cuerpo.setTexture(abierta ? 'caco-habla' : this.texturaBase);
        if (this.hablando && this.hablando.getRepeatCount() === 0) this.callar();
      },
    });
  }

  callar(): void {
    this.hablando?.remove();
    this.hablando = null;
    if (!this.festejando) this.cuerpo.setTexture(this.texturaBase);
  }

  /** Brinco de alegría con cara feliz. */
  celebrar(): void {
    this.festejando = true;
    this.cuerpo.setTexture('caco-feliz');
    const yBase = this.y;
    this.scene.tweens.add({
      targets: this,
      y: yBase - 46 * this.scaleY,
      duration: 220,
      yoyo: true,
      repeat: 1,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.y = yBase;
        this.festejando = false;
        this.cuerpo.setTexture(this.texturaBase);
      },
    });
  }

  /** Cara contenta de forma permanente (por ejemplo, en el diploma). */
  ponerFeliz(si: boolean): void {
    this.texturaBase = si ? 'caco-feliz' : 'caco';
    if (!this.festejando) this.cuerpo.setTexture(this.texturaBase);
  }

  private programarParpadeo(): void {
    this.scene.time.delayedCall(Phaser.Math.Between(2200, 4800), () => {
      if (!this.active) return;
      if (!this.festejando && !this.hablando && this.texturaBase === 'caco') {
        this.cuerpo.setTexture('caco-parpadeo');
        this.scene.time.delayedCall(140, () => {
          if (this.active && !this.hablando && !this.festejando) this.cuerpo.setTexture(this.texturaBase);
        });
      }
      this.programarParpadeo();
    });
  }
}
