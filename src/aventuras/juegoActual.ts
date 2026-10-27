import type Phaser from 'phaser';

/** La aventura de Phaser que está montada ahora (o null si se ven pantallas de React). */
let actual: Phaser.Game | null = null;

export function fijarJuegoActual(juego: Phaser.Game | null): void {
  actual = juego;
}

export function juegoActual(): Phaser.Game | null {
  return actual;
}
