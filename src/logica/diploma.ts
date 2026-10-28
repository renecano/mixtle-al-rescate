import type { Animal } from '../data/animales';
import type { Categoria } from '../data/categorias';
import { TEXTOS } from '../data/textos';
import type { Locucion } from '../voz/locucion';
import { animalesDelDiploma, resumenDiploma, type Progreso } from './progreso';

/** Una columna del diploma: un número grande, qué cuenta y sus dibujos. */
export interface ColumnaDiploma {
  numero: number;
  /** Qué se contó, ya en singular o plural ("residuo bien separado"). */
  etiqueta: string;
  /** Dibujos fijos arriba del número (por ejemplo, los tres botes). */
  iconos?: string[];
  /** Un dibujo por cada cosa contada; aparecen mientras sube el número. */
  figuras?: string[];
}

/**
 * Lo que muestra el diploma de una unidad. Es el diploma de la v1 ("Guardianes del parque"),
 * el mismo para todas las unidades: cambian el subtítulo, las dos columnas y lo que narra Caco.
 */
export interface DatosDiploma {
  /** Tema de la unidad, debajo de "Diploma para todo el grupo". Sin él, solo esa línea (unidad 1 de la v1). */
  subtitulo?: string;
  izquierda: ColumnaDiploma;
  derecha: ColumnaDiploma;
  narracion: Locucion;
}

/** Singular o plural según el número (1 → singular). */
export function segun(n: number, singular: string, plural: string): string {
  return n === 1 ? singular : plural;
}

/** Diploma de la aventura de la unidad 1: residuos separados y animales ayudados, como en la v1. */
export function diplomaUnidad1(p: Progreso, animales: readonly Animal[], categorias: readonly Categoria[]): DatosDiploma {
  const r = resumenDiploma(p, animales);
  return {
    izquierda: {
      numero: r.residuosSeparados,
      etiqueta: TEXTOS.diploma.residuos(r.residuosSeparados),
      iconos: categorias.map((c) => `bote-${c.id}`),
    },
    derecha: {
      numero: r.animalesAyudados,
      etiqueta: TEXTOS.diploma.animales(r.animalesAyudados),
      figuras: animalesDelDiploma(p, animales).map((f) => `${f}-feliz`),
    },
    narracion: TEXTOS.diploma.narracion(r.residuosSeparados, r.animalesAyudados),
  };
}

/** Repite un dibujo `n` veces (para las figuras que aparecen al contar). */
export function figurasRepetidas(clave: string, n: number): string[] {
  return Array.from({ length: Math.max(0, n) }, () => clave);
}
