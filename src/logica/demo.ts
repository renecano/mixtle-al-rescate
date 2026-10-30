import { UNIDADES } from '../contenido/unidades';
import { abrirCofre, completarAventura, completarLeccion, nodosDelCamino, PROGRESO_VACIO, type ProgresoGrupo } from './camino';
import { HOJITAS_POR_LECCION } from './leccion';
import { COLORES_GRUPO, nuevoGrupo, type Grupo } from './grupos';

/*
 * Grupo de demostración (modo facilitador): un grupo "Demo" como si hubiera terminado las 5 unidades,
 * para enseñar el juego completo (parque lleno, álbum, diplomas, vestidor) sin jugarlo. Es un grupo
 * más: no toca el avance de los grupos reales y se borra como cualquiera.
 */

export const ETIQUETA_DEMO = 'Demo';

/** Todo el camino hecho, con cada ejercicio a la primera: hojitas de sobra para el vestidor. */
export function progresoCompleto(hoy: string): ProgresoGrupo {
  let p: ProgresoGrupo = structuredClone(PROGRESO_VACIO);
  for (const n of nodosDelCamino(UNIDADES)) {
    if (n.tipo === 'leccion') p = completarLeccion(p, n.leccion.id, { hojitas: HOJITAS_POR_LECCION + n.leccion.ejercicios.length, aLaPrimera: n.leccion.ejercicios.length }, hoy);
    else if (n.tipo === 'cofre') p = abrirCofre(p, n.unidad.id, hoy);
    else p = completarAventura(p, n.unidad, hoy);
  }
  return p;
}

export function grupoDemo(id: string, ahora: number, hoy: string): Grupo {
  return { ...nuevoGrupo({ mascota: 'cacomixtle', color: COLORES_GRUPO[2], etiqueta: ETIQUETA_DEMO }, id, ahora), progreso: progresoCompleto(hoy) };
}
