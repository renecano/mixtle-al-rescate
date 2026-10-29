import { PROGRESO_VACIO, type ProgresoGrupo } from './camino';

/**
 * Un grupo de salón (no un niño): se identifica con un animal mascota, un color y, si se quiere,
 * una etiqueta corta como "1°A". Nunca se piden nombres de niñas ni niños.
 */
export interface Grupo {
  id: string;
  mascota: IdMascota;
  color: string;
  etiqueta: string;
  creado: number;
  /** Modo facilitador: todas las lecciones abiertas para saltar directo a una. */
  desbloquearTodo: boolean;
  progreso: ProgresoGrupo;
}

export const MASCOTAS = [
  { id: 'colibri', nombre: 'Colibrí', arte: 'colibri-feliz' },
  { id: 'ardilla', nombre: 'Ardilla', arte: 'ardilla-feliz' },
  { id: 'monarca', nombre: 'Monarca', arte: 'mariposa-feliz' },
  { id: 'ajolote', nombre: 'Ajolote', arte: 'ajolote' },
  { id: 'tlacuache', nombre: 'Tlacuache', arte: 'tlacuache' },
  { id: 'cacomixtle', nombre: 'Cacomixtle', arte: 'mixtle-entero' },
] as const;

export type IdMascota = (typeof MASCOTAS)[number]['id'];

/** Colores de grupo: todos con contraste AA para texto blanco. */
export const COLORES_GRUPO = ['#1F6B4A', '#2459A6', '#B84A14', '#6345A8', '#A8325E', '#7A4E2E'] as const;

export const LARGO_ETIQUETA = 8;

/**
 * Etiqueta corta del grupo ("1°A", "3B", "Tarde"). Se recorta y se quitan símbolos raros.
 * El aviso de no escribir nombres está en la pantalla; aquí además se limita el largo.
 */
export function limpiarEtiqueta(texto: string): string {
  return texto
    .replace(/[^\p{L}\p{N}°º .-]/gu, '')
    .replace(/\s+/g, ' ')
    .trimStart()
    .slice(0, LARGO_ETIQUETA);
}

export function mascota(id: IdMascota) {
  return MASCOTAS.find((m) => m.id === id) ?? MASCOTAS[0];
}

/** Cómo se nombra el grupo en pantalla: "Colibrí 1°A". */
export function nombreDelGrupo(g: Pick<Grupo, 'mascota' | 'etiqueta'>): string {
  return `${mascota(g.mascota).nombre}${g.etiqueta.trim() ? ` ${g.etiqueta.trim()}` : ''}`;
}

export function nuevoGrupo(datos: Pick<Grupo, 'mascota' | 'color' | 'etiqueta'>, id: string, ahora: number): Grupo {
  return {
    id,
    mascota: datos.mascota,
    color: datos.color,
    etiqueta: limpiarEtiqueta(datos.etiqueta).trim(),
    creado: ahora,
    desbloquearTodo: false,
    progreso: structuredClone(PROGRESO_VACIO),
  };
}

/** Revisa lo leído del almacenamiento: descarta lo dañado en lugar de romper la app. */
export function gruposValidos(datos: unknown): Grupo[] {
  if (!Array.isArray(datos)) return [];
  return datos.filter((g): g is Grupo => {
    if (!g || typeof g !== 'object') return false;
    const x = g as Partial<Grupo>;
    return (
      typeof x.id === 'string' &&
      MASCOTAS.some((m) => m.id === x.mascota) &&
      typeof x.color === 'string' &&
      typeof x.etiqueta === 'string' &&
      !!x.progreso &&
      typeof x.progreso.hojitas === 'number' &&
      Array.isArray(x.progreso.dias)
    );
  });
}

/** Cuánto ha avanzado un grupo (para decidir cuál conservar si llega dos veces). */
function avanceDe(g: Grupo): number {
  return Object.keys(g.progreso.lecciones).length * 1000 + g.progreso.hojitas;
}

/**
 * Junta los grupos que llegan (por ejemplo, de la mudanza de dirección) con los que ya hay.
 * Un grupo nuevo se agrega; si ya existe (mismo id), se queda el que lleva más avance. Nunca se pierde uno.
 */
export function fusionarGrupos(actuales: readonly Grupo[], llegan: readonly Grupo[]): Grupo[] {
  const resultado = [...actuales];
  for (const g of llegan) {
    const i = resultado.findIndex((x) => x.id === g.id);
    if (i < 0) resultado.push(g);
    else if (avanceDe(g) > avanceDe(resultado[i]!)) resultado[i] = g;
  }
  return resultado;
}
