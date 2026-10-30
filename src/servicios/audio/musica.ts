import { registrarAudio } from './registro';

/**
 * Música de fondo: tres pistas CC0 (tranquila, lecciones y un jingle de celebración).
 * - Volumen bajo por defecto y "ducking": baja mientras habla Mixtle y sube suave al terminar.
 * - Fundido al cambiar de pista.
 * - No suena hasta el primer toque (reglas de reproducción automática de los navegadores).
 * La lógica no depende de Howler: recibe una fábrica de reproductores (así se prueba sin bocinas).
 */
export const VOLUMEN_MUSICA = {
  base: 0.25,
  agachada: 0.08,
  jingle: 0.5,
  fundidoMs: 900,
  agacharMs: 250,
  subirMs: 700,
} as const;

export type PistaFondo = 'tranquila' | 'lecciones';
export type NombrePista = PistaFondo | 'celebracion';

/** Lo que la música necesita de un reproductor (Howler lo cumple). */
export interface Reproductor {
  play(): void;
  stop(): void;
  fade(desde: number, hasta: number, ms: number): void;
  volume(): number;
  fijarVolumen(volumen: number): void;
  playing(): boolean;
  alTerminar(cb: () => void): void;
  /** ¿De verdad se oye? (el tiempo de reproducción avanza; que play() resolviera no basta) */
  avanza?(): boolean;
  /** Pausada o atorada sin que el juego lo pidiera (el navegador, un tropiezo del streaming…). */
  detenidaSinQuerer?(): boolean;
  /** Vuelve a pedir que suene (recarga la fuente si quedó en error). */
  reanudar?(): void;
}

/** Cada cuánto la música se revisa a sí misma por si algo la detuvo sin que nadie lo pidiera. */
export const VIGILANCIA_MS = 5000;

export type FabricaReproductor = (pista: NombrePista, enBucle: boolean) => Reproductor;

export class Musica {
  private reproductores = new Map<NombrePista, Reproductor>();
  private suena: PistaFondo | null = null;
  private deseada: PistaFondo | null = null;
  private agachadores = 0;
  private desbloqueada = false;
  /** Cuándo empezó a sonar de verdad la pista de fondo (null si aún no suena). */
  private arrancoEn: number | null = null;

  constructor(
    private readonly crear: FabricaReproductor,
    private readonly activa: () => boolean,
  ) {}

  /** Volumen al que debe estar la pista de fondo ahora mismo. */
  get volumenObjetivo(): number {
    return this.agachadores > 0 ? VOLUMEN_MUSICA.agachada : VOLUMEN_MUSICA.base;
  }

  get pistaActual(): PistaFondo | null {
    return this.suena;
  }

  /**
   * Cuánto hace (ms) que la música empezó a sonar, o null si aún no suena. Con la música activada pero
   * bloqueada por el navegador, el toque en su botón es el que la arranca (el desbloqueo va en el
   * pointerdown): si "empezó hace nada", ese toque quería encenderla, no apagarla.
   */
  empezoHace(ahora: number): number | null {
    return this.arrancoEn === null || !this.sonandoAhora ? null : ahora - this.arrancoEn;
  }

  /** ¿La pista de fondo se está oyendo ahora mismo? (play() pedido y no en pausa) */
  get sonandoAhora(): boolean {
    return this.desbloqueada && !!this.suena && !!this.reproductores.get(this.suena)?.playing();
  }

  /** ¿De verdad se oye? El tiempo de reproducción avanza (si el reproductor sabe decirlo). */
  get seOye(): boolean {
    if (!this.sonandoAhora) return false;
    const r = this.reproductores.get(this.suena!)!;
    return r.avanza ? r.avanza() : true;
  }

  /**
   * Llamar en cada toque. Si la pista debería sonar y no suena (el navegador rechazó el primer
   * intento por falta de un toque, o algo la detuvo después), se vuelve a pedir dentro de este toque.
   */
  asegurar(): void {
    if (!this.desbloqueada || !this.activa() || !this.suena) return;
    const r = this.reproductores.get(this.suena);
    if (!r) return;
    // Si está en pausa (el navegador rechazó play()), o "sonando" sin que el tiempo avance desde hace
    // un rato (play() resolvió pero no se oye), se vuelve a pedir dentro de este toque. Recién pedida
    // (el tiempo aún no empieza a correr) no cuenta: volver a pedirla abortaría la petición en curso.
    if (r.playing() && !r.detenidaSinQuerer?.()) return;
    registrarAudio('música: asegurar (toque)', { pista: this.suena, playing: r.playing() });
    if (r.playing() && r.reanudar) r.reanudar();
    else r.play();
    r.fade(0, this.volumenObjetivo, VOLUMEN_MUSICA.fundidoMs);
    this.arrancoEn = Date.now();
  }

  /**
   * Vigilancia: si la música está activada y algo la detuvo sin que nadie lo pidiera (el navegador
   * la pausó, el streaming se atoró), se vuelve a pedir. Si el navegador lo rechaza por falta de un
   * toque, el siguiente toque lo resuelve (`asegurar`).
   */
  vigilar(): void {
    if (this.vigilancia) return;
    this.vigilancia = setInterval(() => {
      if (!this.activa() || !this.suena) return;
      const r = this.reproductores.get(this.suena);
      if (!r?.detenidaSinQuerer?.()) return;
      registrarAudio('música: detenida sin querer, se reanuda', { pista: this.suena, playing: r.playing() });
      if (r.reanudar) r.reanudar();
      else r.play();
      r.fade(r.volume(), this.volumenObjetivo, VOLUMEN_MUSICA.subirMs);
    }, VIGILANCIA_MS);
  }
  private vigilancia: ReturnType<typeof setInterval> | null = null;

  /** Llamar tras el primer toque del usuario. */
  desbloquear(): void {
    if (this.desbloqueada) return;
    this.desbloqueada = true;
    registrarAudio('música: desbloqueada', { pedida: this.deseada });
    this.aplicar();
    this.vigilar();
  }

  /** Pide una pista de fondo; suena en cuanto se pueda (desbloqueo y música encendida). */
  poner(pista: PistaFondo): void {
    this.deseada = pista;
    this.aplicar();
  }

  /** La música se encendió o se apagó con su botón. */
  cambioDeInterruptor(): void {
    if (!this.activa()) this.silenciarTodo();
    else this.aplicar();
  }

  /** Mixtle empieza a hablar: la música baja. Se puede anidar. */
  agachar(): void {
    this.agachadores += 1;
    if (this.agachadores === 1) {
      registrarAudio('música: agachar (habla Mixtle)');
      this.irA(VOLUMEN_MUSICA.agachada, VOLUMEN_MUSICA.agacharMs);
    }
  }

  /** Mixtle terminó de hablar: la música sube suave. */
  levantar(): void {
    if (this.agachadores === 0) return;
    this.agachadores -= 1;
    if (this.agachadores === 0) {
      registrarAudio('música: levantar (terminó de hablar)');
      this.irA(VOLUMEN_MUSICA.base, VOLUMEN_MUSICA.subirMs);
    }
  }

  /** Jingle de celebración, una vez, con la música de fondo agachada mientras suena. */
  celebrar(): void {
    if (!this.desbloqueada || !this.activa()) return;
    const jingle = this.reproductor('celebracion', false);
    jingle.stop();
    this.agachar();
    let listo = false;
    jingle.alTerminar(() => {
      if (listo) return;
      listo = true;
      this.levantar();
    });
    jingle.fijarVolumen(VOLUMEN_MUSICA.jingle);
    jingle.play();
  }

  private reproductor(pista: NombrePista, enBucle: boolean): Reproductor {
    let r = this.reproductores.get(pista);
    if (!r) {
      r = this.crear(pista, enBucle);
      this.reproductores.set(pista, r);
    }
    return r;
  }

  private aplicar(): void {
    if (!this.desbloqueada || !this.activa() || this.deseada === this.suena) return;
    const anterior = this.suena ? this.reproductor(this.suena, true) : null;
    if (anterior) {
      anterior.fade(anterior.volume(), 0, VOLUMEN_MUSICA.fundidoMs);
      const detener = anterior;
      setTimeout(() => {
        if (detener !== (this.suena ? this.reproductores.get(this.suena) : null)) detener.stop();
      }, VOLUMEN_MUSICA.fundidoMs + 50);
    }
    this.suena = this.deseada;
    registrarAudio('música: cambio de pista', { de: anterior ? 'otra' : null, a: this.suena });
    if (!this.suena) return;
    const nueva = this.reproductor(this.suena, true);
    if (!nueva.playing()) nueva.play();
    if (this.arrancoEn === null) this.arrancoEn = Date.now();
    nueva.fade(0, this.volumenObjetivo, VOLUMEN_MUSICA.fundidoMs);
  }

  private irA(volumen: number, ms: number): void {
    if (!this.suena || !this.activa()) return;
    const r = this.reproductor(this.suena, true);
    r.fade(r.volume(), volumen, ms);
  }

  private silenciarTodo(): void {
    registrarAudio('música: apagada con su botón');
    for (const r of this.reproductores.values()) r.stop();
    this.suena = null;
    this.arrancoEn = null;
  }
}
