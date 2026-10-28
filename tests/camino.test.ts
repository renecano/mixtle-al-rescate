import { describe, expect, it } from 'vitest';
import { UNIDADES } from '../src/contenido/unidades';
import {
  abrirCofre,
  completarAventura,
  completarLeccion,
  estadosDelCamino,
  etapaParque,
  HOJITAS_AVENTURA,
  HOJITAS_COFRE,
  hojitasPosibles,
  hoyLocal,
  MAXIMOS_PARQUE,
  nodosDelCamino,
  PROGRESO_VACIO,
  rachaDias,
  siguienteNodo,
  unidadCompleta,
  type ProgresoGrupo,
} from '../src/logica/camino';

const HOY = '2026-10-27';
const nodos = nodosDelCamino(UNIDADES);
const u1 = UNIDADES[0]!;

/** Completa todo el camino en orden. */
function todoHecho(): ProgresoGrupo {
  let p = PROGRESO_VACIO;
  for (const n of nodos) {
    if (n.tipo === 'leccion') p = completarLeccion(p, n.leccion.id, { hojitas: 10 + n.leccion.ejercicios.length, aLaPrimera: n.leccion.ejercicios.length }, HOY);
    if (n.tipo === 'cofre') p = abrirCofre(p, n.unidad.id, HOY);
    if (n.tipo === 'aventura') p = completarAventura(p, n.unidad, HOY);
  }
  return p;
}

describe('camino de aprendizaje', () => {
  it('cada unidad tiene sus lecciones, un cofre a la mitad y la aventura al final', () => {
    for (const u of UNIDADES) {
      const propios = nodos.filter((n) => n.unidad.id === u.id);
      expect(propios.at(-1)?.tipo).toBe('aventura');
      expect(propios.filter((n) => n.tipo === 'cofre')).toHaveLength(1);
      const iCofre = propios.findIndex((n) => n.tipo === 'cofre');
      expect(iCofre).toBeGreaterThan(0);
      expect(iCofre).toBeLessThan(propios.length - 1);
    }
  });

  it('al empezar solo está abierta la primera lección', () => {
    const estados = estadosDelCamino(nodos, PROGRESO_VACIO);
    expect(estados[0]).toBe('disponible');
    expect(estados.slice(1).every((e) => e === 'bloqueado')).toBe(true);
    expect(siguienteNodo(nodos, PROGRESO_VACIO)).toBe(0);
  });

  it('se desbloquea en orden y lo hecho se puede repetir', () => {
    const p = completarLeccion(PROGRESO_VACIO, u1.lecciones[0]!.id, { hojitas: 12, aLaPrimera: 2 }, HOY);
    const estados = estadosDelCamino(nodos, p);
    expect(estados[0]).toBe('hecho');
    expect(estados[1]).toBe('disponible');
    expect(estados[2]).toBe('bloqueado');
    expect(siguienteNodo(nodos, p)).toBe(1);
  });

  it('el modo facilitador abre todo sin marcarlo como hecho', () => {
    const estados = estadosDelCamino(nodos, PROGRESO_VACIO, true);
    expect(estados.every((e) => e === 'disponible')).toBe(true);
  });

  it('repetir una lección suma hojitas y guarda el mejor resultado', () => {
    const id = u1.lecciones[0]!.id;
    let p = completarLeccion(PROGRESO_VACIO, id, { hojitas: 14, aLaPrimera: 4 }, HOY);
    p = completarLeccion(p, id, { hojitas: 11, aLaPrimera: 1 }, HOY);
    expect(p.hojitas).toBe(25);
    expect(p.lecciones[id]).toEqual({ hojitas: 14, aLaPrimera: 4, veces: 2 });
  });

  it('el cofre se abre una sola vez y la aventura da su estampa una sola vez', () => {
    let p = abrirCofre(PROGRESO_VACIO, 'u1', HOY);
    p = abrirCofre(p, 'u1', HOY);
    expect(p.hojitas).toBe(HOJITAS_COFRE);
    p = completarAventura(p, u1, HOY);
    p = completarAventura(p, u1, HOY);
    expect(p.estampas).toEqual([u1.estampa.id]);
    expect(p.hojitas).toBe(HOJITAS_COFRE + HOJITAS_AVENTURA);
  });

  it('terminar todo deja el camino completo y cada unidad completa', () => {
    const p = todoHecho();
    expect(siguienteNodo(nodos, p)).toBeNull();
    for (const u of UNIDADES) expect(unidadCompleta(u, p)).toBe(true);
    expect(p.hojitas).toBe(hojitasPosibles(UNIDADES));
  });
});

describe('días jugados (racha suave)', () => {
  it('cuenta días seguidos hasta hoy o hasta ayer, sin "perderse" en la mañana', () => {
    expect(rachaDias(['2026-10-25', '2026-10-26', '2026-10-27'], HOY)).toBe(3);
    expect(rachaDias(['2026-10-25', '2026-10-26'], HOY)).toBe(2);
    expect(rachaDias(['2026-10-20', '2026-10-27'], HOY)).toBe(1);
    expect(rachaDias([], HOY)).toBe(0);
  });

  it('cruza fin de mes y no duplica días', () => {
    expect(rachaDias(['2026-09-30', '2026-10-01'], '2026-10-01')).toBe(2);
    const p = completarLeccion(completarLeccion(PROGRESO_VACIO, 'a', { hojitas: 10, aLaPrimera: 0 }, HOY), 'b', { hojitas: 10, aLaPrimera: 0 }, HOY);
    expect(p.dias).toEqual([HOY]);
  });

  it('hoyLocal usa la fecha local', () => {
    expect(hoyLocal(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('el parque del grupo', () => {
  it('empieza gris y con toda la basura', () => {
    expect(etapaParque(PROGRESO_VACIO, UNIDADES)).toEqual({ avance: 0, basura: MAXIMOS_PARQUE.basura, arboles: 0, flores: 0 });
  });

  it('crece de forma constante: la basura baja y los árboles y flores suben', () => {
    let anterior = etapaParque(PROGRESO_VACIO, UNIDADES);
    const total = hojitasPosibles(UNIDADES);
    for (let h = 0; h <= total; h += Math.ceil(total / 25)) {
      const e = etapaParque({ ...PROGRESO_VACIO, hojitas: h }, UNIDADES);
      expect(e.basura).toBeLessThanOrEqual(anterior.basura);
      expect(e.arboles).toBeGreaterThanOrEqual(anterior.arboles);
      expect(e.flores).toBeGreaterThanOrEqual(anterior.flores);
      anterior = e;
    }
  });

  it('una sola lección ya se nota (el grupo ve que su esfuerzo sirve)', () => {
    const l = u1.lecciones[0]!;
    const p = completarLeccion(PROGRESO_VACIO, l.id, { hojitas: 10 + l.ejercicios.length, aLaPrimera: l.ejercicios.length }, HOY);
    expect(etapaParque(p, UNIDADES).basura).toBeLessThan(MAXIMOS_PARQUE.basura);
  });

  it('al terminar todo está limpio y lleno de vida', () => {
    expect(etapaParque(todoHecho(), UNIDADES)).toEqual({ avance: 1, basura: 0, arboles: MAXIMOS_PARQUE.arboles, flores: MAXIMOS_PARQUE.flores });
  });
});
