import type Phaser from 'phaser';
import { FUENTE, PALETA } from '../config';

export function estiloTexto(
  tamano: number,
  color: string = PALETA.tinta,
  extra: Phaser.Types.GameObjects.Text.TextStyle = {},
): Phaser.Types.GameObjects.Text.TextStyle {
  return { fontFamily: FUENTE, fontSize: `${tamano}px`, color, fontStyle: 'bold', align: 'center', ...extra };
}
