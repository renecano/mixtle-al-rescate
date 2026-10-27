import { describe, expect, it } from 'vitest';
import { RESIDUOS } from '../src/data/residuos';
import { crearAleatorio, repartir } from '../src/logica/reparto';
import { ZONAS } from '../src/ui/layoutParque';

describe('reparto de la basura en el parque', () => {
  const zonas = ZONAS.map((z) => z.reparto);

  it('el aleatorio con semilla es reproducible y está en [0, 1)', () => {
    const a = crearAleatorio(42);
    const b = crearAleatorio(42);
    for (let i = 0; i < 100; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it.each([1, 2, 3, 42, 1234, 99999])('semilla %i: todos dentro de su zona, sin encimarse ni tapar animales', (semilla) => {
    const colocados = repartir(RESIDUOS, zonas, crearAleatorio(semilla));
    expect(colocados).toHaveLength(RESIDUOS.length);
    for (const c of colocados) {
      const { rect, evitar = [] } = zonas[c.zona]!;
      expect(c.x).toBeGreaterThanOrEqual(rect.x);
      expect(c.x).toBeLessThanOrEqual(rect.x + rect.ancho);
      expect(c.y).toBeGreaterThanOrEqual(rect.y);
      expect(c.y).toBeLessThanOrEqual(rect.y + rect.alto);
      for (const e of evitar) expect(Math.hypot(e.x - c.x, e.y - c.y)).toBeGreaterThanOrEqual(e.r - 1);
      for (const otro of colocados) {
        if (otro === c) continue;
        // Las piezas miden ~124 px: con 110 px entre centros apenas se tocan.
        expect(Math.hypot(otro.x - c.x, otro.y - c.y)).toBeGreaterThanOrEqual(110);
      }
    }
  });

  it('reparte por turnos: cada zona recibe la misma cantidad (±1)', () => {
    const colocados = repartir(RESIDUOS, zonas, crearAleatorio(5));
    const porZona = zonas.map((_, i) => colocados.filter((c) => c.zona === i).length);
    expect(Math.max(...porZona) - Math.min(...porZona)).toBeLessThanOrEqual(1);
  });

  it('las zonas no se enciman entre sí', () => {
    for (let i = 0; i < zonas.length; i++) {
      for (let j = i + 1; j < zonas.length; j++) {
        const a = zonas[i]!.rect;
        const b = zonas[j]!.rect;
        const separadas = a.x + a.ancho <= b.x || b.x + b.ancho <= a.x || a.y + a.alto <= b.y || b.y + b.alto <= a.y;
        expect(separadas).toBe(true);
      }
    }
  });

  it('sin zonas no reparte nada', () => {
    expect(repartir(RESIDUOS, [], crearAleatorio(1))).toEqual([]);
  });
});
