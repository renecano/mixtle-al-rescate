import type Phaser from 'phaser';

const DURACION = 350;
/**
 * Tiempo que tardan las animaciones de entrada de una pantalla (fundido + título que cae).
 * Al terminar, la escena marca `entradaLista`; las capturas lo esperan para no salir a medias.
 */
export const ENTRADA_MS = 1300;

/** Cambia de escena con un fundido suave. */
export function irA(scene: Phaser.Scene, clave: string, datos?: object): void {
  if (scene.registry.get('transicionando')) return;
  scene.registry.set('transicionando', true);
  scene.input.enabled = false;
  scene.cameras.main.fadeOut(DURACION, 18, 61, 43);
  scene.cameras.main.once('camerafadeoutcomplete', () => {
    scene.registry.set('transicionando', false);
    scene.scene.start(clave, datos);
  });
}

/** Fundido de entrada; llamar al inicio de `create()`. */
export function entrar(scene: Phaser.Scene): void {
  scene.input.enabled = true;
  scene.data.set('entradaLista', false);
  scene.cameras.main.fadeIn(DURACION, 18, 61, 43);
  scene.time.delayedCall(ENTRADA_MS, () => scene.data.set('entradaLista', true));
}

/** ¿Ya terminaron las animaciones de entrada de esta escena? */
export function entradaTerminada(scene: Phaser.Scene): boolean {
  return scene.data.get('entradaLista') !== false && !scene.cameras.main.fadeEffect.isRunning;
}
