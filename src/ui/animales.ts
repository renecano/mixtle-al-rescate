import Phaser from 'phaser';

const RASTER = 1.2;

/** Colibrí: cuerpo + ala que aletea rapidísimo cuando está feliz. */
export class Colibri extends Phaser.GameObjects.Container {
  private cuerpo: Phaser.GameObjects.Image;
  private ala: Phaser.GameObjects.Image;
  private aleteo: Phaser.Tweens.Tween | null = null;
  private flotar: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, escala = 1, feliz = false, mirandoDerecha = false) {
    super(scene, x, y);
    this.ala = scene.add.image(10, 5, 'colibri-ala').setOrigin(10 / 140, 70 / 80).setScale(1 / RASTER);
    this.cuerpo = scene.add.image(0, 0, 'colibri-triste').setScale(1 / RASTER);
    this.add([this.cuerpo, this.ala]);
    this.setScale(mirandoDerecha ? -escala : escala, escala);
    scene.add.existing(this);
    this.ponerFeliz(feliz);
  }

  ponerFeliz(feliz: boolean): void {
    this.cuerpo.setTexture(feliz ? 'colibri-feliz' : 'colibri-triste');
    this.ala.setVisible(feliz);
    this.aleteo?.stop();
    this.flotar?.stop();
    if (feliz) {
      this.aleteo = this.scene.tweens.add({ targets: this.ala, scaleY: 0.2 / RASTER, duration: 55, yoyo: true, repeat: -1 });
      this.flotar = this.scene.tweens.add({ targets: this.cuerpo, y: -14, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.scene.tweens.add({ targets: this.ala, y: -9, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }
}

/** Mariposa monarca: aletea plegando las alas (vista de frente). */
export class Mariposa extends Phaser.GameObjects.Image {
  private aleteo: Phaser.Tweens.Tween | null = null;
  private readonly escalaBase: number;

  constructor(scene: Phaser.Scene, x: number, y: number, escala = 0.5, feliz = false) {
    super(scene, x, y, feliz ? 'mariposa-feliz' : 'mariposa-triste');
    this.escalaBase = escala / RASTER;
    this.setScale(this.escalaBase);
    scene.add.existing(this);
    this.ponerFeliz(feliz);
  }

  ponerFeliz(feliz: boolean): void {
    this.setTexture(feliz ? 'mariposa-feliz' : 'mariposa-triste');
    this.aleteo?.stop();
    this.setScale(this.escalaBase);
    this.aleteo = this.scene.tweens.add({
      targets: this,
      scaleX: this.escalaBase * (feliz ? 0.18 : 0.75),
      duration: feliz ? 200 : 900,
      yoyo: true,
      repeat: -1,
      delay: Phaser.Math.Between(0, 300),
      ease: 'Sine.easeInOut',
    });
  }
}

/** Ardilla: imagen con cara triste o feliz. */
export class Ardilla extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x: number, y: number, escala = 1, feliz = false) {
    super(scene, x, y, feliz ? 'ardilla-feliz' : 'ardilla-triste');
    this.setOrigin(0.5, 0.96).setScale(escala / RASTER);
    scene.add.existing(this);
  }

  ponerFeliz(feliz: boolean): void {
    this.setTexture(feliz ? 'ardilla-feliz' : 'ardilla-triste');
  }
}
