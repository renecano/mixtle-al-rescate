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

/**
 * Mixtle dice algo en las pantallas de React (voz + subtítulo). `alTerminar` se llama una vez:
 * al acabar la voz o, si se interrumpe o no hay voz, poco después de la duración estimada.
 */
export function decir(locucion: Locucion, op: { expresion?: ExpresionMixtle; alTerminar?: () => void } = {}): number {
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
  const ms = voz.decir(locucion, fin);
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
