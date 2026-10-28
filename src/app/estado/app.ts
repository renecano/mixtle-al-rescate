import { create } from 'zustand';
import { esEscena } from '../../logica/flujo';
import { guardarInterruptor, leerInterruptorApagado } from '../../servicios/preferencias';

export type Pantalla = 'inicio' | 'grupos' | 'camino' | 'leccion' | 'aventura' | 'album';

const CLAVE_PROYECTOR = 'caco-al-rescate:proyector';

interface EstadoApp {
  pantalla: Pantalla;
  leccionId?: string;
  unidadId?: string;
  /** Escena donde empieza la aventura (la intro si no se indica). */
  escenaInicial?: string;
  /** Modo proyector: todo más grande (se recuerda en el dispositivo). */
  proyector: boolean;
  /** Estampa recién ganada para mostrar al volver al camino. */
  estampaNueva?: string;
  jugar: () => void;
  volverAlInicio: () => void;
  alCamino: (estampaNueva?: string) => void;
  abrirLeccion: (leccionId: string) => void;
  abrirAventura: (unidadId: string) => void;
  abrirAlbum: () => void;
  irAGrupos: () => void;
  alternarProyector: () => void;
  olvidarEstampaNueva: () => void;
}

/**
 * Pantalla inicial. Atajos para revisar (solo en desarrollo o con ?e2e):
 * `?escena=Nivel2` entra directo a esa escena de la aventura 1; `?galeria` muestra todo el arte.
 */
export function pantallaInicial(busqueda: string, desarrollo: boolean): Pick<EstadoApp, 'pantalla' | 'escenaInicial' | 'unidadId'> {
  const params = new URLSearchParams(busqueda);
  if (params.has('galeria')) return { pantalla: 'aventura', escenaInicial: 'Galeria' };
  const escena = params.get('escena');
  if ((desarrollo || params.has('e2e')) && esEscena(escena)) return { pantalla: 'aventura', escenaInicial: escena, unidadId: 'u1' };
  return { pantalla: 'inicio' };
}

function aplicarProyector(si: boolean): void {
  if (typeof document !== 'undefined') document.documentElement.toggleAttribute('data-proyector', si);
}

export const useApp = create<EstadoApp>((set, get) => {
  const proyector = leerInterruptorApagado(CLAVE_PROYECTOR);
  aplicarProyector(proyector);
  return {
    ...pantallaInicial(typeof window === 'undefined' ? '' : window.location.search, import.meta.env.DEV),
    proyector,
    jugar: () => set({ pantalla: 'grupos', escenaInicial: undefined }),
    volverAlInicio: () => set({ pantalla: 'inicio', escenaInicial: undefined, leccionId: undefined, unidadId: undefined }),
    alCamino: (estampaNueva) => set({ pantalla: 'camino', escenaInicial: undefined, leccionId: undefined, estampaNueva }),
    abrirLeccion: (leccionId) => set({ pantalla: 'leccion', leccionId }),
    abrirAventura: (unidadId) => set({ pantalla: 'aventura', unidadId, escenaInicial: undefined }),
    abrirAlbum: () => set({ pantalla: 'album' }),
    irAGrupos: () => set({ pantalla: 'grupos' }),
    alternarProyector: () => {
      const si = !get().proyector;
      guardarInterruptor(CLAVE_PROYECTOR, si);
      aplicarProyector(si);
      set({ proyector: si });
    },
    olvidarEstampaNueva: () => set({ estampaNueva: undefined }),
  };
});
