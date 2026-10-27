import { NOMBRE_DEL_ICONO, type Categoria } from '../data/categorias';
import type { CategoriaBase, Material, Residuo } from '../data/residuos';

const MIN_CATEGORIAS = 2;
const MAX_CATEGORIAS = 4;

/** Lo mínimo para saber a qué bote va algo: su categoría base y, si se conoce, su material. */
export interface Clasificable {
  categoria: CategoriaBase;
  material?: Material;
}

/** Botes que aceptan el objeto, con prioridad para los que coinciden por material. */
function candidatos(objeto: Clasificable, categorias: readonly Categoria[]): Categoria[] {
  const porMaterial = objeto.material ? categorias.filter((c) => c.acepta.includes(objeto.material!)) : [];
  if (porMaterial.length) return porMaterial;
  return categorias.filter((c) => c.acepta.includes(objeto.categoria));
}

/** El bote correcto para un residuo, o null si la configuración no lo cubre o es ambigua. */
export function categoriaDe(objeto: Clasificable, categorias: readonly Categoria[]): Categoria | null {
  const c = candidatos(objeto, categorias);
  return c.length === 1 ? c[0]! : null;
}

export function esCorrecto(objeto: Clasificable, categoriaId: string, categorias: readonly Categoria[]): boolean {
  return categoriaDe(objeto, categorias)?.id === categoriaId;
}

/** Lista de problemas en la configuración de botes y residuos (vacía si todo está bien). */
export function validarConfiguracion(categorias: readonly Categoria[], residuos: readonly Residuo[]): string[] {
  const errores: string[] = [];
  if (categorias.length < MIN_CATEGORIAS || categorias.length > MAX_CATEGORIAS) {
    errores.push(`Debe haber de ${MIN_CATEGORIAS} a ${MAX_CATEGORIAS} categorías y hay ${categorias.length}.`);
  }
  const ids = new Set<string>();
  for (const c of categorias) {
    if (ids.has(c.id)) errores.push(`La categoría "${c.id}" está repetida.`);
    ids.add(c.id);
    if (!/^#[0-9a-f]{6}$/i.test(c.color)) errores.push(`El color de "${c.id}" debe ser como #1F6B4A.`);
    if (!c.nombre.trim()) errores.push(`La categoría "${c.id}" no tiene nombre.`);
    if (!(c.icono in NOMBRE_DEL_ICONO)) errores.push(`La categoría "${c.id}" usa un ícono que no existe.`);
    if (!c.acepta.length) errores.push(`La categoría "${c.id}" no acepta ningún residuo.`);
  }
  const idsResiduos = new Set<string>();
  for (const r of residuos) {
    if (idsResiduos.has(r.id)) errores.push(`El residuo "${r.id}" está repetido.`);
    idsResiduos.add(r.id);
    const c = candidatos(r, categorias);
    if (c.length === 0) errores.push(`Ningún bote acepta "${r.id}".`);
    if (c.length > 1) errores.push(`"${r.id}" podría ir a varios botes: ${c.map((x) => x.id).join(', ')}.`);
  }
  return errores;
}

/** Cómo se llama el bote en voz alta: "el bote verde de la hojita". */
export function descripcionBote(c: Categoria): string {
  return `el bote ${c.nombreColor} de ${NOMBRE_DEL_ICONO[c.icono]}`;
}

/**
 * Pista amable cuando el residuo fue a otro bote. Nunca regaña. Son tres frases cortas:
 * el residuo ya está a la vista, así que la pista se centra en cómo reconocer su bote.
 */
export function textoPista(correcta: Categoria): string {
  return `¡Casi! ${correcta.pista} Busca ${descripcionBote(correcta)}.`;
}

/** Frase al acertar: celebración + dato curioso. */
export function textoAcierto(residuo: Residuo, celebracion: string): string {
  return `${celebracion} ${residuo.dato}`;
}
