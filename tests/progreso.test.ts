import { describe, expect, it } from 'vitest';
import { ANIMALES } from '../src/data/animales';
import { Progreso, progreso, reiniciarProgreso, resumenDiploma } from '../src/logica/progreso';

describe('progreso de la partida', () => {
  it('empieza en cero', () => {
    expect(resumenDiploma(new Progreso(), ANIMALES)).toEqual({ residuosSeparados: 0, animalesAyudados: 0, plantados: 0 });
  });

  it('no cuenta dos veces el mismo residuo', () => {
    const p = new Progreso();
    p.recolectar('lata');
    p.recolectar('lata');
    p.separar('lata');
    p.separar('lata');
    expect(p.recolectados).toEqual(['lata']);
    expect(resumenDiploma(p, ANIMALES).residuosSeparados).toBe(1);
  });

  it('solo se puede separar lo que se recogió', () => {
    const p = new Progreso();
    p.separar('botella');
    expect(p.separados.size).toBe(0);
  });

  it('sembrar cuenta plantas y mariposas que llegan (nunca negativas)', () => {
    const p = new Progreso();
    p.plantar(1);
    p.plantar(0);
    p.plantar(-3);
    expect(p.plantados).toBe(3);
    expect(p.mariposasNuevas).toBe(1);
  });

  it('reiniciar deja una partida nueva', () => {
    progreso().recolectar('lata');
    const nuevo = reiniciarProgreso();
    expect(nuevo.recolectados).toEqual([]);
    expect(progreso()).toBe(nuevo);
  });
});
