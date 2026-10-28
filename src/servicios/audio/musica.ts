/**
 * Música de fondo: tres pistas CC0 (tranquila, lecciones y un jingle de celebración).
 * - Volumen bajo por defecto y "ducking": baja mientras habla Caco y sube suave al terminar.
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

  /** Caco empieza a hablar: la música baja. Se puede anidar. */
  agachar(): void {
    this.agachadores += 1;
    if (this.agachadores === 1) this.irA(VOLUMEN_MUSICA.agachada, VOLUMEN_MUSICA.agacharMs);
  }

  /** Caco terminó de hablar: la música sube suave. */
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
  }
}
