import { describe, expect, it } from 'vitest';
import { guardarSonidoActivo, leerSonidoActivo } from '../src/servicios/preferencias';

function almacenEnMemoria() {
  const datos = new Map<string, string>();
  return {
    datos,
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, v),
  };
}

const almacenQueFalla = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
};

describe('preferencia de sonido', () => {
  it('el sonido está activo por defecto', () => {
    expect(leerSonidoActivo(almacenEnMemoria())).toBe(true);
  });

  it('recuerda que se silenció y que se volvió a activar', () => {
    const almacen = almacenEnMemoria();
    guardarSonidoActivo(false, almacen);
    expect(leerSonidoActivo(almacen)).toBe(false);
    guardarSonidoActivo(true, almacen);
    expect(leerSonidoActivo(almacen)).toBe(true);
  });

  it('guarda una sola clave y nada más', () => {
    const almacen = almacenEnMemoria();
    guardarSonidoActivo(false, almacen);
    expect([...almacen.datos.keys()]).toEqual(['caco-al-rescate:sonido']);
  });

  it('no rompe el juego si localStorage lanza errores o no existe', () => {
    expect(() => guardarSonidoActivo(false, almacenQueFalla)).not.toThrow();
    expect(leerSonidoActivo(almacenQueFalla)).toBe(true);
    expect(leerSonidoActivo(null)).toBe(true);
    expect(() => guardarSonidoActivo(true, null)).not.toThrow();
  });
});
