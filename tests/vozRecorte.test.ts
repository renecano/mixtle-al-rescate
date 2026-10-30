import { describe, expect, it } from 'vitest';
import { esTextoCorto, firmas } from '../scripts/voz/firmas.mjs';
import { TEXTOS_AVENTURAS } from '../src/contenido/aventuras';
import { cyrb53 } from '../src/voz/hash';
import { todasLasFrases } from '../src/voz/frases';
import { numeroEnPalabras, textoDeLocucion, textoHablado } from '../src/voz/locucion';

/*
 * Lo que corrige el silencio de la voz (revisión de René: 32 % de silencio en 16 audios al azar):
 * las frases con dos puntos se reescriben de corrido, y la normalización recorta el silencio sin
 * volver a pedir nada a Azure.
 */

const CONFIG = {
  proveedor: 'azure',
  voz: 'es-MX-Alejo:MAI-Voice-2-Flash',
  ajustes: { idioma: 'es-MX', estilo: 'excited', tono: '+0%', velocidad: 1, esperaMs: 3100 },
  normalizacion: { $comentario: 'x', umbralDb: -50, bordeS: 0.08, pausaMaximaS: 0.5, pausaS: 0.35 },
};

describe('firmas de los audios', () => {
  it('cambiar solo la normalización cambia el archivo final, pero no la firma con la que se reusa el original de Azure', () => {
    const antes = firmas(CONFIG, 'tres', cyrb53);
    const despues = firmas({ ...CONFIG, normalizacion: { ...CONFIG.normalizacion, pausaS: 0.3 } }, 'tres', cyrb53);
    expect(despues.firma).not.toBe(antes.firma);
    expect(despues.firmaAzure).toBe(antes.firmaAzure);
  });

  it('cambiar la voz, un ajuste o el texto cambia las dos firmas; los comentarios no cambian nada', () => {
    const base = firmas(CONFIG, 'tres', cyrb53);
    for (const otra of [
      { ...CONFIG, voz: 'es-MX-JorgeNeural' },
      { ...CONFIG, ajustes: { ...CONFIG.ajustes, estilo: '' } },
    ]) {
      const f = firmas(otra, 'tres', cyrb53);
      expect(f.firma).not.toBe(base.firma);
      expect(f.firmaAzure).not.toBe(base.firmaAzure);
    }
    expect(firmas(CONFIG, 'cuatro', cyrb53).firmaAzure).not.toBe(base.firmaAzure);
    expect(firmas({ ...CONFIG, normalizacion: { ...CONFIG.normalizacion, $comentario: 'otro' } }, 'tres', cyrb53)).toEqual(base);
  });

  it('la firma de Azure es la fórmula anterior (proveedor, voz, ajustes y texto): los originales guardados siguen valiendo', () => {
    const { proveedor, voz, ajustes } = CONFIG;
    expect(firmas(CONFIG, 'tres', cyrb53).firmaAzure).toBe(cyrb53(JSON.stringify({ proveedor, voz, ajustes, texto: 'tres' })));
  });

  it('solo los textos de hasta tres palabras cuentan como cortos (en ellos un sonido tras una pausa larga no es texto)', () => {
    expect(esTextoCorto('tres')).toBe(true);
    expect(esTextoCorto('sesenta y un')).toBe(true);
    expect(esTextoCorto('¡Un cofre! Trae')).toBe(true);
    expect(esTextoCorto('residuos y ayudaron a')).toBe(false);
  });
});

describe('números antes de un sustantivo femenino', () => {
  it('"una", "veintiuna", "treinta y una"; los demás no cambian', () => {
    expect(numeroEnPalabras(1, false, true)).toBe('una');
    expect(numeroEnPalabras(21, false, true)).toBe('veintiuna');
    expect(numeroEnPalabras(31, false, true)).toBe('treinta y una');
    expect(numeroEnPalabras(2, false, true)).toBe('dos');
    expect(numeroEnPalabras(11, false, true)).toBe('once');
    expect(numeroEnPalabras(1, true)).toBe('un');
  });

  it('las piezas femeninas que cambian tienen su frase registrada para encadenar', () => {
    const textos = new Set(todasLasFrases().map((f) => f.texto));
    for (const n of [1, 21, 31, 41, 51, 61, 71, 81, 91]) expect(textos).toContain(numeroEnPalabras(n, false, true));
  });
});

describe('el diploma de la unidad 4 (bici) se dice de corrido', () => {
  const narrar = (h: number, n: number) => textoHablado(TEXTOS_AVENTURAS.u4.diploma.narracion(h, n));

  it('junta las dos cuentas en una oración, sin dos puntos', () => {
    expect(narrar(10, 7)).toBe('¡Felicidades, guardianes del aire! Juntaron diez hojitas y esquivaron siete nubes de humo. ¡Bravo!');
    expect(narrar(1, 1)).toBe('¡Felicidades, guardianes del aire! Juntaron una hojita y esquivaron una nube de humo. ¡Bravo!');
    expect(textoDeLocucion(TEXTOS_AVENTURAS.u4.diploma.narracion(2, 1))).toBe('¡Felicidades, guardianes del aire! Juntaron 2 hojitas y esquivaron 1 nube de humo. ¡Bravo!');
  });

  it('con cero no dice "cero": anima para la próxima vez', () => {
    expect(narrar(0, 7)).toBe('¡Felicidades, guardianes del aire! Esquivaron siete nubes de humo. ¡La próxima vez, a juntar muchas hojitas!');
    expect(narrar(10, 0)).toBe('¡Felicidades, guardianes del aire! Juntaron diez hojitas. ¡La próxima vez, a esquivar el humo!');
    expect(narrar(0, 0)).toBe('¡Felicidades, guardianes del aire! Llegaron a la escuela en bici. ¡La próxima vez, a juntar hojitas y esquivar el humo!');
    for (const [h, n] of [[0, 7], [10, 0], [0, 0]] as const) expect(narrar(h, n)).not.toMatch(/\bcero\b/);
  });

  it('ninguna frase narrada pone dos puntos antes de un número (eso dejaba pausas largas)', () => {
    const numeros = /: (cero|un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieci|veint|treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa|cien)/;
    expect(todasLasFrases().filter((f) => numeros.test(f.texto)).map((f) => f.texto)).toEqual([]);
  });
});
