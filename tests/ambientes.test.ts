import { describe, expect, it } from 'vitest';
import { AMBIENTES, ARTE_AMBIENTES } from '../src/arte/ambientes';
import { catalogoArte } from '../src/arte/catalogo';
import { ARTE_DECORACIONES, DECORACIONES } from '../src/arte/decoraciones';
import { UNIDADES } from '../src/contenido/unidades';

const claves = new Set([...catalogoArte(), ...ARTE_AMBIENTES, ...ARTE_DECORACIONES].map((a) => a.clave));

describe('identidad por unidad en el camino', () => {
  it('cada unidad tiene su ambiente (postal y paleta) y decoraciones a los dos lados, con arte que existe', () => {
    for (const u of UNIDADES) {
      const a = AMBIENTES[u.id];
      expect(a, u.id).toBeDefined();
      expect(claves.has(a!.arte)).toBe(true);
      const d = DECORACIONES[u.id]!;
      expect(d.izq.length).toBeGreaterThan(2);
      expect(d.der.length).toBeGreaterThan(2);
      for (const x of [...d.izq, ...d.der]) {
        expect(claves.has(x.arte), `${u.id}: ${x.arte}`).toBe(true);
        // Debajo de la postal y antes de la ola de la siguiente unidad.
        expect(x.arriba).toBeGreaterThanOrEqual(28);
        expect(x.arriba).toBeLessThanOrEqual(92);
      }
    }
  });

  it('la postal de la unidad 1 no repite el parque del grupo (que sale justo arriba)', () => {
    const postal = ARTE_AMBIENTES.find((a) => a.clave === 'ambiente-u1')!.svg;
    const parque = catalogoArte().find((a) => a.clave === 'parque')!.svg;
    expect(postal).not.toBe(parque);
    // Es la estación de reciclaje: los tres botes con sus colores, y sin el Nevado.
    for (const color of ['#1F6B4A', '#2459A6', '#B84A14']) expect(postal).toContain(color);
    expect(postal).not.toContain('#F7FBFF');
  });
});
