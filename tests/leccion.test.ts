import { describe, expect, it } from 'vitest';
import type { Ejercicio, Leccion } from '../src/contenido/tipos';
import {
  avance,
  cruzaLaMitad,
  ejercicioActual,
  hitoDeRacha,
  HITOS_RACHA,
  hojitasGanadas,
  HOJITAS_POR_LECCION,
  iniciarLeccion,
  registrarAcierto,
  registrarError,
  resumenLeccion,
  terminada,
  totalEjercicios,
} from '../src/logica/leccion';

const ej = (id: string): Ejercicio => ({
  tipo: 'si-no',
  id,
  consigna: `¿${id}?`,
  pista: 'Pista.',
  arte: 'mixtle',
  respuesta: true,
  porque: 'Porque sí.',
});
const leccion: Leccion = { id: 'l', titulo: 'L', arte: 'mixtle', bienvenida: '¡Hola!', ejercicios: ['a', 'b', 'c'].map(ej) };

describe('motor de lecciones', () => {
  it('sin errores: avanza en orden, todo a la primera', () => {
    let s = iniciarLeccion(leccion);
    expect(ejercicioActual(s)?.id).toBe('a');
    expect(avance(s)).toBe(0);
    s = registrarAcierto(s);
    s = registrarAcierto(s);
    expect(avance(s)).toBeCloseTo(2 / 3);
    s = registrarAcierto(s);
    expect(terminada(s)).toBe(true);
    expect(resumenLeccion(s)).toEqual({ ejercicios: 3, aLaPrimera: 3, hojitas: HOJITAS_POR_LECCION + 3 });
  });

  it('un error no castiga: se reintenta ahí mismo y además vuelve al final para repasar', () => {
    let s = iniciarLeccion(leccion);
    s = registrarError(s); // falla "a"
    expect(ejercicioActual(s)?.id).toBe('a'); // se queda para intentar otra vez
    expect(totalEjercicios(s)).toBe(4); // y se agregó un repaso
    s = registrarAcierto(s); // "a" ya bien
    s = registrarAcierto(s); // b
    s = registrarAcierto(s); // c
    expect(ejercicioActual(s)?.id).toBe('a'); // repaso al final
    s = registrarAcierto(s);
    expect(terminada(s)).toBe(true);
    expect(s.aLaPrimera).toBe(2);
    expect(hojitasGanadas(s)).toBe(HOJITAS_POR_LECCION + 2);
  });

  it('varios errores en el mismo ejercicio agregan un solo repaso', () => {
    let s = iniciarLeccion(leccion);
    s = registrarError(s);
    s = registrarError(s);
    s = registrarError(s);
    expect(totalEjercicios(s)).toBe(4);
    expect(s.erroresActual).toBe(3);
    s = registrarAcierto(s);
    expect(s.erroresActual).toBe(0);
  });

  it('fallar el repaso no agrega más repasos (la lección siempre termina)', () => {
    let s = iniciarLeccion({ ...leccion, ejercicios: [ej('a')] });
    s = registrarError(s);
    s = registrarAcierto(s);
    s = registrarError(s); // falla otra vez en el repaso
    s = registrarError(s);
    expect(totalEjercicios(s)).toBe(2);
    s = registrarAcierto(s);
    expect(terminada(s)).toBe(true);
  });

  it('la barra de progreso nunca retrocede de golpe ni pasa de 1', () => {
    let s = iniciarLeccion(leccion);
    const valores: number[] = [avance(s)];
    for (const paso of ['ok', 'mal', 'ok', 'ok', 'ok'] as const) {
      s = paso === 'ok' ? registrarAcierto(s) : registrarError(s);
      valores.push(avance(s));
    }
    expect(Math.max(...valores)).toBeLessThanOrEqual(1);
    expect(valores.at(-1)).toBe(1);
  });

  it('acciones sobre una lección terminada no hacen nada', () => {
    let s = iniciarLeccion({ ...leccion, ejercicios: [] });
    expect(terminada(s)).toBe(true);
    expect(registrarError(s)).toBe(s);
    expect(registrarAcierto(s)).toBe(s);
    s = registrarAcierto(s);
    expect(avance(s)).toBe(1);
  });
});

describe('racha dentro de la lección y mitad de la barra (v3)', () => {
  const larga: Leccion = { ...leccion, ejercicios: ['a', 'b', 'c', 'd', 'e', 'f'].map(ej) };

  it('la racha sube con cada acierto a la primera y celebra en 3, 5, 7 y 10', () => {
    let s = iniciarLeccion(larga);
    const rachas: number[] = [];
    for (let i = 0; i < 5; i++) {
      s = registrarAcierto(s);
      rachas.push(s.racha);
    }
    expect(rachas).toEqual([1, 2, 3, 4, 5]);
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(hitoDeRacha).filter((x) => x !== null)).toEqual([...HITOS_RACHA]);
  });

  it('un error la regresa a cero, y un acierto después de un error no la cuenta', () => {
    let s = registrarAcierto(registrarAcierto(iniciarLeccion(larga)));
    expect(s.racha).toBe(2);
    s = registrarError(s);
    expect(s.racha).toBe(0);
    s = registrarAcierto(s); // el mismo ejercicio, ya no a la primera
    expect(s.racha).toBe(0);
    s = registrarAcierto(s);
    expect(s.racha).toBe(1);
  });

  it('cruzar la mitad se detecta una sola vez', () => {
    let s = iniciarLeccion(larga);
    const cruces: boolean[] = [];
    for (let i = 0; i < 6; i++) {
      const n = registrarAcierto(s);
      cruces.push(cruzaLaMitad(s, n));
      s = n;
    }
    expect(cruces.filter(Boolean)).toHaveLength(1);
    expect(cruces.indexOf(true)).toBe(2); // del 2/6 al 3/6
  });
});
