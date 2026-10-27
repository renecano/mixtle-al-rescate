import type Phaser from 'phaser';
import { ANCHO } from '../config';

const NUBES: { x: number; y: number; escala: number }[] = [
  { x: 260, y: 120, escala: 0.9 },
  { x: 900, y: 80, escala: 0.7 },
  { x: 1300, y: 200, escala: 0.6 },
];

/** Fondo del parque con nubes que cruzan el cielo despacio. */
export function agregarParque(scene: Phaser.Scene): void {
  scene.add.image(0, 0, 'parque').setOrigin(0).setDepth(-100);
  const nubes = NUBES.map((n) => scene.add.image(n.x, n.y, 'nube').setScale(n.escala).setAlpha(0.95).setDepth(-99));
  const mover = (_t: number, delta: number) => {
    for (const nube of nubes) {
      nube.x += delta * 0.012 * nube.scaleX;
      if (nube.x > ANCHO + 200) nube.x = -200;
    }
  };
  scene.events.on('update', mover);
  scene.events.once('shutdown', () => scene.events.off('update', mover));
}
