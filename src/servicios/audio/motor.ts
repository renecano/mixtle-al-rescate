import { Howler } from 'howler';
import { estadoMusica } from '../estadoSonido';
import { Musica, type Reproductor } from './musica';
import { reanudarContexto, vigilarContexto } from './reanudar';
import { registrarAudio } from './registro';

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
function reproductorEnStreaming(src: string, enBucle: boolean, nombre: string): Reproductor {
  const audio = new Audio();
  audio.preload = 'none';
  audio.loop = enBucle;
  audio.src = src;
  const log = (evento: string, datos?: Record<string, unknown>) => registrarAudio(`música ${nombre}: ${evento}`, { t: Number(audio.currentTime.toFixed(2)), ...datos });
  // Para saber si de verdad se oye: cuándo avanzó por última vez el tiempo de reproducción.
  let ultimoTiempo = 0;
  let ultimoAvanceEn = 0;
  let ultimoPlayEn = 0;
  let pausadaPorNosotros = true;
  let muestras = 0;
  for (const ev of ['playing', 'pause', 'ended', 'stalled', 'waiting', 'suspend', 'abort', 'error', 'emptied'] as const) {
    audio.addEventListener(ev, () => log(ev, { paused: audio.paused, ready: audio.readyState, red: audio.networkState, ...(ev === 'pause' ? { nosotros: pausadaPorNosotros } : {}), ...(audio.error ? { error: audio.error.code } : {}) }));
  }
  audio.addEventListener('timeupdate', () => {
    if (audio.currentTime !== ultimoTiempo) ultimoAvanceEn = Date.now();
    if (audio.currentTime < ultimoTiempo - 1) log('vuelve a empezar (bucle)');
    ultimoTiempo = audio.currentTime;
    // Una muestra cada ~5 s (timeupdate llega unas 4 veces por segundo).
    if (++muestras % 20 === 0) log('avanza', { ready: audio.readyState });
  });
  let ganancia: GainNode | null = null;
  try {
    const ctx = contextoMusica();
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
  const tocar = () => {
    pausadaPorNosotros = false;
    ultimoPlayEn = Date.now();
    log('play()', { ready: audio.readyState, contexto: ganancia?.context.state });
    audio.play().then(
      () => log('play() aceptado'),
      (e: unknown) => log('play() RECHAZADO', { error: (e as Error)?.name }),
    );
  };
  return {
    play: tocar,
    stop: () => {
      pausadaPorNosotros = true;
      log('stop() (nosotros)');
      audio.pause();
      audio.currentTime = 0;
    },
    // ¿De verdad se oye? Que play() haya resuelto no basta: el tiempo de reproducción debe avanzar.
    avanza: () => !audio.paused && Date.now() - ultimoAvanceEn < 1500,
    // Pausada o atorada sin que el juego lo pidiera (y ya pasó un momento desde el último play()).
    detenidaSinQuerer: () => {
      if (pausadaPorNosotros || !ultimoPlayEn || Date.now() - ultimoPlayEn < 4000) return false;
      return audio.paused || Date.now() - ultimoAvanceEn > 3000;
    },
    reanudar: () => {
      log('reanudar', { paused: audio.paused, ready: audio.readyState, red: audio.networkState, error: audio.error?.code ?? null });
      // Solo si la fuente quedó en error se vuelve a cargar (load() aborta cualquier play() en curso).
      if (audio.error) audio.load();
      tocar();
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

let ctxMusica: AudioContext | null = null;

/**
 * El contexto de audio de la música, propio y aparte del de Howler. Al crear el primer Howl, si la
 * tarjeta de sonido no va a 44.1 kHz (las laptops con Windows suelen ir a 48 kHz), Howler cierra su
 * AudioContext y crea otro (`_unlockAudio` → `unload`). La música iba enganchada al contexto de Howler
 * como <audio> + MediaElementSource: si ya se había creado (Chrome con autoplay permitido), quedaba
 * muda para siempre en un contexto cerrado, con play() "aceptado" y el tiempo en 0. Lo reportó René;
 * se vio en Chrome real con ?depurar-audio. Además Howler suspende su contexto a los 30 s sin Howls,
 * y la música se callaba con él. Con contexto propio, nada de eso la toca.
 */
function contextoMusica(): AudioContext | null {
  if (ctxMusica) return ctxMusica;
  try {
    const Contexto = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Contexto) return null;
    const ctx = new Contexto();
    ctxMusica = ctx;
    registrarAudio('contexto de música creado', { estado: ctx.state, hz: ctx.sampleRate });
    ctx.addEventListener('statechange', () => registrarAudio('contexto de música', { estado: ctx.state }));
    return ctx;
  } catch {
    return null;
  }
}

export const musica = new Musica(
  (pista, enBucle) => reproductorEnStreaming(rutaAudio(`musica/${pista}.mp3`), enBucle, pista),
  () => estadoMusica.estaActivo,
);
estadoMusica.escuchar(() => musica.cambioDeInterruptor());

/** ¿El audio ya está desbloqueado (hubo un toque)? Antes de eso los navegadores no dejan sonar nada. */
export function audioListo(): boolean {
  if (!hayAudio()) return false;
  try {
    return contextoMusica()?.state === 'running';
  } catch {
    return false;
  }
}

/** Llamar en cada toque: desbloquea el audio (o lo reanuda si el navegador lo pausó) y deja empezar la música. */
export function desbloquearAudio(): void {
  if (!hayAudio()) return;
  try {
    registrarAudio('toque: desbloquear audio', { musica: contextoMusica()?.state, howler: (Howler.ctx as AudioContext | undefined)?.state });
    // Los dos contextos: el de la música y el de Howler (voz y efectos).
    reanudarContexto(contextoMusica() ?? undefined);
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
    const ctx = contextoMusica();
    if (ctx) vigilarContexto(ctx, () => musica.desbloquear());
    // El de Howler solo se anota (lo cierra y recrea él mismo al primer Howl si la tarjeta no va a 44.1 kHz).
    if (!Howler.ctx) Howler.volume();
    const deHowler = Howler.ctx as AudioContext | undefined;
    if (deHowler) {
      registrarAudio('contexto de Howler creado', { estado: deHowler.state, hz: deHowler.sampleRate });
      deHowler.addEventListener('statechange', () => registrarAudio('contexto de Howler', { estado: deHowler.state }));
    }
  } catch {
    // Sin audio el juego sigue igual.
  }
}
