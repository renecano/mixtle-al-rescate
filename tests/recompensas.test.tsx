import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DiplomaUnidad } from '../src/app/componentes/DiplomaUnidad';
import { TEXTOS_APP } from '../src/contenido/textosApp';
import { UNIDADES } from '../src/contenido/unidades';
import {
  ACCESORIOS,
  accesoriosPuestos,
  alternarPuesto,
  ANCLAS_MASCOTA,
  comprarAccesorio,
  faltanPara,
  hojitasDisponibles,
} from '../src/logica/accesorios';
import { completarAventura, completarLeccion, HOJITAS_COFRE, PROGRESO_VACIO, type ProgresoGrupo } from '../src/logica/camino';
import { datosDiplomaUnidad, fechaEnPalabras } from '../src/logica/diplomaUnidad';
import { MASCOTAS, nuevoGrupo } from '../src/logica/grupos';
import { textoHablado } from '../src/voz/locucion';

const HOY = '2026-10-28';
const u1 = UNIDADES[0]!;

/** Un progreso con la unidad 1 completa (todas las lecciones a la primera y su aventura). */
function unidad1Completa(): ProgresoGrupo {
  const p = u1.lecciones.reduce((acc, l) => completarLeccion(acc, l.id, { hojitas: 10 + l.ejercicios.length, aLaPrimera: l.ejercicios.length }, HOY), PROGRESO_VACIO);
  return completarAventura(p, u1, HOY);
}

describe('diploma de fin de unidad', () => {
  it('solo existe con la unidad terminada (no hay diplomas a medias)', () => {
    const grupo = nuevoGrupo({ mascota: 'ardilla', color: '#1F6B4A', etiqueta: '2°B' }, 'g1', 0);
    expect(datosDiplomaUnidad(grupo, u1, new Date(2026, 9, 28))).toBeNull();
    const conMedia = { ...grupo, progreso: completarLeccion(PROGRESO_VACIO, u1.lecciones[0]!.id, { hojitas: 12, aLaPrimera: 2 }, HOY) };
    expect(datosDiplomaUnidad(conMedia, u1, new Date(2026, 9, 28))).toBeNull();
  });

  it('cuenta el esfuerzo del grupo en esa unidad y lleva a su mascota vestida', () => {
    let progreso = unidad1Completa();
    progreso = comprarAccesorio(progreso, 'gorra');
    const grupo = { ...nuevoGrupo({ mascota: 'ardilla', color: '#1F6B4A', etiqueta: '2°B' }, 'g1', 0), progreso };
    const d = datosDiplomaUnidad(grupo, u1, new Date(2026, 9, 28))!;
    expect(d.grupo).toBe('Ardilla 2°B');
    expect(d.lecciones).toBe(u1.lecciones.length);
    expect(d.aLaPrimera).toBe(u1.lecciones.reduce((s, l) => s + l.ejercicios.length, 0));
    expect(d.hojitas).toBe(u1.lecciones.reduce((s, l) => s + 10 + l.ejercicios.length, 0));
    expect(d.puestos).toEqual(['gorra']);
    expect(d.estampa.nombre).toBe(u1.estampa.nombre);
    expect(d.fecha).toBe('28 de octubre de 2026');
  });

  it('se ve en pantalla con un botón para imprimir', () => {
    const grupo = { ...nuevoGrupo({ mascota: 'ajolote', color: '#2459A6', etiqueta: '' }, 'g2', 0), progreso: unidad1Completa() };
    const imprimir = vi.fn();
    window.print = imprimir;
    const cerrar = vi.fn();
    render(<DiplomaUnidad datos={datosDiplomaUnidad(grupo, u1, new Date(2026, 9, 28))!} alCerrar={cerrar} />);
    expect(screen.getByRole('dialog', { name: /Diploma: Ajolote/ })).toBeInTheDocument();
    expect(screen.getByText(u1.titulo)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Imprimir/ }));
    expect(imprimir).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(cerrar).toHaveBeenCalledTimes(1);
  });

  it('la fecha va en palabras', () => {
    expect(fechaEnPalabras(new Date(2026, 0, 6))).toBe('6 de enero de 2026');
  });
});

describe('cofre: lo que trae se sabe desde antes', () => {
  it('Mixtle dice cuántas hojitas trae antes de abrirlo, y al abrirlo no hay "sorpresa" de premio', () => {
    expect(textoHablado(TEXTOS_APP.cofre.llegaron(HOJITAS_COFRE))).toMatch(/Trae quince hojitas/);
    expect(textoHablado(TEXTOS_APP.cofre.abierto(HOJITAS_COFRE))).not.toMatch(/sorpresa/i);
  });
});

describe('accesorios de la mascota', () => {
  const conHojitas = (n: number): ProgresoGrupo => ({ ...PROGRESO_VACIO, hojitas: n });

  it('precios fijos y visibles, sin repetir, y cada mascota sabe dónde va cada accesorio', () => {
    expect(new Set(ACCESORIOS.map((a) => a.id)).size).toBe(ACCESORIOS.length);
    for (const a of ACCESORIOS) expect(a.precio).toBeGreaterThan(0);
    for (const m of MASCOTAS) for (const a of ACCESORIOS) expect(ANCLAS_MASCOTA[m.id][a.id]).toBeDefined();
  });

  it('se compra con hojitas suficientes y se pone sola', () => {
    let p = conHojitas(40);
    expect(faltanPara(p, 'mochila')).toBe(20);
    expect(comprarAccesorio(p, 'mochila')).toBe(p); // no alcanza: no cambia nada
    p = comprarAccesorio(p, 'gorra');
    expect(hojitasDisponibles(p)).toBe(10);
    expect(p.hojitas).toBe(40); // las ganadas no bajan (cuentan para el parque y el diploma)
    expect(accesoriosPuestos(p)).toEqual(['gorra']);
    expect(comprarAccesorio(p, 'gorra')).toBe(p); // ya es suya: no se cobra dos veces
  });

  it('quitársela no la pierde, y se puede volver a poner sin pagar', () => {
    let p = comprarAccesorio(conHojitas(100), 'lentes');
    p = alternarPuesto(p, 'lentes');
    expect(accesoriosPuestos(p)).toEqual([]);
    expect(p.accesorios).toEqual(['lentes']);
    p = alternarPuesto(p, 'lentes');
    expect(accesoriosPuestos(p)).toEqual(['lentes']);
    expect(hojitasDisponibles(p)).toBe(60);
    expect(alternarPuesto(p, 'capa')).toBe(p); // no es suya: no se puede poner
  });

  it('un grupo guardado antes de la v3 (sin accesorios) sigue funcionando', () => {
    expect(hojitasDisponibles(conHojitas(30))).toBe(30);
    expect(accesoriosPuestos(conHojitas(30))).toEqual([]);
  });
});
