import { create } from 'zustand';
import { voz } from '../../servicios/voz';
import { textoDeLocucion, type Locucion } from '../../voz/locucion';
import type { ExpresionMixtle } from '../componentes/MixtleFigura';

interface EstadoNarrador {
  /** Lo que dijo Mixtle por última vez (subtítulo en pantalla). */
  subtitulo: string;
  hablando: boolean;
  /** Cara de Mixtle cuando no está hablando. */
  expresion: ExpresionMixtle;
  ultima: Locucion | null;
}

export const useNarrador = create<EstadoNarrador>(() => ({ subtitulo: '', hablando: false, expresion: 'normal', ultima: null }));

let turno = 0;

interface OpcionesDecir {
  expresion?: ExpresionMixtle;
  alTerminar?: () => void;
  /** Si el audio no está listo para entonces, no se dice tarde (queda el subtítulo). */
  esperaMaximaMs?: number;
  /**
   * Si Mixtle sigue hablando, esperar a que termine (como mucho estos ms) en lugar de cortarlo: así
   * "¡Al rescate!" se oye completo encima de la transición antes de la bienvenida de la pantalla nueva.
   */
  trasLaActualMs?: number;
}

/**
 * Mixtle dice algo en las pantallas de React (voz + subtítulo). `alTerminar` se llama una vez:
 * al acabar la voz o, si se interrumpe o no hay voz, poco después de la duración estimada.
 */
export function decir(locucion: Locucion, op: OpcionesDecir = {}): number {
  if (op.trasLaActualMs && useNarrador.getState().hablando) {
    const turnoAlPedir = turno;
    let seguido = false;
    const seguir = () => {
      if (seguido) return;
      seguido = true;
      dejar();
      window.clearTimeout(reloj);
      // Si mientras tanto se dijo otra cosa o se calló a Mixtle (se cambió de pantalla), ya no se dice.
      if (turno === turnoAlPedir) decir(locucion, { ...op, trasLaActualMs: undefined });
    };
    const dejar = useNarrador.subscribe((s) => {
      if (!s.hablando) seguir();
    });
    const reloj = window.setTimeout(seguir, op.trasLaActualMs);
    return 0;
  }
  const miTurno = ++turno;
  let hecho = false;
  const fin = () => {
    if (hecho) return;
    hecho = true;
    if (miTurno === turno) useNarrador.setState({ hablando: false });
    op.alTerminar?.();
  };
  useNarrador.setState({
    subtitulo: textoDeLocucion(locucion),
    hablando: true,
    ultima: locucion,
    ...(op.expresion ? { expresion: op.expresion } : {}),
  });
  const ms = voz.decir(locucion, fin, { esperaMaximaMs: op.esperaMaximaMs });
  window.setTimeout(fin, ms + 1200);
  return ms;
}

export function repetir(): void {
  const { ultima } = useNarrador.getState();
  if (ultima) decir(ultima);
}

export function callar(): void {
  turno += 1;
  voz.callar();
  useNarrador.setState({ hablando: false });
}

export function ponerExpresion(expresion: ExpresionMixtle): void {
  useNarrador.setState({ expresion });
}
