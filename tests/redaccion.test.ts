import { describe, expect, it } from 'vitest';
import { CATEGORIAS, NOMBRE_DEL_ICONO, type Categoria, type IconoCategoria } from '../src/data/categorias';
import { RESIDUOS } from '../src/data/residuos';
import { TEXTOS } from '../src/data/textos';
import { conDe, descripcionBote, textoPista } from '../src/logica/clasificacion';

/** "de el" y "a el" deben contraerse a "del" y "al". */
const SIN_CONTRAER = /\b(de|a) el\b/i;

/** Junta todas las frases (también las que son funciones) de un objeto de textos. */
function frases(valor: unknown): string[] {
  if (typeof valor === 'string') return [valor];
  if (typeof valor === 'function') return frases((valor as (...a: unknown[]) => unknown)('la lata', 'la lata'));
  if (Array.isArray(valor)) return valor.flatMap(frases);
  if (valor && typeof valor === 'object') return Object.values(valor).flatMap(frases);
  return [];
}

describe('redacción de las pistas', () => {
  it.each(CATEGORIAS.map((c) => [c.id, c] as const))('la pista de "%s" contrae, nombra el color y el ícono', (_id, c) => {
    const pista = textoPista(c);
    expect(pista).not.toMatch(SIN_CONTRAER);
    expect(pista).toContain(c.nombreColor);
    const icono = NOMBRE_DEL_ICONO[c.icono].replace(/^(el|la|los|las)\s/, '');
    expect(pista).toContain(icono);
    expect(pista.trim()).toMatch(/\.$/);
  });

  it('las pistas por defecto suenan como se espera en voz alta', () => {
    expect(CATEGORIAS.map(textoPista)).toEqual([
      '¡Casi! Viene de una planta o de un animal y se puede volver tierra. Busca el bote verde con el dibujo de la hojita.',
      '¡Casi! Se puede convertir en algo nuevo. Busca el bote azul con el dibujo de las flechas.',
      '¡Casi! Este ya no se puede reciclar. Busca el bote naranja con el dibujo del bote de basura.',
    ]);
  });

  it('todos los íconos posibles producen descripciones bien contraídas', () => {
    for (const icono of Object.keys(NOMBRE_DEL_ICONO) as IconoCategoria[]) {
      const c: Categoria = { ...CATEGORIAS[0]!, icono };
      expect(descripcionBote(c)).not.toMatch(SIN_CONTRAER);
    }
  });

  it('conDe aplica la contracción solo con "el"', () => {
    expect(conDe('el bote de basura')).toBe('del bote de basura');
    expect(conDe('la hojita')).toBe('de la hojita');
    expect(conDe('las flechas')).toBe('de las flechas');
    expect(conDe('elote')).toBe('de elote');
  });
});

describe('redacción de todo lo que dice Caco', () => {
  const todas = [...frases(TEXTOS), ...RESIDUOS.map((r) => r.dato), ...CATEGORIAS.map((c) => c.pista)];

  it.each(todas.map((f) => [f]))('"%s" no tiene "de el" ni "a el"', (frase) => {
    expect(frase).not.toMatch(SIN_CONTRAER);
  });
});
