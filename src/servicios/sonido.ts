import { Howl } from 'howler';
import { desbloquearAudio, hayAudio, musica, rutaAudio } from './audio/motor';
import { estadoMusica, estadoSonido } from './estadoSonido';
import { RECETAS, type NombreEfecto } from './recetasSonido';

/**
 * Efectos de sonido con Howler. Los audios (public/sonidos/<nombre>.mp3) se generan a partir de
 * las recetas de recetasSonido.ts con npm run sonidos:generar. Nunca lanza: sin audio, el juego sigue.
 */
class Sonido {
  private efectos: Map<NombreEfecto, Howl> | null = null;

  /** Llamar dentro de un gesto del usuario (los navegadores lo exigen para el audio). */
  desbloquear(): void {
    desbloquearAudio();
    this.cargar();
  }

  tocar(nombre: NombreEfecto): void {
    if (!estadoSonido.estaActivo) return;
    try {
      this.cargar()?.get(nombre)?.play();
    } catch {
      // Un efecto que falla no interrumpe el juego.
    }
  }

  /** Gran celebración: el jingle de la música (o, con la música apagada, la fanfarria de efectos). */
  celebrar(): void {
    if (estadoMusica.estaActivo) musica.celebrar();
    else this.tocar('fanfarria');
  }

  private cargar(): Map<NombreEfecto, Howl> | null {
    if (this.efectos || !hayAudio()) return this.efectos;
    this.efectos = new Map(
      (Object.keys(RECETAS) as NombreEfecto[]).map((n) => [n, new Howl({ src: [rutaAudio(`sonidos/${n}.mp3`)], volume: 0.8, preload: true })]),
    );
    return this.efectos;
  }
}

export const sonido = new Sonido();
