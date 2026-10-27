import { describe, expect, it } from 'vitest';
import { NOMBRES_DIBUJOS_RESIDUOS, esArchivo } from '../src/arte/residuos';
import { CATEGORIAS } from '../src/data/categorias';
import { RESIDUOS } from '../src/data/residuos';
import { categoriaDe, validarConfiguracion } from '../src/logica/clasificacion';

describe('residuos', () => {
  it('hay unos 12 residuos con id único', () => {
    expect(RESIDUOS.length).toBeGreaterThanOrEqual(10);
    expect(RESIDUOS.length).toBeLessThanOrEqual(16);
    expect(new Set(RESIDUOS.map((r) => r.id)).size).toBe(RESIDUOS.length);
  });

  it.each(RESIDUOS.map((r) => [r.id, r] as const))('%s tiene una categoría válida (va a exactamente un bote)', (_id, r) => {
    const categoria = categoriaDe(r, CATEGORIAS);
    expect(categoria).not.toBeNull();
    expect(CATEGORIAS.map((c) => c.id)).toContain(categoria!.id);
  });

  it.each(RESIDUOS.map((r) => [r.id, r] as const))('%s tiene nombre, imagen existente y un dato de una sola frase', (_id, r) => {
    expect(r.nombre).toMatch(/^(el|la|los|las) \S/);
    if (!esArchivo(r.imagen)) expect(NOMBRES_DIBUJOS_RESIDUOS).toContain(r.imagen);
    expect(r.dato.trim()).toMatch(/[.!]$/);
    // Una sola frase: un solo punto final y nada de puntos en medio.
    expect(r.dato.trim().slice(0, -1)).not.toMatch(/[.!?]\s/);
    expect(r.dato.split(/\s+/).length).toBeLessThanOrEqual(18);
  });

  it('hay residuos de cada bote para que todos se usen', () => {
    for (const c of CATEGORIAS) {
      expect(RESIDUOS.some((r) => categoriaDe(r, CATEGORIAS)?.id === c.id)).toBe(true);
    }
  });
});

describe('categorías', () => {
  it('la configuración por defecto es válida (3 botes)', () => {
    expect(CATEGORIAS).toHaveLength(3);
    expect(validarConfiguracion(CATEGORIAS, RESIDUOS)).toEqual([]);
  });

  it('cada bote lleva color con buen contraste para texto blanco e ícono', () => {
    const luminancia = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) =>
        c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
      ) as [number, number, number];
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    for (const c of CATEGORIAS) {
      const contraste = 1.05 / (luminancia(c.color) + 0.05);
      expect(contraste, `${c.id} ${c.color}`).toBeGreaterThanOrEqual(4.5);
      expect(c.icono).toBeTruthy();
    }
  });

  it('no hay dos botes con el mismo ícono ni el mismo color (nada depende solo del color)', () => {
    expect(new Set(CATEGORIAS.map((c) => c.icono)).size).toBe(CATEGORIAS.length);
    expect(new Set(CATEGORIAS.map((c) => c.color.toLowerCase())).size).toBe(CATEGORIAS.length);
  });
});
