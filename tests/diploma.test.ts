import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TEXTOS_AVENTURAS } from '../src/contenido/aventuras';
import { ANIMALES } from '../src/data/animales';
import { CATEGORIAS } from '../src/data/categorias';
import { diplomaUnidad1, figurasRepetidas, segun } from '../src/logica/diploma';
import { Progreso } from '../src/logica/progreso';
import { textoDeLocucion } from '../src/voz/locucion';

describe('diploma de unidad', () => {
  it('singular y plural según el número', () => {
    expect(segun(1, 'animal', 'animales')).toBe('animal');
    expect(segun(0, 'animal', 'animales')).toBe('animales');
    expect(segun(7, 'animal', 'animales')).toBe('animales');
  });

  it('una figura por cada cosa contada', () => {
    expect(figurasRepetidas('arbol', 3)).toEqual(['arbol', 'arbol', 'arbol']);
    expect(figurasRepetidas('arbol', -1)).toEqual([]);
  });

  it('la unidad 1 conserva el diploma de la v1: residuos con los botes, animales con sus dibujos', () => {
    const p = new Progreso();
    p.recolectar('lata');
    p.separar('lata');
    p.ayudarAnimal('ardilla');
    const d = diplomaUnidad1(p, ANIMALES, CATEGORIAS);
    expect(d.subtitulo).toBeUndefined();
    expect(d.izquierda).toMatchObject({ numero: 1, etiqueta: 'residuo bien separado' });
    expect(d.izquierda.iconos).toEqual(CATEGORIAS.map((c) => `bote-${c.id}`));
    expect(d.derecha.figuras?.length).toBe(d.derecha.numero);
    expect(textoDeLocucion(d.narracion)).toContain('Separaron bien 1 residuo');
  });

  it.each(Object.entries(TEXTOS_AVENTURAS))('%s: el diploma narra los números con buena concordancia', (_id, t) => {
    expect(t.diploma.subtitulo.length).toBeGreaterThan(3);
    for (const [a, b] of [
      [1, 1],
      [2, 5],
    ] as const) {
      const texto = textoDeLocucion(t.diploma.narracion(a, b));
      expect(texto).toMatch(/[.!]$/);
      expect(texto).not.toMatch(/\b1 \w+s\b/); // nunca "1 animales"
      expect(t.diploma.izquierda(a).length).toBeGreaterThan(3);
      expect(t.diploma.derecha(b).length).toBeGreaterThan(3);
    }
  });
});

describe('contenido marcado para revisión de Eco Urban', () => {
  it('cada archivo de contenido lleva TODO(Eco Urban)', () => {
    const carpeta = join(__dirname, '../src/contenido/unidades');
    const archivos = readdirSync(carpeta)
      .filter((f) => f !== 'index.ts')
      .map((f) => join(carpeta, f));
    for (const archivo of [...archivos, join(__dirname, '../src/contenido/aventuras.ts')]) {
      expect(readFileSync(archivo, 'utf8'), archivo).toContain('TODO(Eco Urban)');
    }
  });
});
