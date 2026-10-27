import { estadoSonido } from './estadoSonido';
import { RECETAS, type NombreEfecto, type Nota } from './recetasSonido';

/** Reproductor de efectos sintetizados. Nunca lanza errores: sin audio, el juego sigue. */
class Sonido {
  private ctx: AudioContext | null = null;
  private salida: GainNode | null = null;
  private ruido: AudioBuffer | null = null;

  /** Llamar dentro de un gesto del usuario (los navegadores lo exigen para el audio). */
  desbloquear(): void {
    const ctx = this.contexto();
    if (ctx && ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
  }

  tocar(nombre: NombreEfecto): void {
    if (!estadoSonido.estaActivo) return;
    const ctx = this.contexto();
    if (!ctx || !this.salida) return;
    if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
    const ahora = ctx.currentTime + 0.01;
    for (const nota of RECETAS[nombre] as Nota[]) this.programar(ctx, this.salida, nota, ahora);
  }

  private contexto(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.salida = this.ctx.createGain();
      this.salida.gain.value = 0.8;
      this.salida.connect(this.ctx.destination);
      return this.ctx;
    } catch {
      return null;
    }
  }

  private bufferRuido(ctx: AudioContext): AudioBuffer {
    if (this.ruido) return this.ruido;
    const largo = Math.floor(ctx.sampleRate * 0.5);
    const buffer = ctx.createBuffer(1, largo, ctx.sampleRate);
    const datos = buffer.getChannelData(0);
    for (let i = 0; i < largo; i++) datos[i] = Math.random() * 2 - 1;
    this.ruido = buffer;
    return buffer;
  }

  private programar(ctx: AudioContext, destino: AudioNode, n: Nota, base: number): void {
    try {
      const inicio = base + n.t;
      const fin = inicio + n.d;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.0001, inicio);
      env.gain.exponentialRampToValueAtTime(n.vol, inicio + Math.min(0.015, n.d / 3));
      env.gain.exponentialRampToValueAtTime(0.0001, fin);
      env.connect(destino);

      if (n.onda === 'ruido') {
        const fuente = ctx.createBufferSource();
        fuente.buffer = this.bufferRuido(ctx);
        const filtro = ctx.createBiquadFilter();
        filtro.type = 'bandpass';
        filtro.frequency.value = n.f;
        filtro.Q.value = 1.2;
        fuente.connect(filtro).connect(env);
        fuente.start(inicio);
        fuente.stop(fin + 0.02);
        return;
      }

      const osc = ctx.createOscillator();
      osc.type = n.onda;
      osc.frequency.setValueAtTime(n.f, inicio);
      if (n.f2) osc.frequency.exponentialRampToValueAtTime(n.f2, fin);
      osc.connect(env);
      osc.start(inicio);
      osc.stop(fin + 0.02);
    } catch {
      // Ignorar: un efecto que falla no debe interrumpir el juego.
    }
  }
}

export const sonido = new Sonido();
