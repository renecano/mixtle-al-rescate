import type { Unidad } from '../contenido/tipos';
import { accesoriosPuestos, type IdAccesorio } from './accesorios';
import { unidadCompleta } from './camino';
import { mascota, nombreDelGrupo, type Grupo } from './grupos';

/**
 * Lo que dice el diploma de una unidad terminada (se ve en pantalla y se imprime). Cuenta el
 * esfuerzo del grupo en esa unidad; nunca lo compara con otros grupos.
 */
export interface DatosDiplomaUnidad {
  grupo: string;
  /** Arte de la mascota del grupo (con sus accesorios, si los tiene). */
  mascotaArte: string;
  mascotaId: Grupo['mascota'];
  /** Los accesorios que trae puestos la mascota (se ven en el diploma). */
  puestos: IdAccesorio[];
  unidad: { numero: number; titulo: string; tema: string; color: string };
  lecciones: number;
  /** Hojitas ganadas en las lecciones de la unidad (el mejor resultado de cada una). */
  hojitas: number;
  aLaPrimera: number;
  estampa: { arte: string; nombre: string };
  /** Fecha en palabras ("28 de octubre de 2026"). */
  fecha: string;
}

export function fechaEnPalabras(fecha: Date): string {
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(fecha);
}

/** Datos del diploma, o null si la unidad aún no está terminada (no hay diploma a medias). */
export function datosDiplomaUnidad(grupo: Grupo, unidad: Unidad, fecha: Date): DatosDiplomaUnidad | null {
  const p = grupo.progreso;
  if (!unidadCompleta(unidad, p)) return null;
  const resultados = unidad.lecciones.map((l) => p.lecciones[l.id]).filter((r) => !!r);
  return {
    grupo: nombreDelGrupo(grupo),
    mascotaArte: mascota(grupo.mascota).arte,
    mascotaId: grupo.mascota,
    puestos: accesoriosPuestos(p),
    unidad: { numero: unidad.numero, titulo: unidad.titulo, tema: unidad.tema, color: unidad.color },
    lecciones: resultados.length,
    hojitas: resultados.reduce((s, r) => s + r.hojitas, 0),
    aLaPrimera: resultados.reduce((s, r) => s + r.aLaPrimera, 0),
    estampa: { arte: unidad.estampa.arte, nombre: unidad.estampa.nombre },
    fecha: fechaEnPalabras(fecha),
  };
}
