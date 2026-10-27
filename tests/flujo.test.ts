import { describe, expect, it } from 'vitest';
import { ORDEN_ESCENAS, esEscena, escenaSiguiente } from '../src/logica/flujo';
import { TEXTOS } from '../src/data/textos';

describe('flujo de la aventura de la unidad 1', () => {
  it('sigue el orden de la v1', () => {
    expect(ORDEN_ESCENAS).toEqual(['Intro', 'Nivel1', 'Nivel2', 'Nivel3', 'Bonus', 'Final']);
    expect(escenaSiguiente('Intro')).toBe('Nivel1');
    expect(escenaSiguiente('Nivel3')).toBe('Bonus');
    expect(escenaSiguiente('Bonus')).toBe('Final');
  });

  it('reconoce solo claves de escena válidas', () => {
    expect(esEscena('Nivel2')).toBe(true);
    expect(esEscena('Inicio')).toBe(false);
    expect(esEscena(null)).toBe(false);
  });

  it('la intro tiene como máximo 3 frases cortas', () => {
    expect(TEXTOS.intro.length).toBeLessThanOrEqual(3);
    for (const frase of TEXTOS.intro) expect(frase.split(/\s+/).length).toBeLessThanOrEqual(12);
  });
});
