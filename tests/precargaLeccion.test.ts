import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prepararLeccion, primeraNarracion, soltarAlNarrar } from '../src/app/pantallas/precargaLeccion';
import { UNIDADES } from '../src/contenido/unidades';
import { descargaDetenidaHasta, RETENCION_MAXIMA_MS, retenerDescarga, soltarDescarga } from '../src/servicios/sinInternet';

/*
 * Abrir la primera lección rápido la primera vez (medido en docs/mediciones/carga-leccion-*.json con
 * scripts/medir-carga.mjs --leccion): al tocarla se adelanta lo primero que dice Mixtle y la descarga
 * en segundo plano espera hasta que el primer ejercicio esté en pantalla y narrando.
 */

const leccion = UNIDADES[0]!.lecciones[0]!;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(100_000);
  soltarDescarga();
});
afterEach(() => vi.useRealTimers());

describe('al tocar una lección', () => {
  it('lo primero que dice Mixtle es la bienvenida y la consigna del primer ejercicio (van en orden)', () => {
    expect(primeraNarracion(leccion)).toEqual([leccion.bienvenida, leccion.ejercicios[0]!.consigna]);
  });

  it('se adelanta esa narración y se retiene la descarga en segundo plano', () => {
    const vozFalsa = { precargar: vi.fn(async () => undefined) };
    expect(descargaDetenidaHasta()).toBeLessThanOrEqual(Date.now());
    prepararLeccion(leccion, vozFalsa);
    expect(vozFalsa.precargar).toHaveBeenCalledWith([[leccion.bienvenida, leccion.ejercicios[0]!.consigna]]);
    expect(descargaDetenidaHasta()).toBe(Date.now() + RETENCION_MAXIMA_MS);
  });
});

describe('la descarga retenida', () => {
  it('sigue en cuanto Mixtle se oye en el primer ejercicio', () => {
    retenerDescarga();
    const vozFalsa = { sonandoAhora: false };
    soltarAlNarrar(vozFalsa, Date.now);
    vi.advanceTimersByTime(500);
    expect(descargaDetenidaHasta()).toBeGreaterThan(Date.now());
    vozFalsa.sonandoAhora = true;
    vi.advanceTimersByTime(100);
    expect(descargaDetenidaHasta()).toBeLessThanOrEqual(Date.now());
  });

  it('si Mixtle no se oye (sin audio), sigue sola a los 3 s; y nunca se retiene más de 15 s', () => {
    retenerDescarga();
    soltarAlNarrar({ sonandoAhora: false }, Date.now);
    vi.advanceTimersByTime(2900);
    expect(descargaDetenidaHasta()).toBeGreaterThan(Date.now());
    vi.advanceTimersByTime(200);
    expect(descargaDetenidaHasta()).toBeLessThanOrEqual(Date.now());

    retenerDescarga();
    vi.advanceTimersByTime(RETENCION_MAXIMA_MS + 1);
    expect(descargaDetenidaHasta()).toBeLessThanOrEqual(Date.now());
  });
});
