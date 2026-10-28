import { Howl } from 'howler';
import { piezasDeTexto, type Locucion } from '../voz/locucion';
import { PAUSA_ENTRE_PIEZAS_MS, planDeLocucion, type Manifiesto } from '../voz/plan';
import { hayAudio, musica, rutaAudio } from './audio/motor';
import { elegirVoz, estimarDuracion } from './eleccionVoz';
import { estadoSonido } from './estadoSonido';

const VELOCIDAD_NAVEGADOR = 0.9;
const TONO_NAVEGADOR = 1.1;
/** Cuántos audios de frases se guardan decodificados en memoria (laptop de 8 GB, tablets). */
const MAXIMO_EN_MEMORIA = 40;

/**
 * La voz de Caco.
 * 1. Audios pregenerados (public/voz/<hash>.mp3, ver npm run voz:generar) o grabaciones humanas
 *    con los mismos nombres. Las frases con números se arman encadenando piezas.
 * 2. Si a una frase le falta su audio, se usa la voz del navegador (Web Speech API) y en
 *    desarrollo se avisa en la consola.
 * Mientras Caco habla, la música baja. Nada de esto rompe el juego si no hay audio.
 */
class Voz {
  private manifiesto: Manifiesto | null = null;
  private vozNavegador: SpeechSynthesisVoice | null = null;
  private ultimo: Locucion = '';
  private turno = 0;
  private agachada = false;
  private sonando: Howl | null = null;
  private cache = new Map<string, Howl>();
  /** Cuántas frases se dijeron con audio grabado y cuántas con la voz del navegador (para las pruebas). */
  readonly cuenta = { conAudio: 0, conNavegador: 0 };

  constructor() {
    const s = this.sintesis();
    if (s) {
      this.cargarVocesNavegador();
      s.addEventListener?.('voiceschanged', () => this.cargarVocesNavegador());
    }
    estadoSonido.escuchar((activo) => {
      if (!activo) this.callar();
    });
  }

  /** Carga public/voz/manifiesto.json. Sin manifiesto, todo se dice con la voz del navegador. */
  async cargarManifiesto(): Promise<void> {
    try {
      // Siempre la lista más nueva (sin la caché HTTP); sin internet, el service worker da la guardada.
      const r = await fetch(rutaAudio('voz/manifiesto.json'), { cache: 'no-cache' });
      if (r.ok) this.manifiesto = (await r.json()) as Manifiesto;
    } catch {
      this.manifiesto = null;
    }
  }

  /** Para pruebas: usar un manifiesto dado. */
  usarManifiesto(m: Manifiesto | null): void {
    this.manifiesto = m;
  }

  /** Algunos navegadores (Safari en iPad) solo permiten hablar si la primera vez ocurre dentro de un toque. */
  desbloquear(): void {
    const s = this.sintesis();
    if (!s) return;
    try {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      s.speak(u);
    } catch {
      // Sin voz no se rompe nada.
    }
  }

  /**
   * Caco dice algo. Devuelve la duración (real si hay audio, estimada si no), útil para animar a Caco.
   * `alTerminar` se llama al acabar; si otra frase interrumpe a esta, ya no se llama.
   */
  decir(locucion: Locucion, alTerminar?: () => void): number {
    this.ultimo = locucion;
    const plan = planDeLocucion(locucion, this.manifiesto);
    const hablado = piezasDeTexto(locucion).join(' ');
    const conAudio = !!plan.archivos && hayAudio();
    const ms = conAudio ? plan.ms : estimarDuracion(hablado, VELOCIDAD_NAVEGADOR);

    this.callar();
    const miTurno = ++this.turno;
    let terminado = false;
    const terminar = () => {
      if (terminado || miTurno !== this.turno) return;
      terminado = true;
      this.soltarMusica();
      alTerminar?.();
    };
    // Respaldo: nunca dejamos el juego esperando a una voz que no llega.
    window.setTimeout(terminar, ms + 1500);

    if (!estadoSonido.estaActivo) {
      window.setTimeout(terminar, ms);
      return ms;
    }
    musica.agachar();
    this.agachada = true;

    if (conAudio) {
      this.cuenta.conAudio += 1;
      this.reproducirCadena(plan.archivos!, miTurno, terminar);
    } else {
      this.cuenta.conNavegador += 1;
      if (import.meta.env.DEV && plan.faltantes.length) {
        console.warn('[voz] Sin audio, se usa la voz del navegador para:', plan.faltantes, '→ npm run voz:generar');
      }
      this.hablarConNavegador(hablado, terminar);
    }
    return ms;
  }

  repetir(alTerminar?: () => void): number {
    return this.ultimo ? this.decir(this.ultimo, alTerminar) : 0;
  }

  callar(): void {
    this.turno += 1;
    try {
      this.sonando?.stop();
      this.sintesis()?.cancel();
    } catch {
      // Ignorar.
    }
    this.sonando = null;
    this.soltarMusica();
  }

  private soltarMusica(): void {
    if (!this.agachada) return;
    this.agachada = false;
    musica.levantar();
  }

  private howl(archivo: string): Howl {
    let h = this.cache.get(archivo);
    if (h) {
      // Lo más reciente va al final (para descartar primero lo menos usado).
      this.cache.delete(archivo);
      this.cache.set(archivo, h);
      return h;
    }
    h = new Howl({ src: [rutaAudio(`voz/${archivo}`)], preload: true });
    this.cache.set(archivo, h);
    if (this.cache.size > MAXIMO_EN_MEMORIA) {
      const [masViejo, howl] = this.cache.entries().next().value as [string, Howl];
      if (howl !== this.sonando) howl.unload();
      this.cache.delete(masViejo);
    }
    return h;
  }

  private reproducirCadena(archivos: string[], turno: number, terminar: () => void): void {
    // Todas las piezas se cargan ANTES de empezar a hablar: así no hay tropiezos entre una y otra
    // esperando a que baje el siguiente audio (con un tope de 2 s para no quedarse callado).
    const howls = archivos.map((a) => this.howl(a));
    let listo = false;
    const empezar = () => {
      if (listo) return;
      listo = true;
      siguiente(0);
    };
    const revisar = () => {
      if (howls.every((h) => h.state() !== 'loading')) empezar();
    };
    for (const h of howls) {
      if (h.state() === 'loading') {
        h.once('load', revisar);
        h.once('loaderror', revisar);
      }
    }
    window.setTimeout(empezar, 2000);

    const siguiente = (i: number) => {
      if (turno !== this.turno) return;
      if (i >= archivos.length) {
        this.sonando = null;
        terminar();
        return;
      }
      const h = this.howl(archivos[i]!);
      this.sonando = h;
      h.once('end', () => window.setTimeout(() => siguiente(i + 1), PAUSA_ENTRE_PIEZAS_MS));
      // Si un audio no carga, se sigue con lo demás en vez de quedarse callado para siempre.
      h.once('loaderror', () => siguiente(i + 1));
      h.once('playerror', () => siguiente(i + 1));
      h.play();
    };
    revisar();
  }

  private hablarConNavegador(texto: string, terminar: () => void): void {
    const s = this.sintesis();
    if (!s) return;
    try {
      const u = new SpeechSynthesisUtterance(texto);
      u.lang = this.vozNavegador?.lang ?? 'es-MX';
      if (this.vozNavegador) u.voice = this.vozNavegador;
      u.rate = VELOCIDAD_NAVEGADOR;
      u.pitch = TONO_NAVEGADOR;
      u.onend = terminar;
      u.onerror = terminar;
      s.speak(u);
      // Chrome a veces deja la síntesis en pausa.
      if (s.paused) s.resume();
    } catch {
      // El temporizador de respaldo terminará la frase.
    }
  }

  private cargarVocesNavegador(): void {
    try {
      this.vozNavegador = elegirVoz(this.sintesis()?.getVoices() ?? []);
    } catch {
      this.vozNavegador = null;
    }
  }

  private sintesis(): SpeechSynthesis | null {
    try {
      return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
    } catch {
      return null;
    }
  }
}

export const voz = new Voz();
