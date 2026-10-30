import { Howler } from 'howler';
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
 * La música en streaming: un <audio> (empieza a sonar sin descargarse completa, importante en una
 * red lenta) conectado a una ganancia de Web Audio. El volumen se cambia en la ganancia y no en el
 * <audio>, porque en iPad el volumen de <audio> no se puede cambiar, y el ducking lo necesita.
 * Si el navegador no deja conectar el <audio> a Web Audio, se usa su volumen directo.
 */
function reproductorEnStreaming(src: string, enBucle: boolean): Reproductor {
  const audio = new Audio();
  audio.preload = 'none';
  audio.loop = enBucle;
  audio.src = src;
  let ganancia: GainNode | null = null;
  try {
    if (!Howler.ctx) Howler.volume();
    const ctx = Howler.ctx as AudioContext | undefined;
    if (ctx) {
      ganancia = ctx.createGain();
      ganancia.gain.value = 0;
      ctx.createMediaElementSource(audio).connect(ganancia);
      ganancia.connect(ctx.destination);
    }
  } catch {
    ganancia = null;
  }
  const fijar = (v: number) => {
    if (ganancia) {
      const t = ganancia.context.currentTime;
      ganancia.gain.cancelScheduledValues(t);
      ganancia.gain.setValueAtTime(v, t);
    } else audio.volume = v;
  };
  if (!ganancia) audio.volume = 0;
  let fundido = 0;
  return {
    play: () => void audio.play().catch(() => undefined),
    stop: () => {
      audio.pause();
      audio.currentTime = 0;
    },
    fade: (desde, hasta, ms) => {
      if (ganancia) {
        const t = ganancia.context.currentTime;
        ganancia.gain.cancelScheduledValues(t);
        ganancia.gain.setValueAtTime(desde, t);
        ganancia.gain.linearRampToValueAtTime(hasta, t + ms / 1000);
        return;
      }
      // Sin Web Audio: el fundido a mano.
      cancelAnimationFrame(fundido);
      const inicio = performance.now();
      const paso = () => {
        const f = Math.min(1, (performance.now() - inicio) / ms);
        audio.volume = desde + (hasta - desde) * f;
        if (f < 1) fundido = requestAnimationFrame(paso);
      };
      paso();
    },
    volume: () => (ganancia ? ganancia.gain.value : audio.volume),
    fijarVolumen: fijar,
    playing: () => !audio.paused,
    alTerminar: (cb) => audio.addEventListener('ended', cb, { once: true }),
  };
}

export const musica = new Musica(
  (pista, enBucle) => reproductorEnStreaming(rutaAudio(`musica/${pista}.mp3`), enBucle),
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
  musica.asegurar();
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
