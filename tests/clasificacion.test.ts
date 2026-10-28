import { describe, expect, it } from 'vitest';
import { CATEGORIAS, type Categoria } from '../src/data/categorias';
import { RESIDUOS } from '../src/data/residuos';
import { categoriaDe, esCorrecto, textoAcierto, textoPista, validarConfiguracion } from '../src/logica/clasificacion';

const base = (id: string, acepta: Categoria['acepta'], extra: Partial<Categoria> = {}): Categoria => ({
  id,
  nombre: id,
  color: '#6345A8',
  nombreColor: 'morado',
  icono: 'basura',
  pista: 'Pista.',
  acepta,
  ...extra,
});

const residuo = (id: string) => RESIDUOS.find((r) => r.id === id)!;

describe('clasificación con la configuración por defecto', () => {
  it('cada residuo es correcto solo en su bote', () => {
    for (const r of RESIDUOS) {
      const correctos = CATEGORIAS.filter((c) => esCorrecto(r, c.id, CATEGORIAS));
      expect(correctos).toHaveLength(1);
    }
  });

  it('ejemplos esperados', () => {
    expect(categoriaDe(residuo('platano'), CATEGORIAS)?.id).toBe('organico');
    expect(categoriaDe(residuo('lata'), CATEGORIAS)?.id).toBe('reciclable');
    expect(categoriaDe(residuo('popote'), CATEGORIAS)?.id).toBe('no-reciclable');
  });
});

describe('el juego funciona con 2 a 4 categorías cambiando solo categorias.ts', () => {
  it('2 botes: orgánico e inorgánico', () => {
    const dos = [base('organico', ['organico'], { icono: 'hoja' }), base('inorganico', ['reciclable', 'no-reciclable'])];
    expect(validarConfiguracion(dos, RESIDUOS)).toEqual([]);
    expect(categoriaDe(residuo('botella'), dos)?.id).toBe('inorganico');
    expect(categoriaDe(residuo('servilleta'), dos)?.id).toBe('inorganico');
    expect(categoriaDe(residuo('hojas'), dos)?.id).toBe('organico');
  });

  it('4 botes: papel y cartón aparte (el material gana sobre la categoría base)', () => {
    const cuatro = [
      ...CATEGORIAS,
      base('papel', ['papel'], { icono: 'papel', nombre: 'Papel y cartón' }),
    ];
    expect(validarConfiguracion(cuatro, RESIDUOS)).toEqual([]);
    expect(categoriaDe(residuo('periodico'), cuatro)?.id).toBe('papel');
    expect(categoriaDe(residuo('carton'), cuatro)?.id).toBe('papel');
    expect(categoriaDe(residuo('lata'), cuatro)?.id).toBe('reciclable');
  });

  it('detecta configuraciones que no sirven', () => {
    expect(validarConfiguracion([base('solo', ['organico'])], RESIDUOS).join(' ')).toMatch(/de 2 a 4/);
    const cinco = [...CATEGORIAS, base('a', ['papel']), base('b', ['metal'])];
    expect(validarConfiguracion(cinco, RESIDUOS).join(' ')).toMatch(/de 2 a 4/);
    const sinNoReciclable = CATEGORIAS.filter((c) => c.id !== 'no-reciclable');
    expect(validarConfiguracion(sinNoReciclable, RESIDUOS).join(' ')).toMatch(/Ningún bote acepta "servilleta"/);
    const ambigua = [...CATEGORIAS, base('otro-organico', ['organico'])];
    expect(validarConfiguracion(ambigua, RESIDUOS).join(' ')).toMatch(/varios botes/);
    expect(validarConfiguracion([...CATEGORIAS.slice(0, 2), base('organico', ['no-reciclable'])], RESIDUOS).join(' ')).toMatch(
      /repetida/,
    );
    expect(validarConfiguracion([base('x', ['organico'], { color: 'verde' }), CATEGORIAS[1]!, CATEGORIAS[2]!], RESIDUOS).join(' ')).toMatch(
      /color/,
    );
  });
});

describe('textos de Mixtle', () => {
  it('la pista es amable, corta y describe el bote con color e ícono', () => {
    const texto = textoPista(CATEGORIAS[0]!);
    expect(texto).toMatch(/^¡Casi!/);
    expect(texto).toContain('el bote verde de orgánico, con el dibujo de la hojita');
    expect(texto.split(/[.!?]\s/).length).toBeLessThanOrEqual(3);
    expect(texto).not.toMatch(/\b(mal|error|incorrecto|perdiste|equivocado)\b/i);
  });

  it('al acertar celebra y dice el dato curioso', () => {
    const r = residuo('lata');
    expect(textoAcierto(r, '¡Muy bien!')).toEqual(['¡Muy bien!', r.dato]);
  });
});
