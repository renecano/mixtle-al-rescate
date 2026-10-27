import { describe, expect, it } from 'vitest';
import { arteBote, arteTapa, oscurecer } from '../src/arte/botes';
import { CATEGORIAS, NOMBRE_DEL_ICONO, type Categoria, type IconoCategoria } from '../src/data/categorias';
import { enFila } from '../src/logica/disposicion';

describe('botes en fila', () => {
  it.each([2, 3, 4])('%i botes caben sin encimarse y con al menos 220 px cada uno', (n) => {
    const { xs, ancho } = enFila(n, 560, 1880, 300);
    expect(xs).toHaveLength(n);
    expect(ancho).toBeGreaterThanOrEqual(220);
    for (let i = 1; i < xs.length; i++) expect(xs[i]! - xs[i - 1]!).toBeGreaterThan(ancho);
    expect(xs[0]! - ancho / 2).toBeGreaterThanOrEqual(560);
    expect(xs[n - 1]! + ancho / 2).toBeLessThanOrEqual(1880);
  });

  it('sin botes no hay fila', () => {
    expect(enFila(0, 0, 100, 50)).toEqual({ xs: [], ancho: 0 });
  });
});

describe('arte de botes', () => {
  it('oscurecer conserva el formato #RRGGBB', () => {
    expect(oscurecer('#FFFFFF', 50)).toBe('#808080');
    expect(oscurecer('#1F6B4A', 0).toLowerCase()).toBe('#1f6b4a');
  });

  const iconos = Object.keys(NOMBRE_DEL_ICONO) as IconoCategoria[];
  it.each(iconos)('el ícono "%s" produce un bote SVG válido', (icono) => {
    const cat: Categoria = { ...CATEGORIAS[0]!, id: `prueba-${icono}`, icono };
    for (const pieza of [arteBote(cat), arteTapa(cat)]) {
      const doc = new DOMParser().parseFromString(pieza.svg, 'image/svg+xml');
      expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
    }
    expect(arteBote(cat).svg).toContain(cat.color);
    expect(arteTapa(cat).svg).toContain(oscurecer(cat.color, 18));
  });
});
