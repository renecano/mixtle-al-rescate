import { create } from 'zustand';
import { esEscena } from '../../logica/flujo';

export type Pantalla = 'inicio' | 'aventura';

interface EstadoApp {
  pantalla: Pantalla;
  /** Escena donde empieza la aventura (la intro si no se indica). */
  escenaInicial?: string;
  jugar: () => void;
  volverAlInicio: () => void;
}

/**
 * Pantalla inicial. Atajos para revisar (solo en desarrollo o con ?e2e):
 * `?escena=Nivel2` entra directo a esa escena; `?galeria` muestra todo el arte.
 */
export function pantallaInicial(busqueda: string, desarrollo: boolean): Pick<EstadoApp, 'pantalla' | 'escenaInicial'> {
  const params = new URLSearchParams(busqueda);
  if (params.has('galeria')) return { pantalla: 'aventura', escenaInicial: 'Galeria' };
  const escena = params.get('escena');
  if ((desarrollo || params.has('e2e')) && esEscena(escena)) return { pantalla: 'aventura', escenaInicial: escena };
  return { pantalla: 'inicio' };
}

export const useApp = create<EstadoApp>((set) => ({
  ...pantallaInicial(typeof window === 'undefined' ? '' : window.location.search, import.meta.env.DEV),
  jugar: () => set({ pantalla: 'aventura', escenaInicial: undefined }),
  volverAlInicio: () => set({ pantalla: 'inicio', escenaInicial: undefined }),
}));
