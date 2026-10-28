import { describe, expect, it } from 'vitest';
import { catalogoArte } from '../src/arte/catalogo';
import { CATEGORIAS } from '../src/data/categorias';
import { RESIDUOS } from '../src/data/residuos';
import type { Ejercicio, Leccion } from '../src/contenido/tipos';
import { TEXTOS_AVENTURAS } from '../src/contenido/aventuras';
import { UNIDADES } from '../src/contenido/unidades';
import { UNIDADES_CON_AVENTURA } from '../src/aventuras';
import { categoriaDe } from '../src/logica/clasificacion';
import { todosLosEjercicios } from '../src/voz/frases';

const ARTE = new Set(catalogoArte().map((a) => a.clave));
const LECCIONES = UNIDADES.flatMap((u) => u.lecciones.map((l) => [u.id, l] as [string, Leccion]));
const EJERCICIOS = UNIDADES.flatMap((u) => u.lecciones.flatMap((l) => todosLosEjercicios(l.ejercicios).map((e) => [u.id, e] as [string, Ejercicio])));

/** Todas las claves de arte que usa un ejercicio. */
function arteDe(e: Ejercicio): string[] {
  switch (e.tipo) {
    case 'elige-imagen':
    case 'escucha-toca':
      return e.opciones.map((o) => o.arte);
    case 'parejas':
      return e.pares.flatMap((p) => [p.izquierda.arte, p.derecha.arte]);
    case 'si-no':
      return e.junto ? [e.arte, e.junto] : [e.arte];
    case 'ordena':
      return e.pasos.map((p) => p.arte);
    case 'encuentra-error':
      return [e.escena, ...e.objetos.map((o) => o.arte)];
    default:
      return [];
  }
}

describe('unidades', () => {
  it('ids únicos y numeración en orden', () => {
    expect(new Set(UNIDADES.map((u) => u.id)).size).toBe(UNIDADES.length);
    UNIDADES.forEach((u, i) => expect(u.numero).toBe(i + 1));
    const ids = [...LECCIONES.map(([, l]) => l.id), ...EJERCICIOS.map(([, e]) => e.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cada unidad tiene de 4 a 5 lecciones y su aventura registrada', () => {
    for (const u of UNIDADES) {
      expect(u.lecciones.length, u.id).toBeGreaterThanOrEqual(4);
      expect(u.lecciones.length, u.id).toBeLessThanOrEqual(5);
      expect(UNIDADES_CON_AVENTURA, u.id).toContain(u.id);
      // La aventura 1 usa los textos de la v1; las demás, src/contenido/aventuras.ts.
      if (u.id !== 'u1') expect(Object.keys(TEXTOS_AVENTURAS), u.id).toContain(u.id);
    }
  });

  it('cada estampa es un animal distinto del álbum', () => {
    const ids = UNIDADES.map((u) => u.estampa.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(['cacomixtle', 'tlacuache', 'colibri', 'monarca', 'ajolote']).toContain(id);
  });

  it.each(UNIDADES.map((u) => [u.id, u] as const))('%s: cofre a la mitad, estampa y aventura con arte que existe', (_id, u) => {
    expect(u.cofreTrasLeccion).toBeGreaterThanOrEqual(0);
    expect(u.cofreTrasLeccion).toBeLessThan(u.lecciones.length - 1);
    expect(ARTE.has(u.estampa.arte)).toBe(true);
    expect(ARTE.has(u.aventura.arte)).toBe(true);
    expect(u.estampa.dato.trim()).toMatch(/[.!]$/);
    expect(u.color).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe('lecciones', () => {
  it.each(LECCIONES.map(([u, l]) => [`${u}/${l.id}`, l] as const))('%s: de 6 a 8 ejercicios, con tipos variados', (_id, l) => {
    expect(l.ejercicios.length).toBeGreaterThanOrEqual(6);
    expect(l.ejercicios.length).toBeLessThanOrEqual(8);
    expect(new Set(l.ejercicios.map((e) => e.tipo)).size).toBeGreaterThanOrEqual(3);
    expect(ARTE.has(l.arte)).toBe(true);
  });
});

describe('ejercicios: datos válidos y ninguno imposible', () => {
  it.each(EJERCICIOS.map(([u, e]) => [`${u}/${e.id} (${e.tipo})`, u, e] as const))('%s', (_id, unidad, e) => {
    expect(e.consigna.trim().length).toBeGreaterThan(5);
    expect(e.pista.trim().length).toBeGreaterThan(5);
    for (const clave of arteDe(e)) expect(ARTE.has(clave), `arte "${clave}"`).toBe(true);

    switch (e.tipo) {
      case 'elige-imagen':
      case 'escucha-toca': {
        expect(e.opciones.length).toBeGreaterThanOrEqual(2);
        expect(e.opciones.length).toBeLessThanOrEqual(4);
        expect(new Set(e.opciones.map((o) => o.id)).size).toBe(e.opciones.length);
        expect(e.opciones.filter((o) => o.id === e.correcta)).toHaveLength(1);
        break;
      }
      case 'al-bote':
        expect(e.residuos.length).toBeGreaterThan(0);
        for (const id of e.residuos) {
          const r = RESIDUOS.find((x) => x.id === id);
          expect(r, `residuo "${id}"`).toBeDefined();
          expect(categoriaDe(r!, CATEGORIAS)).not.toBeNull();
        }
        break;
      case 'parejas': {
        expect(e.pares.length).toBeGreaterThanOrEqual(2);
        expect(e.pares.length).toBeLessThanOrEqual(4);
        const izq = e.pares.map((p) => p.izquierda.id);
        const der = e.pares.map((p) => p.derecha.id);
        expect(new Set(izq).size).toBe(izq.length);
        expect(new Set(der).size).toBe(der.length);
        break;
      }
      case 'si-no':
        expect(typeof e.respuesta).toBe('boolean');
        expect(e.porque.trim().length).toBeGreaterThan(5);
        break;
      case 'ordena':
        expect(e.pasos.length).toBeGreaterThanOrEqual(3);
        expect(e.pasos.length).toBeLessThanOrEqual(4);
        expect(new Set(e.pasos.map((p) => p.id)).size).toBe(e.pasos.length);
        break;
      case 'encuentra-error': {
        const mal = e.objetos.filter((o) => o.mal);
        expect(mal.length).toBeGreaterThanOrEqual(1);
        expect(mal.length).toBeLessThanOrEqual(3);
        for (const o of e.objetos) {
          expect(o.x).toBeGreaterThan(0);
          expect(o.x).toBeLessThan(100);
          expect(o.y).toBeGreaterThan(0);
          expect(o.y).toBeLessThan(100);
          expect(o.ancho).toBeGreaterThanOrEqual(6);
        }
        break;
      }
      case 'muestrale':
        // La cámara es opcional y solo aparece en la unidad 1; siempre hay respaldo con dibujos.
        expect(unidad).toBe('u1');
        expect(e.respaldo.tipo).toBe('elige-imagen');
        break;
    }
  });

  it('están los 8 tipos de ejercicio', () => {
    const tipos = new Set(EJERCICIOS.map(([, e]) => e.tipo));
    expect([...tipos].sort()).toEqual(['al-bote', 'elige-imagen', 'encuentra-error', 'escucha-toca', 'muestrale', 'ordena', 'parejas', 'si-no']);
  });
});
