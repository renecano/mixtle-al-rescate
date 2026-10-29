// Grupos de ejemplo con avance, para revisar recompensas y grabar el tráiler sin jugar unidades enteras.
// Llegan al juego por el fragmento de mudanza (#mudanza=…), el mismo que usa el cambio de dirección.
import { runnerImport } from 'vite';

const { UNIDADES } = (await runnerImport('./src/contenido/unidades/index.ts')).module;
const { completarLeccion, completarAventura, PROGRESO_VACIO } = (await runnerImport('./src/logica/camino.ts')).module;
const { comprarAccesorio } = (await runnerImport('./src/logica/accesorios.ts')).module;
const { nuevoGrupo } = (await runnerImport('./src/logica/grupos.ts')).module;
const { fragmentoDeMudanza } = (await runnerImport('./src/servicios/mudanza.ts')).module;

const HOY = '2026-10-28';
const leccionesDe = (u, n = u.lecciones.length) =>
  u.lecciones.slice(0, n).reduce((p, l) => completarLeccion(p, l.id, { hojitas: 10 + l.ejercicios.length, aLaPrimera: l.ejercicios.length }, HOY), PROGRESO_VACIO);

/** Unidad 1 con las lecciones hasta el cofre (el cofre queda listo para abrirse). */
export function grupoConCofre() {
  const u1 = UNIDADES[0];
  return { ...nuevoGrupo({ mascota: 'ardilla', color: '#1F6B4A', etiqueta: '2°B' }, 'demo-cofre', 0), progreso: leccionesDe(u1, u1.cofreTrasLeccion + 1) };
}

/** Unidad 1 completa (con su estampa), algunas hojitas gastadas en accesorios puestos. */
export function grupoUnidadCompleta(accesorios = ['gorra', 'paliacate']) {
  const u1 = UNIDADES[0];
  let p = completarAventura({ ...leccionesDe(u1), cofres: [u1.id], hojitas: leccionesDe(u1).hojitas + 15 }, u1, HOY);
  for (const a of accesorios) p = comprarAccesorio(p, a);
  return { ...nuevoGrupo({ mascota: 'ajolote', color: '#2459A6', etiqueta: '1°A' }, 'demo-unidad', 0), progreso: p };
}

export const fragmento = (grupos) => fragmentoDeMudanza({ v: 1, grupos, preferencias: {} });
export { UNIDADES };

const { nodosDelCamino, abrirCofre } = (await runnerImport('./src/logica/camino.ts')).module;

/** Un grupo con las primeras `k` paradas del camino hechas (la siguiente es la k): para revisar cada lugar del zigzag. */
export function grupoEnParada(k, mascota = 'tlacuache') {
  let p = PROGRESO_VACIO;
  for (const n of nodosDelCamino(UNIDADES).slice(0, k)) {
    if (n.tipo === 'leccion') p = completarLeccion(p, n.leccion.id, { hojitas: 12, aLaPrimera: 2 }, HOY);
    else if (n.tipo === 'cofre') p = abrirCofre(p, n.unidad.id, HOY);
    else p = completarAventura(p, n.unidad, HOY);
  }
  return { ...nuevoGrupo({ mascota, color: '#6345A8', etiqueta: `P${k}` }, `demo-parada-${k}`, 0), progreso: p };
}
