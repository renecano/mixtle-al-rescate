import { Howl } from 'howler';
import { desbloquearAudio, hayAudio, musica, rutaAudio } from './audio/motor';
import { estadoMusica, estadoSonido } from './estadoSonido';
import { RECETAS, type NombreEfecto } from './recetasSonido';

/**
 * Efectos de sonido con Howler. Los audios (public/sonidos/<nombre>.mp3) se generan a partir de
 * las recetas de recetasSonido.ts con npm run sonidos:generar. Nunca lanza: sin audio, el juego sigue.
 *
 * Cada efecto se pide la primera vez que se necesita (no los 22 de golpe al primer toque: en una red
 * lenta, eso le quitaba ancho de banda a la pantalla siguiente). Los primeros que suenan se adelantan
 * con `precargar` mientras se ve el inicio; la descarga para usar sin internet guarda el resto.
 */
class Sonido {
  private efectos = new Map<NombreEfecto, Howl>();

  /** Llamar dentro de un gesto del usuario (los navegadores lo exigen para el audio). */
  desbloquear(): void {
    desbloquearAudio();
  }

  /** Adelanta la descarga de estos efectos (por ejemplo, el toque de los botones y el remate del logo). */
  precargar(nombres: readonly NombreEfecto[]): void {
    for (const n of nombres) this.efecto(n);
  }

  tocar(nombre: NombreEfecto): void {
    if (!estadoSonido.estaActivo) return;
    try {
      // Si aún no bajaba, Howler lo toca en cuanto termine de bajar.
      this.efecto(nombre)?.play();
    } catch {
      // Un efecto que falla no interrumpe el juego.
    }
  }

  /** Gran celebración: el jingle de la música (o, con la música apagada, la fanfarria de efectos). */
  celebrar(): void {
    if (estadoMusica.estaActivo) musica.celebrar();
    else this.tocar('fanfarria');
  }

  /** Cuántos efectos se han pedido (para las pruebas). */
  get pedidos(): number {
    return this.efectos.size;
  }

  private efecto(nombre: NombreEfecto): Howl | null {
    if (!hayAudio() || !(nombre in RECETAS)) return null;
    let h = this.efectos.get(nombre);
    if (!h) {
      h = new Howl({ src: [rutaAudio(`sonidos/${nombre}.mp3`)], volume: 0.8, preload: true });
      this.efectos.set(nombre, h);
    }
    return h;
  }
}

export const sonido = new Sonido();
