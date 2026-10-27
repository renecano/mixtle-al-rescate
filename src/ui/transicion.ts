import type Phaser from 'phaser';

const DURACION = 350;

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
  scene.cameras.main.fadeIn(DURACION, 18, 61, 43);
}
