import { describe, expect, it } from 'vitest';
import { ORDEN_ESCENAS, escenaSiguiente } from '../src/logica/flujo';
import { TEXTOS } from '../src/data/textos';

describe('flujo del juego', () => {
  it('sigue el orden del guion', () => {
    expect(ORDEN_ESCENAS).toEqual(['Inicio', 'Intro', 'Nivel1', 'Nivel2', 'Nivel3', 'Bonus', 'Final']);
    expect(escenaSiguiente('Inicio')).toBe('Intro');
    expect(escenaSiguiente('Nivel3')).toBe('Bonus');
    expect(escenaSiguiente('Bonus')).toBe('Final');
  });

  it('después del final se puede volver a jugar desde el inicio', () => {
    expect(escenaSiguiente('Final')).toBe('Inicio');
  });

  it('la intro tiene como máximo 3 frases cortas', () => {
    expect(TEXTOS.intro.length).toBeLessThanOrEqual(3);
    for (const frase of TEXTOS.intro) expect(frase.split(/\s+/).length).toBeLessThanOrEqual(12);
  });
});
