import { Howl, Howler } from 'howler';
import { estadoMusica } from '../estadoSonido';
import { Musica, type Reproductor } from './musica';

/** Ruta de un archivo de audio de /public, respetando la base del sitio. */
export function rutaAudio(relativa: string): string {
  return `${import.meta.env.BASE_URL}${relativa}`;
}

/** ¿Hay forma de reproducir audio en este navegador? (En las pruebas no la hay.) */
export function hayAudio(): boolean {
  return typeof window !== 'undefined' && (typeof window.AudioContext !== 'undefined' || typeof window.Audio !== 'undefined');
}

/**
 * Un Howl adaptado a lo que necesita la música. Se usa Web Audio (no <audio>) porque en iPad
 * el volumen de <audio> no se puede cambiar, y el ducking lo necesita.
 */
function reproductorHowl(src: string, enBucle: boolean): Reproductor {
  const howl = new Howl({ src: [src], loop: enBucle, volume: 0, html5: false, preload: true });
  return {
    play: () => void howl.play(),
    stop: () => void howl.stop(),
    fade: (desde, hasta, ms) => void howl.fade(desde, hasta, ms),
    volume: () => howl.volume(),
    fijarVolumen: (v) => void howl.volume(v),
    playing: () => howl.playing(),
    alTerminar: (cb) => void howl.once('end', cb),
  };
}

export const musica = new Musica(
  (pista, enBucle) => reproductorHowl(rutaAudio(`musica/${pista}.mp3`), enBucle),
  () => estadoMusica.estaActivo,
);
estadoMusica.escuchar(() => musica.cambioDeInterruptor());

/** Llamar en el primer toque: desbloquea el audio (tablets) y deja empezar la música. */
export function desbloquearAudio(): void {
  if (!hayAudio()) return;
  try {
    const ctx = Howler.ctx as AudioContext | undefined;
    if (ctx && ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
  } catch {
    // Sin audio el juego sigue igual.
  }
  musica.desbloquear();
}
