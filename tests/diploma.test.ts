import { describe, expect, it } from 'vitest';
import { ANIMALES } from '../src/data/animales';
import { CATEGORIAS } from '../src/data/categorias';
import { RESIDUOS } from '../src/data/residuos';
import { TEXTOS } from '../src/data/textos';
import { esCorrecto } from '../src/logica/clasificacion';
import { Progreso, resumenDiploma } from '../src/logica/progreso';
import { ZONAS } from '../src/ui/layoutParque';

/** Simula una partida completa como la juega un grupo. */
function partidaCompleta(): Progreso {
  const p = new Progreso();
  // Nivel 1: se recoge todo y quedan felices los tres animales.
  RESIDUOS.forEach((r) => p.recolectar(r.id));
  ANIMALES.forEach((a) => p.ayudarAnimal(a.id));
  // Nivel 2: un intento fallido no cuenta; solo cuenta cuando llega a su bote.
  for (const r of RESIDUOS) {
    const incorrecta = CATEGORIAS.find((c) => !esCorrecto(r, c.id, CATEGORIAS))!;
    if (esCorrecto(r, incorrecta.id, CATEGORIAS)) p.separar(r.id); // nunca pasa
    const correcta = CATEGORIAS.find((c) => esCorrecto(r, c.id, CATEGORIAS))!;
    if (esCorrecto(r, correcta.id, CATEGORIAS)) p.separar(r.id);
  }
  // Nivel 3: cada flor atrae una mariposa; los árboles no.
  for (const z of ZONAS) for (const lugar of z.plantar) p.plantar(lugar.que === 'flores' ? 1 : 0);
  return p;
}

describe('conteo del diploma', () => {
  it('una partida completa cuenta los 12 residuos y todos los animales', () => {
    const p = partidaCompleta();
    const flores = ZONAS.flatMap((z) => z.plantar).filter((l) => l.que === 'flores').length;
    const animalesBase = ANIMALES.reduce((s, a) => s + a.cantidad, 0);
    expect(resumenDiploma(p, ANIMALES)).toEqual({
      residuosSeparados: RESIDUOS.length,
      animalesAyudados: animalesBase + flores,
      plantados: ZONAS.flatMap((z) => z.plantar).length,
    });
    // Con los datos actuales: 12 residuos; ardilla + colibrí + 3 mariposas + 5 mariposas nuevas.
    expect(resumenDiploma(p, ANIMALES).residuosSeparados).toBe(12);
    expect(resumenDiploma(p, ANIMALES).animalesAyudados).toBe(10);
  });

  it('los aciertos del bonus se suman a los residuos separados', () => {
    const p = partidaCompleta();
    p.separarEnBonus('camara-1');
    p.separarEnBonus('camara-2');
    p.separarEnBonus('camara-2');
    expect(resumenDiploma(p, ANIMALES).residuosSeparados).toBe(14);
  });

  it('solo cuentan los animales de zonas limpias', () => {
    const p = new Progreso();
    p.ayudarAnimal('mariposas');
    expect(resumenDiploma(p, ANIMALES).animalesAyudados).toBe(3);
    p.ayudarAnimal('ardilla');
    p.ayudarAnimal('ardilla');
    expect(resumenDiploma(p, ANIMALES).animalesAyudados).toBe(4);
  });

  it('separar algo que no se recogió no suma', () => {
    const p = new Progreso();
    p.separar('lata');
    expect(resumenDiploma(p, ANIMALES).residuosSeparados).toBe(0);
  });
});

describe('textos del diploma', () => {
  it('usa singular y plural correctos', () => {
    expect(TEXTOS.diploma.residuos(1)).toBe('residuo bien separado');
    expect(TEXTOS.diploma.residuos(12)).toBe('residuos bien separados');
    expect(TEXTOS.diploma.animales(1)).toBe('animal ayudado');
    expect(TEXTOS.diploma.animales(0)).toBe('animales ayudados');
    expect(TEXTOS.diploma.narracion(12, 10)).toBe(
      '¡Felicidades, guardianes del parque! Separaron bien 12 residuos y ayudaron a 10 animales.',
    );
    expect(TEXTOS.diploma.narracion(1, 1)).toContain('1 residuo y ayudaron a 1 animal.');
  });
});
