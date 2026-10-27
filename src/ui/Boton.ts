import Phaser from 'phaser';
import { PALETA, TOQUE_MINIMO, hex } from '../config';
import { sonido } from '../servicios/sonido';
import { estiloTexto } from './texto';

export interface OpcionesBoton {
  texto?: string;
  icono?: string;
  ancho?: number;
  alto?: number;
  color?: string;
  tamanoTexto?: number;
  /** Nombre para las pruebas automáticas; no se muestra. */
  nombre?: string;
  alPresionar: () => void;
}

/** Botón grande, redondeado, con sombra y animación al tocarlo. Funciona con toque y con mouse. */
export class Boton extends Phaser.GameObjects.Container {
  private presionado = false;
  private habilitado = true;
  private latido: Phaser.Tweens.Tween | null = null;
  readonly ancho: number;
  readonly alto: number;

  constructor(scene: Phaser.Scene, x: number, y: number, op: OpcionesBoton) {
    super(scene, x, y);
    this.ancho = Math.max(op.ancho ?? 360, TOQUE_MINIMO);
    this.alto = Math.max(op.alto ?? 120, TOQUE_MINIMO);
    const color = Phaser.Display.Color.ValueToColor(hex(op.color ?? PALETA.naranja));
    const radio = Math.min(this.alto / 2, 48);

    const fondo = scene.add.graphics();
    fondo.fillStyle(color.clone().darken(25).color, 1);
    fondo.fillRoundedRect(-this.ancho / 2, -this.alto / 2 + 10, this.ancho, this.alto, radio);
    fondo.fillStyle(color.color, 1);
    fondo.fillRoundedRect(-this.ancho / 2, -this.alto / 2, this.ancho, this.alto, radio);
    fondo.lineStyle(6, 0xffffff, 0.9);
    fondo.strokeRoundedRect(-this.ancho / 2 + 6, -this.alto / 2 + 6, this.ancho - 12, this.alto - 12, radio - 6);
    this.add(fondo);

    const tamIcono = Math.min(this.alto * 0.62, 96);
    const icono = op.icono ? scene.add.image(0, 0, op.icono).setDisplaySize(tamIcono, tamIcono) : null;
    let texto: Phaser.GameObjects.Text | null = null;
    if (op.texto) {
      texto = scene.add.text(
        0,
        -2,
        op.texto,
        estiloTexto(op.tamanoTexto ?? 56, PALETA.blanco, { stroke: color.clone().darken(30).rgba, strokeThickness: 6 }),
      );
      texto.setOrigin(0.5);
      // Si el texto no cabe, se reduce para no salirse del botón.
      const disponible = this.ancho - 60 - (icono ? tamIcono + 20 : 0);
      if (texto.width > disponible) texto.setScale(disponible / texto.width);
    }
    // Ícono y texto se centran juntos, como un solo grupo.
    const separacion = 20;
    const anchoTexto = texto ? texto.displayWidth : 0;
    const total = (icono ? tamIcono : 0) + (icono && texto ? separacion : 0) + anchoTexto;
    if (icono) {
      icono.setX(-total / 2 + tamIcono / 2);
      this.add(icono);
    }
    if (texto) {
      texto.setX(total / 2 - anchoTexto / 2);
      this.add(texto);
    }

    this.setSize(this.ancho, this.alto + 10);
    this.setInteractive({ useHandCursor: true });
    this.setName(op.nombre ?? op.texto ?? op.icono ?? 'boton');

    this.on('pointerover', () => {
      if (this.habilitado && !this.presionado) this.escalar(1.05);
    });
    this.on('pointerout', () => {
      this.presionado = false;
      this.escalar(1);
    });
    this.on('pointerdown', () => {
      if (!this.habilitado) return;
      this.presionado = true;
      sonido.desbloquear();
      this.escalar(0.94);
    });
    this.on('pointerup', () => {
      if (!this.habilitado || !this.presionado) return;
      this.presionado = false;
      this.escalar(1);
      sonido.tocar('toque');
      op.alPresionar();
    });

    scene.add.existing(this);
  }

  habilitar(si: boolean): this {
    this.habilitado = si;
    this.setAlpha(si ? 1 : 0.5);
    return this;
  }

  /** Rebote suave para invitar a tocar. */
  latir(): this {
    this.latido?.stop();
    this.latido = this.scene.tweens.add({
      targets: this,
      scale: 1.06,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    return this;
  }

  private escalar(valor: number): void {
    this.latido?.stop();
    this.latido = null;
    this.scene.tweens.add({ targets: this, scale: valor, duration: 110, ease: 'Quad.easeOut' });
  }
}
