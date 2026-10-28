import Phaser from 'phaser';
import { ALTO, ANCHO, PALETA } from '../config';
import { Boton } from './Boton';

/** Si el sistema pide reducir el movimiento, las celebraciones son más discretas. */
export function menosMovimiento(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Estallido de brillitos alrededor de un punto. */
export function chispas(scene: Phaser.Scene, x: number, y: number, cantidad = 10, radio = 140): void {
  if (menosMovimiento()) cantidad = Math.ceil(cantidad / 3);
  for (let i = 0; i < cantidad; i++) {
    const ang = (i / cantidad) * Math.PI * 2 + Math.random() * 0.4;
    const b = scene.add.image(x, y, 'brillo').setScale(0.3).setDepth(900).setAngle(Math.random() * 90);
    scene.tweens.add({
      targets: b,
      x: x + Math.cos(ang) * radio * (0.7 + Math.random() * 0.5),
      y: y + Math.sin(ang) * radio * (0.7 + Math.random() * 0.5),
      scale: { from: 0.3, to: 0.9 },
      angle: '+=120',
      alpha: { from: 1, to: 0 },
      duration: 700 + Math.random() * 300,
      ease: 'Cubic.easeOut',
      onComplete: () => b.destroy(),
    });
  }
}

const COLORES_CONFETI = [0x1f6b4a, 0x2459a6, 0xb84a14, 0x6345a8, 0xffd23f, 0xf0567a];

/** Lluvia de confeti para las grandes celebraciones. */
export function confeti(scene: Phaser.Scene, cantidad = 80): void {
  if (menosMovimiento()) cantidad = Math.ceil(cantidad / 4);
  for (let i = 0; i < cantidad; i++) {
    const color = COLORES_CONFETI[i % COLORES_CONFETI.length]!;
    const x = Math.random() * ANCHO;
    const pieza = scene.add
      .rectangle(x, -40 - Math.random() * 300, 18, 28, color)
      .setDepth(400) // debajo del globo de Mixtle (500) para no tapar el texto
      .setAngle(Math.random() * 180);
    scene.tweens.add({
      targets: pieza,
      y: ALTO + 60,
      x: x + (Math.random() - 0.5) * 300,
      angle: pieza.angle + 360 + Math.random() * 360,
      scaleX: { from: 1, to: 0.2 },
      duration: 2200 + Math.random() * 1600,
      ease: 'Sine.easeIn',
      onComplete: () => pieza.destroy(),
    });
  }
}

/** Botón grande de "seguir" abajo a la derecha, que late para invitar a tocarlo. */
export function botonSiguiente(
  scene: Phaser.Scene,
  alPresionar: () => void,
  texto = '¡Sigamos!',
  posicion = { x: ANCHO - 260, y: ALTO - 110 },
): Boton {
  const boton = new Boton(scene, posicion.x, posicion.y, {
    texto,
    icono: 'icono-siguiente',
    ancho: 440,
    alto: 140,
    tamanoTexto: 56,
    color: PALETA.naranja,
    nombre: 'siguiente',
    alPresionar,
  }).setDepth(800);
  boton.setScale(0);
  scene.tweens.add({ targets: boton, scale: 1, duration: 400, ease: 'Back.easeOut', onComplete: () => boton.latir() });
  return boton;
}
