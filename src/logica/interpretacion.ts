import type { Categoria } from '../data/categorias';
import type { EntradaMapeo } from '../data/mapeoImagenet';
import type { CategoriaBase } from '../data/residuos';
import { categoriaDe } from './clasificacion';

/** Lo que devuelve cualquier clasificador: una etiqueta y su probabilidad (0 a 1). */
export interface Prediccion {
  etiqueta: string;
  probabilidad: number;
}

export type Interpretacion =
  | { tipo: 'seguro'; etiqueta: string; nombre: string; categoria: Categoria; probabilidad: number }
  | { tipo: 'duda'; mejor: Prediccion | null };

const BASES: readonly CategoriaBase[] = ['organico', 'reciclable', 'no-reciclable'];
/** Probabilidad a partir de la cual la predicción principal "manda" aunque no sepamos traducirla. */
const DOMINANTE = 0.5;

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-');
}

/**
 * Qué bote corresponde a una etiqueta:
 *  1. una etiqueta de ImageNet que esté en el mapeo, o
 *  2. el id de un bote de categorias.ts (modelos de Teachable Machine), o
 *  3. una categoría base ('organico', 'reciclable', 'no-reciclable').
 */
export function resolverEtiqueta(
  etiqueta: string,
  mapeo: Readonly<Record<string, EntradaMapeo>>,
  categorias: readonly Categoria[],
): { nombre: string; categoria: Categoria } | null {
  const entrada = mapeo[etiqueta];
  if (entrada) {
    const categoria = categoriaDe(entrada, categorias);
    return categoria ? { nombre: entrada.nombre, categoria } : null;
  }
  const clave = normalizar(etiqueta);
  const porId = categorias.find((c) => normalizar(c.id) === clave || normalizar(c.nombre) === clave);
  if (porId) return { nombre: 'algo', categoria: porId };
  const base = BASES.find((b) => b === clave);
  if (base) {
    const categoria = categoriaDe({ categoria: base }, categorias);
    return categoria ? { nombre: 'algo', categoria } : null;
  }
  return null;
}

/**
 * Decide si Caco se anima a decir qué es. Toma la predicción más probable que sepamos
 * traducir; si no llega al umbral (o no hay ninguna), Caco pide ayuda.
 */
export function interpretar(
  predicciones: readonly Prediccion[],
  mapeo: Readonly<Record<string, EntradaMapeo>>,
  categorias: readonly Categoria[],
  umbral: number,
): Interpretacion {
  const ordenadas = [...predicciones].sort((a, b) => b.probabilidad - a.probabilidad);
  for (const [i, p] of ordenadas.entries()) {
    if (p.probabilidad < umbral) break;
    const r = resolverEtiqueta(p.etiqueta, mapeo, categorias);
    if (r) return { tipo: 'seguro', etiqueta: p.etiqueta, nombre: r.nombre, categoria: r.categoria, probabilidad: p.probabilidad };
    // Si el modelo está muy seguro de que es otra cosa (una persona, una mesa...), no adivinamos.
    if (i === 0 && p.probabilidad >= DOMINANTE) break;
  }
  return { tipo: 'duda', mejor: ordenadas[0] ?? null };
}
