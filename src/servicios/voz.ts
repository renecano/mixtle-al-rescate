import { estadoSonido } from './estadoSonido';
import { elegirVoz, estimarDuracion } from './eleccionVoz';

const VELOCIDAD = 0.9;
const TONO = 1.1;

/**
 * Narración con la Web Speech API en español de México.
 * Si el navegador no tiene voz o el sonido está apagado, no pasa nada malo:
 * el texto sigue en pantalla y las funciones que esperan el final se resuelven a tiempo.
 */
class Voz {
  private voz: SpeechSynthesisVoice | null = null;
  private ultimo = '';
  private turno = 0;

  constructor() {
    const s = this.sintesis();
    if (s) {
      this.cargarVoces();
      s.addEventListener?.('voiceschanged', () => this.cargarVoces());
    }
    estadoSonido.escuchar((activo) => {
      if (!activo) this.callar();
    });
  }

  get disponible(): boolean {
    return this.sintesis() !== null;
  }

  get nombreVoz(): string {
    return this.voz ? `${this.voz.name} (${this.voz.lang})` : 'predeterminada';
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
   * Dice un texto. Devuelve la duración estimada en ms (sirve para animar a Caco).
   * `alTerminar` se llama al acabar de hablar, o tras la duración estimada si no hay voz.
   */
  decir(texto: string, alTerminar?: () => void): number {
    this.ultimo = texto;
    const duracion = estimarDuracion(texto, VELOCIDAD);
    const miTurno = ++this.turno;
    let terminado = false;
    const terminar = () => {
      // Si otra frase interrumpió a esta, su `alTerminar` ya no aplica.
      if (terminado || miTurno !== this.turno) return;
      terminado = true;
      alTerminar?.();
    };
    // Respaldo: nunca dejamos el juego esperando a una voz que no llega.
    window.setTimeout(terminar, duracion + 1500);

    const s = this.sintesis();
    if (!s || !estadoSonido.estaActivo) {
      window.setTimeout(terminar, duracion);
      return duracion;
    }
    try {
      s.cancel();
      const u = new SpeechSynthesisUtterance(texto);
      u.lang = this.voz?.lang ?? 'es-MX';
      if (this.voz) u.voice = this.voz;
      u.rate = VELOCIDAD;
      u.pitch = TONO;
      u.onend = terminar;
      u.onerror = terminar;
      s.speak(u);
      // Chrome a veces deja la síntesis en pausa.
      if (s.paused) s.resume();
    } catch {
      window.setTimeout(terminar, duracion);
    }
    return duracion;
  }

  repetir(alTerminar?: () => void): number {
    return this.ultimo ? this.decir(this.ultimo, alTerminar) : 0;
  }

  callar(): void {
    try {
      this.sintesis()?.cancel();
    } catch {
      // Ignorar.
    }
  }

  private cargarVoces(): void {
    try {
      this.voz = elegirVoz(this.sintesis()?.getVoices() ?? []);
    } catch {
      this.voz = null;
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
