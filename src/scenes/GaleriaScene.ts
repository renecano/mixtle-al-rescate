import Phaser from 'phaser';
import { ALTO, ANCHO, PALETA } from '../config';
import { catalogoArte } from '../arte/catalogo';
import { estiloTexto } from '../ui/texto';

/**
 * Hoja de revisión de todo el arte (para el equipo, no para las niñas y los niños).
 * Se abre con `?galeria` en la dirección del juego.
 */
export class GaleriaScene extends Phaser.Scene {
  constructor() {
    super('Galeria');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(PALETA.crema);
    const piezas = catalogoArte().filter((a) => a.clave !== 'parque');
    const columnas = 9;
    const celda = { w: ANCHO / columnas, h: 200 };
    const alto = Math.ceil(piezas.length / columnas) * celda.h;
    piezas.forEach((a, i) => {
      const cx = (i % columnas) * celda.w + celda.w / 2;
      const cy = Math.floor(i / columnas) * celda.h + 90;
      const img = this.add.image(cx, cy, a.clave);
      const factor = Math.min(150 / img.width, 140 / img.height, 1);
      img.setScale(factor);
      if (a.clave.startsWith('icono-')) img.setTint(0x2459a6);
      this.add.text(cx, cy + 82, a.clave, estiloTexto(18, PALETA.tinta)).setOrigin(0.5);
    });
    this.cameras.main.setBounds(0, 0, ANCHO, Math.max(alto, ALTO));
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      this.cameras.main.scrollY += dy;
    });
  }
}
