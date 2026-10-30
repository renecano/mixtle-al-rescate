import { TEXTOS_APP } from '../contenido/textosApp';
import type { ProgresoGrupo } from './camino';

/*
 * Recorrido guiado: la primera vez que un GRUPO llega al camino, Mixtle enseña para qué sirve cada
 * cosa (la siguiente lección, el parque, las hojitas, el álbum, el vestidor…), una a la vez y en voz
 * alta. Se recuerda en el avance del grupo, no en el aparato: muchos maestros usan su propio
 * dispositivo con niños distintos en cada grupo. Se puede saltar en cualquier momento y se vuelve a
 * ver desde el modo facilitador.
 */

/** Lo que se señala: el elemento con `data-recorrido="<objetivo>"` (null: el paso va al centro, sin señalar nada). */
export interface PasoRecorrido {
  id: keyof typeof TEXTOS_APP.recorrido.dice;
  objetivo: string | null;
}

export const PASOS_RECORRIDO: readonly PasoRecorrido[] = [
  { id: 'hola', objetivo: null },
  { id: 'siguienteLeccion', objetivo: 'siguiente' },
  { id: 'parque', objetivo: 'parque' },
  { id: 'hojitas', objetivo: 'hojitas' },
  { id: 'dias', objetivo: 'dias' },
  { id: 'album', objetivo: 'album' },
  { id: 'vestidor', objetivo: 'vestidor' },
  { id: 'cambiarGrupo', objetivo: 'cambiar-grupo' },
  { id: 'sistema', objetivo: 'sistema' },
  { id: 'fin', objetivo: null },
];

/**
 * ¿Se muestra al llegar al camino? Sí, si el grupo es nuevo y aún no lo ha visto (`recorridoVisto`
 * en falso). Los grupos de antes de que existiera la marca no lo ven otra vez. Con `?e2e` (pruebas,
 * capturas, tráiler) no, para no tapar lo que se revisa, salvo que se pida con `?recorrido-guiado`.
 */
export function debeMostrarRecorrido(busqueda: string, progreso: Pick<ProgresoGrupo, 'recorridoVisto'>): boolean {
  const params = new URLSearchParams(busqueda);
  if (params.has('recorrido-guiado')) return true;
  if (params.has('e2e')) return false;
  return progreso.recorridoVisto === false;
}

/** El grupo ya vio (o saltó) el recorrido: queda en su avance. */
export function marcarRecorridoVisto(p: ProgresoGrupo): ProgresoGrupo {
  return { ...p, recorridoVisto: true };
}

/** Los pasos que se pueden mostrar: los del centro siempre; los demás, si su elemento está en pantalla. */
export function pasosDisponibles(existe: (objetivo: string) => boolean, pasos: readonly PasoRecorrido[] = PASOS_RECORRIDO): PasoRecorrido[] {
  return pasos.filter((p) => p.objetivo === null || existe(p.objetivo));
}
