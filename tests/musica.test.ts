import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Musica, VOLUMEN_MUSICA, type NombrePista, type Reproductor } from '../src/servicios/audio/musica';

/** Reproductor de mentira: registra lo que la música le pide (volumen, fundidos, play/stop). */
class ReproductorFalso implements Reproductor {
  vol = 0;
  sonando = false;
  fundidos: [number, number, number][] = [];
  private finales: (() => void)[] = [];
  play() {
    // Como un navegador que rechaza el primer play() por falta de un toque.
    if (rechazarPrimerPlay) {
      rechazarPrimerPlay = false;
      return;
    }
    this.sonando = true;
  }
  stop() {
    this.sonando = false;
  }
  fade(desde: number, hasta: number, ms: number) {
    this.fundidos.push([desde, hasta, ms]);
    this.vol = hasta;
  }
  volume() {
    return this.vol;
  }
  fijarVolumen(v: number) {
    this.vol = v;
  }
  playing() {
    return this.sonando;
  }
  alTerminar(cb: () => void) {
    this.finales.push(cb);
  }
  terminar() {
    this.sonando = false;
    this.finales.splice(0).forEach((f) => f());
  }
}

let creados: Map<NombrePista, ReproductorFalso>;
let encendida: boolean;
let musica: Musica;
let rechazarPrimerPlay = false;

beforeEach(() => {
  vi.useFakeTimers();
  rechazarPrimerPlay = false;
  creados = new Map();
  encendida = true;
  musica = new Musica(
    (pista) => {
      const r = new ReproductorFalso();
      creados.set(pista, r);
      return r;
    },
    () => encendida,
  );
});

describe('el botón de música cuando el navegador aún la bloquea', () => {
  it('sabe cuánto hace que la música empezó a sonar de verdad (null si aún no suena)', () => {
    vi.setSystemTime(10_000);
    musica.poner('tranquila');
    expect(musica.empezoHace(Date.now())).toBeNull();
    // El primer toque la desbloquea: desde ese momento cuenta.
    musica.desbloquear();
    expect(musica.empezoHace(Date.now())).toBe(0);
    vi.setSystemTime(10_300);
    expect(musica.empezoHace(Date.now())).toBe(300);
    // Un toque en el botón de música justo cuando la arrancó no debe apagarla: "recién" es menos de 1 s.
    expect(musica.empezoHace(Date.now())! < 1000).toBe(true);
    vi.setSystemTime(13_000);
    expect(musica.empezoHace(Date.now())).toBe(3000);
  });

  it('si el navegador rechazó el primer intento, el siguiente toque la vuelve a pedir y cuenta desde ahí', () => {
    vi.setSystemTime(10_000);
    musica.poner('tranquila');
    rechazarPrimerPlay = true;
    musica.desbloquear();
    const r = creados.get('tranquila')!;
    expect(r.sonando).toBe(false);
    expect(musica.sonandoAhora).toBe(false);
    expect(musica.empezoHace(Date.now())).toBeNull();
    vi.setSystemTime(15_000);
    musica.asegurar();
    expect(r.sonando).toBe(true);
    expect(musica.empezoHace(Date.now())).toBe(0);
    // Ya sonando, asegurar no la reinicia.
    musica.asegurar();
    expect(r.fundidos.filter((f) => f[0] === 0)).toHaveLength(2);
  });

  it('apagarla con su botón la deja sin "recién": al volver a encenderla cuenta de nuevo', () => {
    vi.setSystemTime(10_000);
    musica.poner('tranquila');
    musica.desbloquear();
    encendida = false;
    musica.cambioDeInterruptor();
    expect(musica.empezoHace(Date.now())).toBeNull();
    vi.setSystemTime(20_000);
    encendida = true;
    musica.cambioDeInterruptor();
    expect(musica.empezoHace(Date.now())).toBe(0);
  });
});

describe('música de fondo', () => {
  it('no suena antes del primer toque, aunque se pida', () => {
    musica.poner('tranquila');
    expect(creados.size).toBe(0);
    musica.desbloquear();
    expect(creados.get('tranquila')?.sonando).toBe(true);
  });

  it('entra con fundido hasta un volumen bajo (≈25 %)', () => {
    musica.desbloquear();
    musica.poner('tranquila');
    expect(creados.get('tranquila')!.fundidos.at(-1)).toEqual([0, VOLUMEN_MUSICA.base, VOLUMEN_MUSICA.fundidoMs]);
    expect(VOLUMEN_MUSICA.base).toBeCloseTo(0.25);
  });

  it('ducking: baja a ≈8 % mientras habla Mixtle y sube suave al terminar', () => {
    musica.desbloquear();
    musica.poner('lecciones');
    const r = creados.get('lecciones')!;
    musica.agachar();
    expect(r.fundidos.at(-1)).toEqual([VOLUMEN_MUSICA.base, VOLUMEN_MUSICA.agachada, VOLUMEN_MUSICA.agacharMs]);
    expect(VOLUMEN_MUSICA.agachada).toBeCloseTo(0.08);
    musica.levantar();
    expect(r.fundidos.at(-1)).toEqual([VOLUMEN_MUSICA.agachada, VOLUMEN_MUSICA.base, VOLUMEN_MUSICA.subirMs]);
    expect(VOLUMEN_MUSICA.subirMs).toBeGreaterThan(VOLUMEN_MUSICA.agacharMs);
  });

  it('si dos cosas la agachan, no sube hasta que terminan las dos (y levantar de más no la rompe)', () => {
    musica.desbloquear();
    musica.poner('lecciones');
    const r = creados.get('lecciones')!;
    musica.agachar();
    musica.agachar();
    musica.levantar();
    expect(r.vol).toBe(VOLUMEN_MUSICA.agachada);
    musica.levantar();
    expect(r.vol).toBe(VOLUMEN_MUSICA.base);
    musica.levantar();
    expect(r.vol).toBe(VOLUMEN_MUSICA.base);
  });

  it('una pista que entra mientras Mixtle habla empieza ya agachada', () => {
    musica.desbloquear();
    musica.agachar();
    musica.poner('tranquila');
    expect(creados.get('tranquila')!.vol).toBe(VOLUMEN_MUSICA.agachada);
  });

  it('al cambiar de pista hace fundido cruzado y detiene la anterior', () => {
    musica.desbloquear();
    musica.poner('tranquila');
    musica.poner('lecciones');
    const tranquila = creados.get('tranquila')!;
    expect(tranquila.fundidos.at(-1)![1]).toBe(0);
    expect(creados.get('lecciones')!.sonando).toBe(true);
    vi.advanceTimersByTime(VOLUMEN_MUSICA.fundidoMs + 100);
    expect(tranquila.sonando).toBe(false);
    expect(musica.pistaActual).toBe('lecciones');
  });

  it('con la música apagada no suena nada, y al encenderla vuelve la pista pedida', () => {
    encendida = false;
    musica.desbloquear();
    musica.poner('tranquila');
    expect(creados.size).toBe(0);
    encendida = true;
    musica.cambioDeInterruptor();
    expect(creados.get('tranquila')?.sonando).toBe(true);
    encendida = false;
    musica.cambioDeInterruptor();
    expect(creados.get('tranquila')?.sonando).toBe(false);
  });

  it('el jingle de celebración suena una vez con el fondo agachado, y el fondo sube al terminar', () => {
    musica.desbloquear();
    musica.poner('lecciones');
    musica.celebrar();
    const jingle = creados.get('celebracion')!;
    expect(jingle.sonando).toBe(true);
    expect(jingle.vol).toBe(VOLUMEN_MUSICA.jingle);
    expect(creados.get('lecciones')!.vol).toBe(VOLUMEN_MUSICA.agachada);
    jingle.terminar();
    expect(creados.get('lecciones')!.vol).toBe(VOLUMEN_MUSICA.base);
  });
});
