import type Phaser from 'phaser';
import { ANCHO, PALETA } from '../config';
import { estadoSonido } from '../servicios/estadoSonido';
import { Boton } from './Boton';

/** Botón redondo de sonido (efectos y voz). Va arriba a la derecha en todas las pantallas. */
export function agregarBotonSonido(scene: Phaser.Scene, x = ANCHO - 92, y = 88): void {
  const crear = (): Boton =>
    new Boton(scene, x, y, {
      icono: estadoSonido.estaActivo ? 'icono-sonido' : 'icono-mudo',
      ancho: 132,
      alto: 132,
      color: estadoSonido.estaActivo ? PALETA.azul : '#5B6770',
      nombre: 'sonido',
      alPresionar: () => estadoSonido.alternar(),
    }).setDepth(1000);

  let boton = crear();
  const dejarDeEscuchar = estadoSonido.escuchar(() => {
    boton.destroy();
    boton = crear();
  });
  scene.events.once('shutdown', dejarDeEscuchar);
}
