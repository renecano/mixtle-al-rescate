import { Howl, Howler } from 'howler';
import { estadoMusica } from '../estadoSonido';
import { Musica, type Reproductor } from './musica';
import { reanudarContexto, vigilarContexto } from './reanudar';

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

/** ¿El audio ya está desbloqueado (hubo un toque)? Antes de eso los navegadores no dejan sonar nada. */
export function audioListo(): boolean {
  if (!hayAudio()) return false;
  try {
    return (Howler.ctx as AudioContext | undefined)?.state === 'running';
  } catch {
    return false;
  }
}

/** Llamar en cada toque: desbloquea el audio (o lo reanuda si el navegador lo pausó) y deja empezar la música. */
export function desbloquearAudio(): void {
  if (!hayAudio()) return;
  try {
    reanudarContexto(Howler.ctx as AudioContext | undefined);
  } catch {
    // Sin audio el juego sigue igual.
  }
  musica.desbloquear();
}

/**
 * Al cargar: crea el contexto de audio para saber si el navegador ya deja sonar (visita de regreso:
 * la música empieza sola) y para reanudarlo cuando se vuelve a la página. Ver reanudar.ts.
 */
export function vigilarAudio(): void {
  if (!hayAudio()) return;
  try {
    if (!Howler.ctx) Howler.volume();
    const ctx = Howler.ctx as AudioContext | undefined;
    if (ctx) vigilarContexto(ctx, () => musica.desbloquear());
  } catch {
    // Sin audio el juego sigue igual.
  }
}
