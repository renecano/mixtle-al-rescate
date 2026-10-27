import { describe, expect, it } from 'vitest';
import { RECETAS, type Nota } from '../src/servicios/recetasSonido';

describe('recetas de sonido', () => {
  const todas = Object.entries(RECETAS) as [string, Nota[]][];

  it.each(todas)('%s tiene notas válidas y cortas', (_nombre, notas) => {
    expect(notas.length).toBeGreaterThan(0);
    for (const n of notas) {
      expect(n.t).toBeGreaterThanOrEqual(0);
      expect(n.d).toBeGreaterThan(0);
      expect(n.f).toBeGreaterThan(20);
      expect(n.f).toBeLessThan(12000);
      // Volumen moderado: el juego se proyecta en un salón.
      expect(n.vol).toBeGreaterThan(0);
      expect(n.vol).toBeLessThanOrEqual(0.4);
      if (n.f2 !== undefined) expect(n.f2).toBeGreaterThan(20);
    }
    const duracion = Math.max(...notas.map((n) => n.t + n.d));
    expect(duracion).toBeLessThanOrEqual(2);
  });
});
