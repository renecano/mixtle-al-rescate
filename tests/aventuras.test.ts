import { describe, expect, it } from 'vitest';
import { catalogoArte } from '../src/arte/catalogo';
import { COSAS_LONCHERA, RECORRIDO_BICI } from '../src/aventuras/datos';
import { TEXTOS_AVENTURAS } from '../src/contenido/aventuras';

const ARTE = new Set(catalogoArte().map((a) => a.clave));

describe('aventura 4: en bici a la escuela', () => {
  it('el recorrido va en orden y nunca pone humo en los dos carriles a la vez', () => {
    for (let i = 1; i < RECORRIDO_BICI.length; i++) {
      const antes = RECORRIDO_BICI[i - 1]!;
      const ahora = RECORRIDO_BICI[i]!;
      expect(ahora.t).toBeGreaterThan(antes.t);
      // Dos nubes seguidas en carriles distintos: debe dar tiempo de cambiarse (más de 1.5 s).
      if (antes.tipo === 'humo' && ahora.tipo === 'humo' && antes.carril !== ahora.carril) expect(ahora.t - antes.t).toBeGreaterThan(1.5);
    }
  });

  it('hay hojitas y humo en los dos carriles (cambiarse siempre vale la pena)', () => {
    for (const tipo of ['hojita', 'humo'] as const)
      for (const carril of ['arriba', 'abajo'] as const) expect(RECORRIDO_BICI.some((c) => c.tipo === tipo && c.carril === carril)).toBe(true);
  });
});

describe('aventura 5: mi lonchera sin basura', () => {
  it('cada cosa tiene dibujo, pregunta y explicación, y hay de los dos tipos', () => {
    const t = TEXTOS_AVENTURAS.u5;
    for (const c of COSAS_LONCHERA) {
      expect(ARTE.has(c.clave), c.clave).toBe(true);
      expect(t.preguntas[c.id]).toMatch(/\?$/);
      expect(t.porque[c.id].length).toBeGreaterThan(5);
    }
    expect(new Set(COSAS_LONCHERA.map((c) => c.id)).size).toBe(Object.keys(t.preguntas).length);
    expect(COSAS_LONCHERA.filter((c) => c.reutilizable).length).toBeGreaterThanOrEqual(3);
    expect(COSAS_LONCHERA.filter((c) => !c.reutilizable).length).toBeGreaterThanOrEqual(3);
  });

  it('nunca aparecen tres del mismo tipo seguidas (no se adivina por patrón)', () => {
    for (let i = 2; i < COSAS_LONCHERA.length; i++) {
      const tres = COSAS_LONCHERA.slice(i - 2, i + 1).map((c) => c.reutilizable);
      expect(new Set(tres).size).toBeGreaterThan(1);
    }
  });
});

describe('arte de las aventuras', () => {
  it.each(['bici', 'humo', 'hojita', 'escuela', 'calle', 'regadera', 'arbol', 'brote', 'arbolito', 'hoyo', 'lonchera', 'carita-triste', 'tlacuache', 'anillos', 'bolsa-plastico'])(
    '"%s" existe',
    (clave) => expect(ARTE.has(clave)).toBe(true),
  );
});
