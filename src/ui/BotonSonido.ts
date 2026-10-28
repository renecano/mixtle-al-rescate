import type Phaser from 'phaser';
import { ANCHO, PALETA } from '../config';
import { estadoMusica, estadoSonido, type Interruptor } from '../servicios/estadoSonido';
import { Boton } from './Boton';

interface Opciones {
  interruptor: Interruptor;
  x: number;
  y: number;
  iconos: [encendido: string, apagado: string];
  color: string;
  nombre: string;
}

/** Un botón redondo que enciende o apaga algo de audio y cambia de ícono y color al tocarlo. */
function botonInterruptor(scene: Phaser.Scene, op: Opciones): void {
  const crear = (): Boton =>
    new Boton(scene, op.x, op.y, {
      icono: op.interruptor.estaActivo ? op.iconos[0] : op.iconos[1],
      ancho: 132,
      alto: 132,
      color: op.interruptor.estaActivo ? op.color : '#5B6770',
      nombre: op.nombre,
      alPresionar: () => op.interruptor.alternar(),
    }).setDepth(1000);

  let boton = crear();
  const dejarDeEscuchar = op.interruptor.escuchar(() => {
    boton.destroy();
    boton = crear();
  });
  scene.events.once('shutdown', dejarDeEscuchar);
}

/**
 * Botones de audio arriba a la derecha en todas las pantallas de las aventuras:
 * la voz de Mixtle (con los efectos) y la música, por separado.
 */
export function agregarBotonSonido(scene: Phaser.Scene, x = ANCHO - 92, y = 88): void {
  botonInterruptor(scene, { interruptor: estadoSonido, x, y, iconos: ['icono-sonido', 'icono-mudo'], color: PALETA.azul, nombre: 'sonido' });
  botonInterruptor(scene, {
    interruptor: estadoMusica,
    x: x - 150,
    y,
    iconos: ['icono-musica', 'icono-musica-no'],
    color: PALETA.morado,
    nombre: 'musica',
  });
}
