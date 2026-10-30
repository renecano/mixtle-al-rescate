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
}

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

  /** ¿La pista de fondo se está oyendo ahora mismo? */
  get sonandoAhora(): boolean {
    return this.desbloqueada && !!this.suena && !!this.reproductores.get(this.suena)?.playing();
  }

  /**
   * Llamar en cada toque. Si la pista debería sonar y no suena (el navegador rechazó el primer
   * intento por falta de un toque), se vuelve a pedir dentro de este toque.
   */
  asegurar(): void {
    if (!this.desbloqueada || !this.activa() || !this.suena) return;
    const r = this.reproductores.get(this.suena);
    if (!r || r.playing()) return;
    r.play();
    r.fade(0, this.volumenObjetivo, VOLUMEN_MUSICA.fundidoMs);
    this.arrancoEn = Date.now();
  }

  /** Llamar tras el primer toque del usuario. */
  desbloquear(): void {
    if (this.desbloqueada) return;
    this.desbloqueada = true;
    this.aplicar();
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
    if (this.agachadores === 1) this.irA(VOLUMEN_MUSICA.agachada, VOLUMEN_MUSICA.agacharMs);
  }

  /** Mixtle terminó de hablar: la música sube suave. */
  levantar(): void {
    if (this.agachadores === 0) return;
    this.agachadores -= 1;
    if (this.agachadores === 0) this.irA(VOLUMEN_MUSICA.base, VOLUMEN_MUSICA.subirMs);
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
    for (const r of this.reproductores.values()) r.stop();
    this.suena = null;
    this.arrancoEn = null;
  }
}
